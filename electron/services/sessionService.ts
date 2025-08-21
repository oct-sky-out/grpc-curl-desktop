import * as protobuf from 'protobufjs'

export interface GrpcSession {
  tabId: string
  protoPath?: string
  root?: protobuf.Root
  client?: any
  endpoint?: string
  serviceName?: string
  isConnected: boolean
  includeDirs?: string[]
}

class SessionService {
  private sessions = new Map<string, GrpcSession>()

  getOrCreateSession(tabId: string): GrpcSession {
    let session = this.sessions.get(tabId)
    if (!session) {
      session = {
        tabId,
        isConnected: false,
      }
      this.sessions.set(tabId, session)
    }
    return session
  }

  getSession(tabId: string): GrpcSession | undefined {
    return this.sessions.get(tabId)
  }

  updateSession(tabId: string, updates: Partial<GrpcSession>): void {
    const session = this.getOrCreateSession(tabId)
    Object.assign(session, updates)
  }

  setIncludeDirs(tabId: string, includeDirs: string[]): void {
    const session = this.getOrCreateSession(tabId)
    session.includeDirs = includeDirs
  }

  setProtoData(tabId: string, protoPath: string, root: protobuf.Root): void {
    const session = this.getOrCreateSession(tabId)
    session.protoPath = protoPath
    session.root = root
    session.isConnected = false // Reset connection when new proto is loaded
  }

  setClient(tabId: string, client: any, endpoint: string, serviceName: string): void {
    const session = this.getOrCreateSession(tabId)
    session.client = client
    session.endpoint = endpoint
    session.serviceName = serviceName
    session.isConnected = true
  }

  disconnect(tabId: string): void {
    const session = this.sessions.get(tabId)
    if (session?.client) {
      session.client.close()
      session.isConnected = false
      session.client = undefined
    }
  }

  getSessionStatus(tabId: string) {
    const session = this.sessions.get(tabId)
    return {
      exists: !!session,
      isConnected: session?.isConnected || false,
      hasProto: !!session?.root,
      endpoint: session?.endpoint,
      serviceName: session?.serviceName,
    }
  }
}

export const sessionService = new SessionService()