import { contextBridge, ipcRenderer, shell } from 'electron'

export interface ElectronAPI {
  selectProtoFile: () => Promise<{
    path: string
    content: string
    name: string
  } | null>
  selectIncludeDirs: () => Promise<string[]>
  copyToClipboard: (text: string) => Promise<boolean>
  grpc: {
    loadProto: (tabId: string, filePath: string) => Promise<{ success: boolean; error?: string }>
    createClient: (tabId: string, endpoint: string, serviceName: string) => Promise<{ success: boolean; error?: string }>
    makeRequest: (tabId: string, methodName: string, data: any) => Promise<{ success: boolean; data?: any; error?: string }>
    disconnect: (tabId: string) => Promise<{ success: boolean }>
    getSessionStatus: (tabId: string) => Promise<{ exists: boolean; isConnected: boolean; hasProto: boolean; endpoint?: string; serviceName?: string }>
    setIncludeDirs: (tabId: string, includeDirs: string[]) => Promise<{ success: boolean; error?: string }>
  }
  parseProto: (content: string) => Promise<{ success: boolean; data?: any; error?: string }>
  shell: {
    openExternal: (url: string) => Promise<void>
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  selectProtoFile: () => ipcRenderer.invoke('select-proto-file'),
  selectIncludeDirs: () => ipcRenderer.invoke('select-include-dirs'),
  copyToClipboard: (text: string) => ipcRenderer.invoke('copy-to-clipboard', text),
  grpc: {
    loadProto: (tabId: string, filePath: string) => ipcRenderer.invoke('grpc:load-proto', tabId, filePath),
    createClient: (tabId: string, endpoint: string, serviceName: string) => ipcRenderer.invoke('grpc:create-client', tabId, endpoint, serviceName),
    makeRequest: (tabId: string, methodName: string, data: any) => ipcRenderer.invoke('grpc:make-request', tabId, methodName, data),
    disconnect: (tabId: string) => ipcRenderer.invoke('grpc:disconnect', tabId),
    getSessionStatus: (tabId: string) => ipcRenderer.invoke('grpc:get-session-status', tabId),
    setIncludeDirs: (tabId: string, includeDirs: string[]) => ipcRenderer.invoke('grpc:set-include-dirs', tabId, includeDirs),
  },
  parseProto: (content: string) => ipcRenderer.invoke('parse-proto', content),
  shell: {
    openExternal: (url: string) => shell.openExternal(url),
  }
} as ElectronAPI)

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}