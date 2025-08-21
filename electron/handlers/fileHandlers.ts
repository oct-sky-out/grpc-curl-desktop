import { ipcMain, BrowserWindow } from 'electron'
import { selectProtoFile, selectIncludeDirectories, copyToClipboard } from '../services/fileService'

export const registerFileHandlers = (mainWindow: BrowserWindow) => {
  ipcMain.handle('select-proto-file', async () => {
    return await selectProtoFile(mainWindow)
  })

  ipcMain.handle('select-include-dirs', async () => {
    return await selectIncludeDirectories(mainWindow)
  })

  ipcMain.handle('copy-to-clipboard', async (_, text: string) => {
    return copyToClipboard(text)
  })
}