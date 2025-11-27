import { ref } from 'vue'

interface Aria2Status {
  gid: string
  status: string
  totalLength: string
  completedLength: string
  downloadSpeed: string
  errorCode?: string
  errorMessage?: string
}

// aria2 JSON-RPC 客户端
export function useAria2() {
  const port = ref(6800)
  const connected = ref(false)

  // 发送RPC请求
  async function rpc(method: string, params: any[] = []): Promise<any> {
    const response = await fetch(`http://localhost:${port.value}/jsonrpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now().toString(),
        method: `aria2.${method}`,
        params: [`token:`, ...params]
      })
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return data.result
  }

  // 检查连接
  async function checkConnection(): Promise<boolean> {
    try {
      await rpc('getVersion')
      connected.value = true
      return true
    } catch {
      connected.value = false
      return false
    }
  }

  // 添加下载任务
  async function addUri(
    url: string,
    options: {
      dir?: string
      out?: string
      userAgent?: string
      header?: string[]
    } = {}
  ): Promise<string> {
    const opts: Record<string, any> = {}

    if (options.dir) opts.dir = options.dir
    if (options.out) opts.out = options.out
    if (options.userAgent) opts['user-agent'] = options.userAgent
    if (options.header) opts.header = options.header

    return await rpc('addUri', [[url], opts])
  }

  // 暂停任务
  async function pause(gid: string): Promise<string> {
    return await rpc('pause', [gid])
  }

  // 取消暂停
  async function unpause(gid: string): Promise<string> {
    return await rpc('unpause', [gid])
  }

  // 删除任务
  async function remove(gid: string): Promise<string> {
    return await rpc('remove', [gid])
  }

  // 强制删除任务
  async function forceRemove(gid: string): Promise<string> {
    return await rpc('forceRemove', [gid])
  }

  // 获取任务状态
  async function tellStatus(gid: string): Promise<Aria2Status> {
    return await rpc('tellStatus', [gid])
  }

  // 获取所有活动任务
  async function tellActive(): Promise<Aria2Status[]> {
    return await rpc('tellActive')
  }

  // 获取等待中的任务
  async function tellWaiting(offset: number = 0, num: number = 100): Promise<Aria2Status[]> {
    return await rpc('tellWaiting', [offset, num])
  }

  // 获取已停止的任务
  async function tellStopped(offset: number = 0, num: number = 100): Promise<Aria2Status[]> {
    return await rpc('tellStopped', [offset, num])
  }

  // 暂停所有任务
  async function pauseAll(): Promise<string> {
    return await rpc('pauseAll')
  }

  // 继续所有任务
  async function unpauseAll(): Promise<string> {
    return await rpc('unpauseAll')
  }

  // 获取全局统计
  async function getGlobalStat(): Promise<{
    downloadSpeed: string
    uploadSpeed: string
    numActive: string
    numWaiting: string
    numStopped: string
  }> {
    return await rpc('getGlobalStat')
  }

  return {
    port,
    connected,
    checkConnection,
    addUri,
    pause,
    unpause,
    remove,
    forceRemove,
    tellStatus,
    tellActive,
    tellWaiting,
    tellStopped,
    pauseAll,
    unpauseAll,
    getGlobalStat
  }
}
