import { faker } from '@faker-js/faker'
import { ProtoField } from '@/types'

/**
 * Generate dummy data based on proto field type
 */
export function generateDummyValue(fieldType: string, isRepeated: boolean = false): any {
  const generateSingleValue = (type: string): any => {
    switch (type.toLowerCase()) {
      case 'string':
        return faker.lorem.words(2)
      
      case 'int32':
      case 'int64':
      case 'sint32':
      case 'sint64':
      case 'sfixed32':
      case 'sfixed64':
        return faker.number.int({ min: 1, max: 1000 })
      
      case 'uint32':
      case 'uint64':
      case 'fixed32':
      case 'fixed64':
        return faker.number.int({ min: 0, max: 1000 })
      
      case 'double':
      case 'float':
        return faker.number.float({ min: 0, max: 100, fractionDigits: 2 })
      
      case 'bool':
      case 'boolean':
        return faker.datatype.boolean()
      
      case 'bytes':
        return faker.string.alphanumeric(16)
      
      default:
        // For custom message types or enums
        if (type.includes('enum') || type.includes('Enum')) {
          return faker.helpers.arrayElement(['OPTION_A', 'OPTION_B', 'OPTION_C'])
        }
        return faker.lorem.word()
    }
  }

  if (isRepeated) {
    const arrayLength = faker.number.int({ min: 1, max: 3 })
    return Array.from({ length: arrayLength }, () => generateSingleValue(fieldType))
  }

  return generateSingleValue(fieldType)
}

/**
 * Generate dummy data for a complete proto message
 */
export function generateDummyDataForMessage(fields: ProtoField[]): any {
  const result: any = {}

  fields.forEach(field => {
    if (field.nestedFields && field.nestedFields.length > 0) {
      // Handle nested message
      if (field.repeated) {
        const arrayLength = faker.number.int({ min: 1, max: 2 })
        result[field.name] = Array.from({ length: arrayLength }, () => 
          generateDummyDataForMessage(field.nestedFields!)
        )
      } else {
        result[field.name] = generateDummyDataForMessage(field.nestedFields)
      }
    } else {
      // Handle primitive field
      if (field.required || faker.datatype.boolean(0.8)) { // 80% chance to include optional fields
        result[field.name] = generateDummyValue(field.type, field.repeated)
      }
    }
  })

  return result
}

/**
 * Generate dummy data for a gRPC method using its request fields
 */
export function generateDummyDataForMethod(requestFields?: ProtoField[]): any {
  if (!requestFields || requestFields.length === 0) {
    // Fallback to common fields if no request fields available
    const commonFields: ProtoField[] = [
      { name: 'id', type: 'string', repeated: false, required: true },
      { name: 'name', type: 'string', repeated: false, required: true },
      { name: 'email', type: 'string', repeated: false, required: false },
      { name: 'age', type: 'int32', repeated: false, required: false },
      { name: 'isActive', type: 'bool', repeated: false, required: false },
      { name: 'tags', type: 'string', repeated: true, required: false },
      { name: 'score', type: 'double', repeated: false, required: false },
    ]
    return generateDummyDataForMessage(commonFields)
  }

  return generateDummyDataForMessage(requestFields)
}