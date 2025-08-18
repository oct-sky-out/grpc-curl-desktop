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

export const parseProtoFile = async (content: string): Promise<ProtoInfo> => {
  try {
    const result = await window.electronAPI.parseProto(content)
    
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
      default:
        // For custom message types
        value = field.repeated ? [{}] : {}
        break
    }
    
    dummy[field.name] = value
  })
  
  return dummy
}