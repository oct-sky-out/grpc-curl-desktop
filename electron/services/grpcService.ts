import * as grpc from '@grpc/grpc-js'
import * as protobuf from 'protobufjs'
import { sessionService } from './sessionService'
import { ServiceResult, createSuccessResult, createErrorResult } from '../utils/errorUtils'

const determineCredentials = (endpoint: string): grpc.ChannelCredentials => {
  const useSSL = endpoint.includes('https://') || 
                 endpoint.includes(':443') || 
                 endpoint.endsWith(':443') ||
                 (!endpoint.includes(':') && !endpoint.includes('localhost') && !endpoint.startsWith('127.0.0.1'))
  
  return useSSL ? grpc.credentials.createSsl() : grpc.credentials.createInsecure()
}

const cleanEndpoint = (endpoint: string): string => {
  return endpoint.replace(/^https?:\/\//, '')
}

const createServiceDefinition = (service: protobuf.Service, root: protobuf.Root): any => {
  const serviceDefinition: any = {}

  for (const [methodName, method] of Object.entries(service.methods)) {
    const methodObj = method as protobuf.Method

    serviceDefinition[methodName] = {
      path: `/${service.name}/${methodName}`,
      requestStream: methodObj.requestStream || false,
      responseStream: methodObj.responseStream || false,
      requestSerialize: (value: any) => {
        const requestType = root.lookupType(methodObj.requestType)
        try {
          // First validate and prepare the value
          let processedValue = value
          
          // Handle common protobuf conversion issues
          if (typeof value === 'string') {
            try {
              processedValue = JSON.parse(value)
            } catch (e) {
              // If it's not JSON, treat as string field
              processedValue = { value: value }
            }
          }
          
          // First create a basic message, then apply fromObject for better type conversion
          const baseMessage = requestType.create(processedValue)
          const message = requestType.fromObject(processedValue)
          
          return requestType.encode(message).finish()
        } catch (error) {
          console.error(`Failed to serialize ${methodObj.requestType}:`, error)
          console.error(`Input value:`, JSON.stringify(value, null, 2))
          console.error(`Request type fields:`, requestType.fieldsArray.map(f => `${f.name}:${f.type}`))
          throw error
        }
      },
      requestDeserialize: (buffer: Buffer) => {
        const requestType = root.lookupType(methodObj.requestType)
        return requestType.decode(buffer)
      },
      responseSerialize: (value: any) => {
        const responseType = root.lookupType(methodObj.responseType)
        const message = responseType.create(value)
        return responseType.encode(message).finish()
      },
      responseDeserialize: (buffer: Buffer) => {
        const responseType = root.lookupType(methodObj.responseType)
        return responseType.decode(buffer)
      },
    }
  }

  return serviceDefinition
}

export const createGrpcClient = (tabId: string, endpoint: string, serviceName: string): ServiceResult => {
  try {
    const session = sessionService.getSession(tabId)
    if (!session?.root) {
      return createErrorResult('No proto file loaded')
    }

    // Find the service in the proto definition
    const service = session.root.lookupService(serviceName)
    if (!service) {
      return createErrorResult(`Service ${serviceName} not found`)
    }

    // Create service definition
    const serviceDefinition = createServiceDefinition(service, session.root)

    // Create gRPC client
    const clientConstructor = grpc.makeGenericClientConstructor(serviceDefinition, serviceName)
    const credentials = determineCredentials(endpoint)
    const cleanedEndpoint = cleanEndpoint(endpoint)
    
    const client = new clientConstructor(cleanedEndpoint, credentials)

    // Store client in session
    sessionService.setClient(tabId, client, endpoint, serviceName)

    return createSuccessResult()
  } catch (error) {
    return createErrorResult(error instanceof Error ? error : new Error(String(error)))
  }
}

export const makeGrpcRequest = (tabId: string, methodName: string, data: any): Promise<ServiceResult<any>> => {
  return new Promise((resolve) => {
    try {
      const session = sessionService.getSession(tabId)
      
      if (!session?.client || !session.root) {
        resolve(createErrorResult('Client not connected or proto not loaded'))
        return
      }

      session.client[methodName](data, (error: any, response: any) => {
        if (error) {
          resolve(createErrorResult(error.message))
        } else {
          // Convert protobuf message to plain object
          const plainResponse = JSON.parse(JSON.stringify(response))
          resolve(createSuccessResult(plainResponse))
        }
      })
    } catch (error) {
      resolve(createErrorResult(error instanceof Error ? error : new Error(String(error))))
    }
  })
}

export const disconnectClient = (tabId: string): ServiceResult => {
  try {
    sessionService.disconnect(tabId)
    return createSuccessResult()
  } catch (error) {
    return createErrorResult(error instanceof Error ? error : new Error(String(error)))
  }
}