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
    // Try relative to origin file first
    if (origin) {
      const relativePath = path.resolve(path.dirname(origin), target)
      try {
        const fs = require('fs')
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
        const fs = require('fs')
        if (fs.existsSync(fullPath)) {
          return fullPath
        }
      } catch (e) {
        // Continue to next path
      }
    }

    // Fallback to default resolution
    return target
  }
}