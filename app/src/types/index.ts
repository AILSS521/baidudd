// 文件项
export interface FileItem {
  fs_id: number | string
  server_filename: string
  path: string
  size: number
  isdir: number
  server_mtime: number
  category?: number
  md5?: string
}

// 任务状态
export type TaskStatus = 'waiting' | 'processing' | 'downloading' | 'paused' | 'completed' | 'error'

// 下载任务
export interface DownloadTask {
  id: string
  file: FileItem
  status: TaskStatus
  progress: number
  speed: number
  downloadedSize: number
  totalSize: number
  createdAt: number
  completedAt?: number
  retryCount: number
  gid?: string // aria2 task id
  error?: string
  downloadUrl?: string
  ua?: string
  localPath?: string
}

// API响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

// 文件列表响应
export interface FileListResponse {
  uk: string
  shareid: string
  randsk: string
  surl: string
  pwd: string
  list: FileItem[]
  ttl: number
}

// 下载链接响应
export interface DownloadLinkResponse {
  filename: string
  fs_id: string | number
  url: string
  urls: string[]
  ua: string
}
