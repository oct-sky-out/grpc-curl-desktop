import { dialog, BrowserWindow, clipboard } from 'electron'
import { readFileSync } from 'fs'

export interface ProtoFileResult {
  path: string
  content: string
  name: string
}

export const selectProtoFile = async (mainWindow: BrowserWindow): Promise<ProtoFileResult | null> => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Proto Files', extensions: ['proto'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0]
    const content = readFileSync(filePath, 'utf-8')
    return {
      path: filePath,
      content,
      name: filePath.split('/').pop() || 'unknown.proto',
    }
  }

  return null
}

export const selectIncludeDirectories = async (mainWindow: BrowserWindow): Promise<string[]> => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'multiSelections'],
    title: 'Select Include Directories'
  })

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths
  }

  return []
}

export const copyToClipboard = (text: string): boolean => {
  try {
    clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}