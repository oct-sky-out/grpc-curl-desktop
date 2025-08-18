import { GrpcRequest, GrpcResponse } from '@/types'

export class GrpcClient {
  private tabId: string

  constructor(tabId: string) {
    this.tabId = tabId
  }

  async loadProto(filePath: string): Promise<void> {
    const result = await window.electronAPI.grpc.loadProto(this.tabId, filePath)
    console.log('Proto load result:', result)
    if (!result.success) {
      throw new Error(result.error || 'Failed to load proto file')
    }
  }

  async createClient(endpoint: string, serviceName: string): Promise<void> {
    const result = await window.electronAPI.grpc.createClient(this.tabId, endpoint, serviceName)
    console.log('Create client result:', result)
    if (!result.success) {
      throw new Error(result.error || 'Failed to create client')
    }
  }

  async makeRequest(request: GrpcRequest): Promise<GrpcResponse> {
    const result = await window.electronAPI.grpc.makeRequest(this.tabId, request.method.name, request.data)
    
    if (result.success) {
      return {
        data: result.data,
        error: undefined,
        status: 'SUCCESS',
      }
    } else {
      return {
        data: null,
        error: result.error || 'Request failed',
        status: 'ERROR',
      }
    }
  }

  async disconnect(): Promise<void> {
    await window.electronAPI.grpc.disconnect(this.tabId)
  }
}