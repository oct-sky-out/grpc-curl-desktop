import * as path from 'path'

export const buildIncludePaths = (filePath: string, userIncludeDirs: string[] = []): string[] => {
  const includePaths = [
    ...userIncludeDirs,
    path.dirname(filePath),
    path.dirname(path.dirname(filePath)),
  ]

  // Add protobufjs built-in google types path if available
  try {
    const protobufModulePath = require.resolve('protobufjs')
    const protobufDir = path.dirname(protobufModulePath)
    includePaths.push(protobufDir)
  } catch (e) {
    // protobufjs module path not found, skip
  }

  return includePaths
}

export const createPathResolver = (includePaths: string[]) => {
  return (origin: string, target: string): string => {
    // Handle Google well-known types specially
    if (target.startsWith('google/protobuf/')) {
      try {
        // Try multiple potential locations for Google proto files
        const potentialPaths = [
          // In protobufjs module
          require.resolve(`protobufjs/${target}`),
          // In node_modules
          require.resolve(`protobufjs/google/protobuf/${target.split('/').pop()}`),
        ]
        
        const fs = require('fs')
        for (const protoPath of potentialPaths) {
          try {
            if (fs.existsSync(protoPath)) {
              return protoPath
            }
          } catch (e) {
            // Continue to next path
          }
        }
        
        // Fallback: try to find in protobufjs installation directory
        const protobufjsPath = require.resolve('protobufjs')
        const protobufDir = path.dirname(protobufjsPath)
        const googleProtoPath = path.join(protobufDir, target)
        
        if (fs.existsSync(googleProtoPath)) {
          return googleProtoPath
        }
        
      } catch (e) {
        // Continue to regular resolution
      }
    }
    
    const fs = require('fs')
    
    // Try relative to origin file first
    if (origin) {
      const relativePath = path.resolve(path.dirname(origin), target)
      try {
        if (fs.existsSync(relativePath)) {
          return relativePath
        }
      } catch (e) {
        // Continue to next attempt
      }
    }

    // Try each include path
    for (const includePath of includePaths) {
      const fullPath = path.resolve(includePath, target)
      try {
        if (fs.existsSync(fullPath)) {
          return fullPath
        }
      } catch (e) {
        // Continue to next path
      }
    }
    
    // Try without .proto extension if not present
    if (!target.endsWith('.proto')) {
      const targetWithExt = target + '.proto'
      
      if (origin) {
        const relativePath = path.resolve(path.dirname(origin), targetWithExt)
        try {
          if (fs.existsSync(relativePath)) {
            return relativePath
          }
        } catch (e) {
          // Continue
        }
      }
      
      for (const includePath of includePaths) {
        const fullPath = path.resolve(includePath, targetWithExt)
        try {
          if (fs.existsSync(fullPath)) {
            return fullPath
          }
        } catch (e) {
          // Continue
        }
      }
    }

    // Fallback to default resolution
    return target
  }
}