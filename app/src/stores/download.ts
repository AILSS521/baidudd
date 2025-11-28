import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileItem, DownloadTask, TaskStatus, SubFileTask } from '@/types'

export const useDownloadStore = defineStore('download', () => {
  // 状态 - 合并等待和下载中为一个列表
  const downloadTasks = ref<DownloadTask[]>([])
  const completedTasks = ref<DownloadTask[]>([])

  // 当前会话数据
  const currentCode = ref('')
  const currentFileList = ref<FileItem[]>([])
  const basePath = ref('/') // 分享链接的基础路径（虚拟根目录）
  const sessionData = ref<{
    uk: string
    shareid: string
    randsk: string
    surl: string
    pwd: string
  } | null>(null)

  // 计算属性
  const downloadCount = computed(() => downloadTasks.value.length)
  const completedCount = computed(() => completedTasks.value.length)

  // 活跃下载数（正在下载或暂停的，不包括等待中的）
  const activeDownloadCount = computed(() =>
    downloadTasks.value.filter(t =>
      t.status === 'downloading' ||
      t.status === 'paused' ||
      t.status === 'creating'
    ).length
  )

  // 方法
  function setCurrentCode(code: string) {
    currentCode.value = code
  }

  function setCurrentFileList(list: FileItem[]) {
    currentFileList.value = list
  }

  function setSessionData(data: typeof sessionData.value) {
    sessionData.value = data
  }

  function setBasePath(path: string) {
    basePath.value = path
  }

  // 添加单个文件任务到下载列表
  function addToDownload(files: FileItem[], downloadBasePath: string | null = null) {
    const newTasks: DownloadTask[] = files.map(file => ({
      id: `${Date.now()}-${file.fs_id}`,
      file,
      status: 'waiting' as TaskStatus,
      progress: 0,
      speed: 0,
      downloadedSize: 0,
      totalSize: file.size,
      createdAt: Date.now(),
      retryCount: 0,
      downloadBasePath,
      isFolder: false
    }))
    downloadTasks.value.push(...newTasks)
  }

  // 添加文件夹任务到下载列表
  function addFolderToDownload(folder: FileItem, files: FileItem[], downloadBasePath: string) {
    // 计算总大小
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)

    // 创建子文件任务列表
    const subFiles: SubFileTask[] = files.map(file => ({
      file,
      status: 'waiting' as TaskStatus,
      progress: 0,
      speed: 0,
      downloadedSize: 0,
      totalSize: file.size,
      retryCount: 0
    }))

    const folderTask: DownloadTask = {
      id: `${Date.now()}-folder-${folder.fs_id}`,
      file: folder,
      status: 'waiting' as TaskStatus,
      progress: 0,
      speed: 0,
      downloadedSize: 0,
      totalSize,
      createdAt: Date.now(),
      retryCount: 0,
      downloadBasePath,
      isFolder: true,
      subFiles,
      completedCount: 0,
      totalCount: files.length,
      currentFileIndex: 0
    }

    downloadTasks.value.push(folderTask)
  }

  // 从下载列表移除任务
  function removeFromDownload(taskIds: string[]) {
    downloadTasks.value = downloadTasks.value.filter(t => !taskIds.includes(t.id))
  }

  // 移动到已完成
  function moveToCompleted(task: DownloadTask, success: boolean = true) {
    const index = downloadTasks.value.findIndex(t => t.id === task.id)
    if (index > -1) {
      downloadTasks.value.splice(index, 1)
      task.status = success ? 'completed' : 'error'
      task.completedAt = Date.now()
      completedTasks.value.unshift(task)
    }
  }

  // 更新任务状态
  function updateTaskStatus(taskId: string, status: TaskStatus) {
    const task = downloadTasks.value.find(t => t.id === taskId)
    if (task) {
      task.status = status
    }
  }

  // 更新任务进度
  function updateTaskProgress(taskId: string, progress: number, speed: number, downloadedSize: number) {
    const task = downloadTasks.value.find(t => t.id === taskId)
    if (task) {
      task.progress = progress
      task.speed = speed
      task.downloadedSize = downloadedSize
      if (task.status !== 'downloading') {
        task.status = 'downloading'
      }
    }
  }

  // 更新文件夹任务中子文件的进度
  function updateFolderSubFileProgress(taskId: string, fileIndex: number, progress: number, speed: number, downloadedSize: number) {
    const task = downloadTasks.value.find(t => t.id === taskId)
    if (task && task.isFolder && task.subFiles && task.subFiles[fileIndex]) {
      const subFile = task.subFiles[fileIndex]
      subFile.progress = progress
      subFile.speed = speed
      subFile.downloadedSize = downloadedSize
      subFile.status = 'downloading'

      // 更新文件夹总体进度
      task.speed = speed
      task.downloadedSize = task.subFiles.reduce((sum, sf) => sum + sf.downloadedSize, 0)
      task.progress = task.totalSize > 0 ? (task.downloadedSize / task.totalSize) * 100 : 0
      task.currentFileIndex = fileIndex

      if (task.status !== 'downloading') {
        task.status = 'downloading'
      }
    }
  }

  // 标记文件夹中的子文件完成
  function markFolderSubFileCompleted(taskId: string, fileIndex: number, success: boolean, error?: string) {
    const task = downloadTasks.value.find(t => t.id === taskId)
    if (task && task.isFolder && task.subFiles && task.subFiles[fileIndex]) {
      const subFile = task.subFiles[fileIndex]
      subFile.status = success ? 'completed' : 'error'
      if (error) subFile.error = error
      if (success) {
        subFile.progress = 100
        subFile.downloadedSize = subFile.totalSize
      }

      // 更新已完成数量
      task.completedCount = task.subFiles.filter(sf => sf.status === 'completed').length

      // 更新文件夹总体下载量
      task.downloadedSize = task.subFiles.reduce((sum, sf) => sum + sf.downloadedSize, 0)
      task.progress = task.totalSize > 0 ? (task.downloadedSize / task.totalSize) * 100 : 0

      // 检查是否所有文件都完成了
      const allCompleted = task.subFiles.every(sf => sf.status === 'completed' || sf.status === 'error')
      if (allCompleted) {
        const allSuccess = task.subFiles.every(sf => sf.status === 'completed')
        moveToCompleted(task, allSuccess)
      }
    }
  }

  // 获取文件夹中下一个等待的子文件
  function getNextWaitingSubFile(taskId: string): { index: number; subFile: SubFileTask } | undefined {
    const task = downloadTasks.value.find(t => t.id === taskId)
    if (task && task.isFolder && task.subFiles) {
      const index = task.subFiles.findIndex(sf => sf.status === 'waiting')
      if (index !== -1) {
        return { index, subFile: task.subFiles[index] }
      }
    }
    return undefined
  }

  // 更新文件夹子文件状态
  function updateFolderSubFileStatus(taskId: string, fileIndex: number, status: TaskStatus) {
    const task = downloadTasks.value.find(t => t.id === taskId)
    if (task && task.isFolder && task.subFiles && task.subFiles[fileIndex]) {
      task.subFiles[fileIndex].status = status
    }
  }

  // 暂停任务
  function pauseTask(taskId: string) {
    const task = downloadTasks.value.find(t => t.id === taskId)
    if (task && (task.status === 'downloading' || task.status === 'waiting' || task.status === 'processing' || task.status === 'creating')) {
      // 只有正在下载的任务需要调用 electron API
      if (task.status === 'downloading') {
        window.electronAPI?.pauseDownload(taskId)
      }
      task.status = 'paused'
    }
  }

  // 恢复任务
  function resumeTask(taskId: string) {
    const task = downloadTasks.value.find(t => t.id === taskId)
    if (task && task.status === 'paused') {
      // 如果任务已经开始下载过，调用恢复API
      if (task.downloadUrl) {
        task.status = 'downloading'
        window.electronAPI?.resumeDownload(taskId)
      } else {
        // 还没开始下载，改为等待状态
        task.status = 'waiting'
      }
    }
  }

  // 暂停所有任务
  function pauseAll() {
    downloadTasks.value.forEach(task => {
      if (task.status === 'downloading') {
        window.electronAPI?.pauseDownload(task.id)
      }
      if (task.status === 'downloading' || task.status === 'waiting' || task.status === 'processing') {
        task.status = 'paused'
      }
    })
  }

  // 恢复所有任务
  function resumeAll() {
    downloadTasks.value.forEach(task => {
      if (task.status === 'paused') {
        if (task.downloadUrl) {
          task.status = 'downloading'
          window.electronAPI?.resumeDownload(task.id)
        } else {
          task.status = 'waiting'
        }
      }
    })
  }

  // 清空已完成
  function clearCompleted() {
    completedTasks.value = []
  }

  // 移除已完成的任务
  function removeCompleted(taskIds: string[]) {
    completedTasks.value = completedTasks.value.filter(t => !taskIds.includes(t.id))
  }

  // 获取下一个等待中的任务
  function getNextWaitingTask(): DownloadTask | undefined {
    return downloadTasks.value.find(t => t.status === 'waiting')
  }

  return {
    // 状态
    downloadTasks,
    completedTasks,
    currentCode,
    currentFileList,
    basePath,
    sessionData,

    // 计算属性
    downloadCount,
    completedCount,
    activeDownloadCount,

    // 方法
    setCurrentCode,
    setCurrentFileList,
    setBasePath,
    setSessionData,
    addToDownload,
    addFolderToDownload,
    removeFromDownload,
    moveToCompleted,
    updateTaskStatus,
    updateTaskProgress,
    updateFolderSubFileProgress,
    markFolderSubFileCompleted,
    getNextWaitingSubFile,
    updateFolderSubFileStatus,
    pauseTask,
    resumeTask,
    pauseAll,
    resumeAll,
    clearCompleted,
    removeCompleted,
    getNextWaitingTask
  }
})
