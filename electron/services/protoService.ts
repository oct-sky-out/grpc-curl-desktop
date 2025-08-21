import * as protobuf from 'protobufjs'
import { ServiceResult, createSuccessResult, createErrorResult, wrapAsync } from '../utils/errorUtils'
import { buildIncludePaths, createPathResolver } from '../utils/pathUtils'

export const loadProtoFile = async (filePath: string, userIncludeDirs: string[] = []): Promise<ServiceResult<protobuf.Root>> => {
  return wrapAsync(async () => {
    // Create root and try to load common types
    const root = new protobuf.Root()
    const includePaths = buildIncludePaths(filePath, userIncludeDirs)
    
    // Try to load common Google types if available
    try {
      if (protobuf.common) {
        root.addJSON(protobuf.common as any)
      }
    } catch (e) {
      console.warn('Could not load common protobuf types:', e)
    }
    
    root.resolvePath = createPathResolver(includePaths)
    
    await root.load(filePath)
    
    return root
  })
}

const extractFields = (message: protobuf.Type, root: protobuf.Root, visited = new Set<string>()): any[] => {
  if (visited.has(message.fullName)) {
    return []
  }
  visited.add(message.fullName)

  return message.fieldsArray.map((field) => {
    const fieldInfo: any = {
      name: field.name,
      type: field.type,
      required: field.required,
      repeated: field.repeated,
    }

    try {
      const nestedType = root.lookupType(field.type)
      if (nestedType?.fieldsArray?.length > 0) {
        fieldInfo.nestedFields = extractFields(nestedType, root, new Set(visited))
      }
    } catch (e) {
      // Not a nested message type, just a primitive
    }

    return fieldInfo
  })
}

const extractPackageName = (root: protobuf.Root): string => {
  const namespaces = Array.from(root.nestedArray)
  for (const namespace of namespaces) {
    if (namespace.name && namespace.name !== '') {
      return namespace.name
    }
  }
  return ''
}

const findServices = (root: protobuf.Root): { services: any[], methods: any[] } => {
  const methods: any[] = []
  const services: any[] = []

  const searchNamespace = (namespace: protobuf.Namespace, parentPath = '') => {
    namespace.nestedArray.forEach((nested) => {
      if (nested instanceof protobuf.Service) {
        const service = nested as protobuf.Service
        const fullServiceName = parentPath ? `${parentPath}.${service.name}` : service.name
        const serviceMethodNames: string[] = []

        service.methodsArray.forEach((method) => {
          const requestMessage = root.lookupType(method.requestType)
          const requestFields = requestMessage ? extractFields(requestMessage, root) : []

          methods.push({
            name: method.name,
            service: fullServiceName,
            inputType: method.requestType,
            outputType: method.responseType,
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
        searchNamespace(nested, nestedPath)
      }
    })
  }

  searchNamespace(root)
  return { services, methods }
}

export const parseProtoWithRoot = (root: protobuf.Root): ServiceResult<{ packageName: string, services: any[], methods: any[] }> => {
  try {
    const packageName = extractPackageName(root)
    const { services, methods } = findServices(root)
    return createSuccessResult({ packageName, services, methods })
  } catch (error) {
    return createErrorResult(error instanceof Error ? error : new Error(String(error)))
  }
}

export const parseProtoFile = async (
  content: string, 
  filePath?: string, 
  userIncludeDirs: string[] = []
): Promise<ServiceResult<{ packageName: string, services: any[], methods: any[] }>> => {
  return wrapAsync(async () => {
    let root: protobuf.Root

    if (filePath) {
      const loadResult = await loadProtoFile(filePath, userIncludeDirs)
      if (!loadResult.success) {
        throw new Error(loadResult.error)
      }
      root = loadResult.data!
    } else {
      const parsed = protobuf.parse(content)
      root = parsed.root
    }

    const parseResult = parseProtoWithRoot(root)
    if (!parseResult.success) {
      throw new Error(parseResult.error)
    }
    
    return parseResult.data!
  })
}