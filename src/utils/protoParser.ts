import { ProtoMethod, ProtoField } from '@/types'

export interface ProtoInfo {
  package: string
  services: ServiceInfo[]
  methods: ProtoMethod[]
}

export interface ServiceInfo {
  name: string
  fullName: string
  methods: string[]
}

export const parseProtoFile = async (content: string, filePath?: string, tabId?: string): Promise<ProtoInfo> => {
  try {
    const result = await window.electronAPI.parseProto(content, filePath, tabId)
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to parse proto file')
    }

    return result.data
  } catch (error) {
    console.error('Failed to parse proto file:', error)
    throw new Error('Invalid proto file format')
  }
}

export const generateDummyJson = (fields: ProtoField[]): any => {
  const dummy: any = {}
  
  fields.forEach((field) => {
    let value: any
    
    switch (field.type) {
      case 'string':
        value = field.repeated ? ['example'] : 'example'
        break
      case 'int32':
      case 'int64':
      case 'uint32':
      case 'uint64':
      case 'sint32':
      case 'sint64':
      case 'fixed32':
      case 'fixed64':
      case 'sfixed32':
      case 'sfixed64':
        value = field.repeated ? [123] : 123
        break
      case 'double':
      case 'float':
        value = field.repeated ? [123.45] : 123.45
        break
      case 'bool':
        value = field.repeated ? [true] : true
        break
      case 'bytes':
        value = field.repeated ? ['base64data'] : 'base64data'
        break
      // Google well-known types
      case 'google.protobuf.Timestamp':
        value = field.repeated 
          ? [{ seconds: Math.floor(Date.now() / 1000), nanos: 0 }] 
          : { seconds: Math.floor(Date.now() / 1000), nanos: 0 }
        break
      case 'google.protobuf.Duration':
        value = field.repeated 
          ? [{ seconds: 300, nanos: 0 }] 
          : { seconds: 300, nanos: 0 }
        break
      case 'google.protobuf.Empty':
        value = field.repeated ? [{}] : {}
        break
      case 'google.protobuf.StringValue':
        value = field.repeated 
          ? [{ value: 'example' }] 
          : { value: 'example' }
        break
      case 'google.protobuf.Int32Value':
      case 'google.protobuf.Int64Value':
        value = field.repeated 
          ? [{ value: 123 }] 
          : { value: 123 }
        break
      case 'google.protobuf.BoolValue':
        value = field.repeated 
          ? [{ value: true }] 
          : { value: true }
        break
      case 'google.protobuf.Any':
        value = field.repeated 
          ? [{ type_url: 'type.googleapis.com/example.Type', value: 'example' }] 
          : { type_url: 'type.googleapis.com/example.Type', value: 'example' }
        break
      case 'google.protobuf.Struct':
        value = field.repeated 
          ? [{ fields: { example: { string_value: 'value' } } }] 
          : { fields: { example: { string_value: 'value' } } }
        break
      default:
        // For custom message types and unknown types
        if (field.type.startsWith('google.protobuf.')) {
          // Handle other Google types with generic wrapper
          value = field.repeated ? [{ value: 'example' }] : { value: 'example' }
        } else {
          // Custom message types
          value = field.repeated ? [{}] : {}
        }
        break
    }
    
    dummy[field.name] = value
  })
  
  return dummy
}