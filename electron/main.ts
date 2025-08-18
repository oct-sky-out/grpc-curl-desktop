import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import * as protobuf from 'protobufjs'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow: BrowserWindow

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
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

ipcMain.handle('copy-to-clipboard', async (_, text: string) => {
  const { clipboard } = await import('electron')
  clipboard.writeText(text)
  return true
})

// gRPC session management - each tab has complete session data
interface GrpcSession {
  tabId: string
  protoPath?: string
  packageDefinition?: any
  client?: any
  endpoint?: string
  serviceName?: string
  isConnected: boolean
}

const grpcSessions = new Map<string, GrpcSession>()

// Helper function to get or create session
const getOrCreateSession = (tabId: string): GrpcSession => {
  let session = grpcSessions.get(tabId)
  if (!session) {
    session = {
      tabId,
      isConnected: false
    }
    grpcSessions.set(tabId, session)
  }
  return session
}

// gRPC IPC handlers
ipcMain.handle('grpc:load-proto', async (_, tabId: string, filePath: string) => {
  try {
    const session = getOrCreateSession(tabId)
    
    const packageDefinition = protoLoader.loadSync(filePath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    })

    session.protoPath = filePath
    session.packageDefinition = packageDefinition
    session.isConnected = false // Reset connection when new proto is loaded
    
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('grpc:create-client', async (_, tabId: string, endpoint: string, serviceName: string) => {
  try {
    const session = grpcSessions.get(tabId)
    if (!session || !session.packageDefinition) {
      return { success: false, error: 'Proto file not loaded for this tab' }
    }

    const protoDescriptor = grpc.loadPackageDefinition(session.packageDefinition)
    const serviceConstructor = getNestedProperty(protoDescriptor, serviceName)

    if (!serviceConstructor) {
      return { success: false, error: `Service ${serviceName} not found` }
    }

    // Close existing client if any
    if (session.client) {
      try {
        session.client.close()
      } catch (e) {
        // Ignore close errors
      }
    }

    const grpcClient = new serviceConstructor(endpoint, grpc.credentials.createInsecure())
    
    // Update session
    session.client = grpcClient
    session.endpoint = endpoint
    session.serviceName = serviceName
    session.isConnected = true
    
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('grpc:make-request', async (_, tabId: string, methodName: string, data: any) => {
  return new Promise((resolve) => {
    const session = grpcSessions.get(tabId)
    if (!session || !session.client || !session.isConnected) {
      resolve({ success: false, error: 'Client not initialized for this tab' })
      return
    }

    const method = methodName.charAt(0).toLowerCase() + methodName.slice(1)
    
    if (!session.client[method]) {
      resolve({ success: false, error: `Method ${method} not found` })
      return
    }

    session.client[method](data, (error: any, response: any) => {
      if (error) {
        resolve({
          success: false,
          error: error.message || 'Request failed'
        })
      } else {
        resolve({
          success: true,
          data: response
        })
      }
    })
  })
})

ipcMain.handle('grpc:disconnect', async (_, tabId: string) => {
  const session = grpcSessions.get(tabId)
  if (session && session.client) {
    try {
      session.client.close()
    } catch (e) {
      // Ignore close errors
    }
    session.client = undefined
    session.isConnected = false
  }
  return { success: true }
})

// Get session status
ipcMain.handle('grpc:get-session-status', async (_, tabId: string) => {
  const session = grpcSessions.get(tabId)
  if (!session) {
    return { 
      exists: false,
      isConnected: false,
      hasProto: false
    }
  }
  
  return {
    exists: true,
    isConnected: session.isConnected,
    hasProto: !!session.packageDefinition,
    endpoint: session.endpoint,
    serviceName: session.serviceName
  }
})

function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] ? current[key] : null
  }, obj)
}

// Proto parsing IPC handler
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
            
            if (requestMessage) {
              requestMessage.fieldsArray.forEach((field) => {
                requestFields.push({
                  name: field.name,
                  type: field.type,
                  required: field.required,
                  repeated: field.repeated,
                })
              })
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
        } else if (nested instanceof protobuf.Namespace) {
          const childPath = parentPath ? `${parentPath}.${nested.name}` : nested.name
          findServices(nested, childPath)
        }
      })
    }

    findServices(root)

    return {
      success: true,
      data: {
        package: packageName,
        services,
        methods,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    }
  }
})
