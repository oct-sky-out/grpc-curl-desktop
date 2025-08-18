/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Electron API types
interface ElectronAPI {
  selectProtoFile: () => Promise<{
    path: string
    content: string
    name: string
  } | null>
  copyToClipboard: (text: string) => Promise<boolean>
  grpc: {
    loadProto: (tabId: string, filePath: string) => Promise<{ success: boolean; error?: string }>
    createClient: (tabId: string, endpoint: string, serviceName: string) => Promise<{ success: boolean; error?: string }>
    makeRequest: (tabId: string, methodName: string, data: any) => Promise<{ success: boolean; data?: any; error?: string }>
    disconnect: (tabId: string) => Promise<{ success: boolean }>
    getSessionStatus: (tabId: string) => Promise<{ exists: boolean; isConnected: boolean; hasProto: boolean; endpoint?: string; serviceName?: string }>
  }
  parseProto: (content: string) => Promise<{ success: boolean; data?: any; error?: string }>
  shell: {
    openExternal: (url: string) => Promise<void>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}