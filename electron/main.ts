import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import * as path from 'path'
import { readFileSync } from 'fs'
import * as grpc from '@grpc/grpc-js'
import * as protobuf from 'protobufjs'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow: BrowserWindow

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// File selection handlers
ipcMain.handle('select-proto-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Proto Files', extensions: ['proto'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0]
    console.log('Selected proto file:', filePath)
    const content = readFileSync(filePath, 'utf-8')
    return {
      path: filePath,
      content,
      name: filePath.split('/').pop() || 'unknown.proto',
    }
  }

  return null
})

ipcMain.handle('select-include-dirs', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'multiSelections'],
    title: 'Select Include Directories'
  })

  if (!result.canceled && result.filePaths.length > 0) {
    console.log('Selected include directories:', result.filePaths)
    return result.filePaths
  }

  return []
})

ipcMain.handle('copy-to-clipboard', async (_, text: string) => {
  const { clipboard } = await import('electron')
  clipboard.writeText(text)
  return true
})

ipcMain.handle('grpc:set-include-dirs', async (_, tabId: string, includeDirs: string[]) => {
  try {
    const session = getOrCreateSession(tabId)
    session.includeDirs = includeDirs
    console.log('Set include dirs for tab', tabId, ':', includeDirs)
    return { success: true }
  } catch (error) {
    console.error('Failed to set include dirs:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// gRPC session management - each tab has complete session data
interface GrpcSession {
  tabId: string
  protoPath?: string
  root?: protobuf.Root
  client?: any
  endpoint?: string
  serviceName?: string
  isConnected: boolean
  includeDirs?: string[]
}

const grpcSessions = new Map<string, GrpcSession>()

// Helper function to get or create session
const getOrCreateSession = (tabId: string): GrpcSession => {
  let session = grpcSessions.get(tabId)
  if (!session) {
    session = {
      tabId,
      isConnected: false,
    }
    grpcSessions.set(tabId, session)
  }
  return session
}

// gRPC IPC handlers
ipcMain.handle('grpc:load-proto', async (_, tabId: string, filePath: string) => {
  try {
    const session = getOrCreateSession(tabId)
    
    console.log('Loading proto file:', filePath)
    
    // Create custom root with better path resolution
    const root = new protobuf.Root()
    
    // Build include paths
    const includePaths = [
      ...(session.includeDirs || []), // User selected directories
      path.dirname(filePath),     // Current file directory (highest priority)
      path.dirname(path.dirname(filePath)), // Parent directory
    ]
    
    // Add protobufjs built-in google types path if available
    try {
      const protobufModulePath = require.resolve('protobufjs')
      const protobufDir = path.dirname(protobufModulePath)
      includePaths.push(protobufDir)
    } catch (e) {
      // protobufjs module path not found, skip
    }
    
    console.log('Using include paths:', includePaths)
    
    // Set up custom resolver for imports
    root.resolvePath = (origin: string, target: string) => {
      console.log(`Resolving import: ${target} from ${origin}`)
      
      // Try relative to origin file first
      if (origin) {
        const relativePath = path.resolve(path.dirname(origin), target)
        try {
          const fs = require('fs')
          if (fs.existsSync(relativePath)) {
            console.log(`Found at: ${relativePath}`)
            return relativePath
          }
        } catch (e) {
          // Continue to next attempt
        }
      }
      
      // Try each include path
      for (const includePath of includePaths) {
        const fullPath = path.resolve(includePath, target)
        try {
          const fs = require('fs')
          if (fs.existsSync(fullPath)) {
            console.log(`Found at: ${fullPath}`)
            return fullPath
          }
        } catch (e) {
          // Continue to next path
        }
      }
      
      // Fallback to default protobufjs resolution
      console.log(`Using default resolution for: ${target}`)
      return target
    }
    
    // Load the main proto file
    await root.load(filePath)
    
    session.protoPath = filePath
    session.root = root
    session.isConnected = false // Reset connection when new proto is loaded
    
    console.log('Proto loaded successfully:', filePath)
    return { success: true }
  } catch (error) {
    console.error('Failed to load proto:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('grpc:create-client', async (_, tabId: string, endpoint: string, serviceName: string) => {
  try {
    const session = getOrCreateSession(tabId)
    
    if (!session.root) {
      return { success: false, error: 'No proto file loaded' }
    }
    
    console.log('Creating gRPC client for:', endpoint, serviceName)
    
    // Find the service in the proto definition
    const service = session.root.lookupService(serviceName)
    if (!service) {
      return { success: false, error: `Service ${serviceName} not found` }
    }
    
    // Convert protobufjs service to gRPC-compatible format
    const serviceDefinition: any = {}
    
    for (const [methodName, method] of Object.entries(service.methods)) {
      const methodObj = method as protobuf.Method
      
      serviceDefinition[methodName] = {
        path: `/${serviceName}/${methodName}`,
        requestStream: methodObj.requestStream || false,
        responseStream: methodObj.responseStream || false,
        requestSerialize: (value: any) => {
          const requestType = session.root!.lookupType(methodObj.requestType)
          const message = requestType.create(value)
          return requestType.encode(message).finish()
        },
        requestDeserialize: (buffer: Buffer) => {
          const requestType = session.root!.lookupType(methodObj.requestType)
          return requestType.decode(buffer)
        },
        responseSerialize: (value: any) => {
          const responseType = session.root!.lookupType(methodObj.responseType)
          const message = responseType.create(value)
          return responseType.encode(message).finish()
        },
        responseDeserialize: (buffer: Buffer) => {
          const responseType = session.root!.lookupType(methodObj.responseType)
          return responseType.decode(buffer)
        },
      }
    }
    
    // Create gRPC client
    const clientConstructor = grpc.makeGenericClientConstructor(serviceDefinition, serviceName)
    const client = new clientConstructor(endpoint, grpc.credentials.createInsecure())
    
    session.client = client
    session.endpoint = endpoint
    session.serviceName = serviceName
    session.isConnected = true
    
    console.log('gRPC client created successfully')
    return { success: true }
  } catch (error) {
    console.error('Failed to create gRPC client:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('grpc:make-request', async (_, tabId: string, methodName: string, data: any) => {
  try {
    const session = getOrCreateSession(tabId)
    
    if (!session.client || !session.root) {
      return { success: false, error: 'Client not connected or proto not loaded' }
    }
    
    console.log('Making gRPC request:', methodName, data)
    
    return new Promise((resolve) => {
      session.client[methodName](data, (error: any, response: any) => {
        if (error) {
          console.error('gRPC request failed:', error)
          resolve({ success: false, error: error.message })
        } else {
          console.log('gRPC request successful:', response)
          // Convert protobuf message to plain object
          const plainResponse = JSON.parse(JSON.stringify(response))
          resolve({ success: true, data: plainResponse })
        }
      })
    })
  } catch (error) {
    console.error('Failed to make gRPC request:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('grpc:disconnect', async (_, tabId: string) => {
  try {
    const session = grpcSessions.get(tabId)
    if (session?.client) {
      session.client.close()
      session.isConnected = false
    }
    return { success: true }
  } catch (error) {
    console.error('Failed to disconnect gRPC client:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('grpc:get-session-status', async (_, tabId: string) => {
  const session = grpcSessions.get(tabId)
  return {
    exists: !!session,
    isConnected: session?.isConnected || false,
    hasProto: !!session?.root,
    endpoint: session?.endpoint,
    serviceName: session?.serviceName,
  }
})

// Proto parsing for UI
ipcMain.handle('parse-proto', async (_, content: string) => {
  try {
    const parsed = protobuf.parse(content)
    const root = parsed.root
    const methods: any[] = []
    const services: any[] = []
    
    // Extract package name
    const packageName = parsed.package || ''

    const findServices = (namespace: protobuf.Namespace, parentPath = '') => {
      namespace.nestedArray.forEach((nested) => {
        if (nested instanceof protobuf.Service) {
          const service = nested as protobuf.Service
          const fullServiceName = parentPath ? `${parentPath}.${service.name}` : service.name
          const serviceMethodNames: string[] = []
          
          service.methodsArray.forEach((method) => {
            const inputType = method.requestType
            const outputType = method.responseType
            
            // Find the message type for request fields
            const requestMessage = root.lookupType(inputType)
            const requestFields: any[] = []
            
            // Helper function to extract nested field structure
            const extractFields = (message: protobuf.Type): any[] => {
              return message.fieldsArray.map((field) => {
                const fieldInfo: any = {
                  name: field.name,
                  type: field.type,
                  required: field.required,
                  repeated: field.repeated,
                }
                
                // Check if this field is a nested message type
                try {
                  const nestedType = root.lookupType(field.type)
                  if (nestedType && nestedType.fieldsArray.length > 0) {
                    fieldInfo.nestedFields = extractFields(nestedType)
                  }
                } catch (e) {
                  // Not a nested message type, just a primitive
                }
                
                return fieldInfo
              })
            }
            
            if (requestMessage) {
              requestFields.push(...extractFields(requestMessage))
            }

            methods.push({
              name: method.name,
              service: fullServiceName,
              inputType,
              outputType,
              requestFields,
            })
            
            serviceMethodNames.push(method.name)
          })
          
          services.push({
            name: service.name,
            fullName: fullServiceName,
            methods: serviceMethodNames,
          })
        }
        
        if (nested instanceof protobuf.Namespace) {
          const nestedPath = parentPath ? `${parentPath}.${nested.name}` : nested.name
          findServices(nested, nestedPath)
        }
      })
    }

    findServices(root)

    console.log('Proto parsed successfully:')
    console.log('- Package:', packageName)
    console.log('- Services:', services.length)
    console.log('- Methods:', methods.length)

    return {
      success: true,
      data: {
        packageName,
        services,
        methods,
      },
    }
  } catch (error) {
    console.error('Failed to parse proto:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})