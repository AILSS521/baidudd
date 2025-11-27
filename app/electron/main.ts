import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'

let mainWindow: BrowserWindow | null = null
let aria2Process: ChildProcess | null = null

// Aria2配置
const ARIA2_CONFIG = {
  maxConcurrentDownloads: 3,
  maxConnectionPerServer: 64,
  split: 64,
  checkCertificate: false,
  fileAllocation: 'prealloc'
}

// 获取默认下载目录
function getDefaultDownloadPath(): string {
  const downloadPath = path.join(os.homedir(), 'Downloads', '图片下载器')
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true })
  }
  return downloadPath
}

// 获取aria2可执行文件路径
function getAria2Path(): string {
  const isDev = !app.isPackaged
  if (isDev) {
    return path.join(__dirname, '..', 'aria2', process.platform === 'win32' ? 'aria2c.exe' : 'aria2c')
  }
  return path.join(process.resourcesPath, 'aria2', process.platform === 'win32' ? 'aria2c.exe' : 'aria2c')
}

// 启动aria2
function startAria2(): Promise<void> {
  return new Promise((resolve, reject) => {
    const aria2Path = getAria2Path()

    if (!fs.existsSync(aria2Path)) {
      reject(new Error('aria2 not found'))
      return
    }

    const args = [
      '--enable-rpc',
      '--rpc-listen-all=false',
      '--rpc-listen-port=6800',
      '--rpc-allow-origin-all',
      `--max-concurrent-downloads=${ARIA2_CONFIG.maxConcurrentDownloads}`,
      `--max-connection-per-server=${ARIA2_CONFIG.maxConnectionPerServer}`,
      `--split=${ARIA2_CONFIG.split}`,
      `--check-certificate=${ARIA2_CONFIG.checkCertificate}`,
      `--file-allocation=${ARIA2_CONFIG.fileAllocation}`,
      '--continue=true',
      '--auto-file-renaming=false',
      '--allow-overwrite=true'
    ]

    aria2Process = spawn(aria2Path, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    })

    aria2Process.on('error', (error) => {
      console.error('aria2 error:', error)
      reject(error)
    })

    aria2Process.stdout?.on('data', (data) => {
      console.log('aria2:', data.toString())
    })

    aria2Process.stderr?.on('data', (data) => {
      console.error('aria2 error:', data.toString())
    })

    // 等待aria2启动
    setTimeout(() => resolve(), 1000)
  })
}

// 停止aria2
function stopAria2(): void {
  if (aria2Process) {
    aria2Process.kill()
    aria2Process = null
  }
}

// 创建主窗口
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC处理
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })
  return result.filePaths[0] || null
})

ipcMain.handle('shell:openPath', async (_, filePath: string) => {
  await shell.openPath(filePath)
})

ipcMain.handle('shell:showItemInFolder', async (_, filePath: string) => {
  shell.showItemInFolder(filePath)
})

ipcMain.handle('settings:getDownloadPath', () => {
  return getDefaultDownloadPath()
})

ipcMain.handle('settings:setDownloadPath', (_, newPath: string) => {
  if (!fs.existsSync(newPath)) {
    fs.mkdirSync(newPath, { recursive: true })
  }
  return newPath
})

ipcMain.handle('aria2:getPort', () => {
  return 6800
})

// 应用生命周期
app.whenReady().then(async () => {
  try {
    await startAria2()
  } catch (error) {
    console.error('Failed to start aria2:', error)
  }
  createWindow()
})

app.on('window-all-closed', () => {
  stopAria2()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  stopAria2()
})
