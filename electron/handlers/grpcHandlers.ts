import { ipcMain } from 'electron'
import { sessionService } from '../services/sessionService'
import { loadProtoFile, parseProtoFile, parseProtoWithRoot } from '../services/protoService'
import { createGrpcClient, makeGrpcRequest, disconnectClient } from '../services/grpcService'

export const registerGrpcHandlers = () => {
  // Session management
  ipcMain.handle('grpc:set-include-dirs', async (_, tabId: string, includeDirs: string[]) => {
    try {
      sessionService.setIncludeDirs(tabId, includeDirs)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Proto loading
  ipcMain.handle('grpc:load-proto', async (_, tabId: string, filePath: string) => {
    try {
      const session = sessionService.getOrCreateSession(tabId)
      
      // Clear any existing client when loading new proto
      if (session.client) {
        sessionService.disconnect(tabId)
      }

      const result = await loadProtoFile(filePath, session.includeDirs)
      if (!result.success) {
        return result
      }

      sessionService.setProtoData(tabId, filePath, result.data!)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Client creation
  ipcMain.handle('grpc:create-client', async (_, tabId: string, endpoint: string, serviceName: string) => {
    return createGrpcClient(tabId, endpoint, serviceName)
  })

  // Request handling
  ipcMain.handle('grpc:make-request', async (_, tabId: string, methodName: string, data: any) => {
    return await makeGrpcRequest(tabId, methodName, data)
  })

  // Disconnection
  ipcMain.handle('grpc:disconnect', async (_, tabId: string) => {
    return disconnectClient(tabId)
  })

  // Session status
  ipcMain.handle('grpc:get-session-status', async (_, tabId: string) => {
    return sessionService.getSessionStatus(tabId)
  })
}

export const registerProtoHandlers = () => {
  ipcMain.handle('parse-proto', async (_, content: string, filePath?: string, tabId?: string) => {
    try {
      // If tabId is provided and session already has a loaded root, use that
      if (tabId) {
        const session = sessionService.getSession(tabId)
        if (session?.root && session.protoPath === filePath) {
          return parseProtoWithRoot(session.root)
        }
      }

      // Get user's include directories if tabId is provided
      const userIncludeDirs = tabId ? 
        sessionService.getSession(tabId)?.includeDirs || [] : []

      const result = await parseProtoFile(content, filePath, userIncludeDirs)
      
      // Store root in session for consistency if tabId provided
      if (result.success && tabId && filePath) {
        const loadResult = await loadProtoFile(filePath, userIncludeDirs)
        if (loadResult.success) {
          sessionService.setProtoData(tabId, filePath, loadResult.data!)
        }
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
}