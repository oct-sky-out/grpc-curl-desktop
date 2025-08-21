import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import { registerFileHandlers } from './handlers/fileHandlers'
import { registerGrpcHandlers, registerProtoHandlers } from './handlers/grpcHandlers'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow: BrowserWindow

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

const registerAllHandlers = () => {
  registerFileHandlers(mainWindow)
  registerGrpcHandlers()
  registerProtoHandlers()
}

app.whenReady().then(() => {
  createWindow()
  registerAllHandlers()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

