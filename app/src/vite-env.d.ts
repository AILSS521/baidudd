/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'path-browserify'

interface ElectronAPI {
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

interface Window {
  electronAPI: ElectronAPI
}
