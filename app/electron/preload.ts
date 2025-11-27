import { contextBridge, ipcRenderer } from 'electron'

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),

  // 文件对话框
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),

  // Shell操作
  openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
  showItemInFolder: (path: string) => ipcRenderer.invoke('shell:showItemInFolder', path),

  // 设置
  getDownloadPath: () => ipcRenderer.invoke('settings:getDownloadPath'),
  setDownloadPath: (path: string) => ipcRenderer.invoke('settings:setDownloadPath', path),

  // aria2
  getAria2Port: () => ipcRenderer.invoke('aria2:getPort')
})

// 类型声明
export interface ElectronAPI {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  selectFolder: () => Promise<string | null>
  openPath: (path: string) => Promise<void>
  showItemInFolder: (path: string) => Promise<void>
  getDownloadPath: () => Promise<string>
  setDownloadPath: (path: string) => Promise<string>
  getAria2Port: () => Promise<number>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
