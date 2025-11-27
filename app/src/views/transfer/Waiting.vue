<template>
  <div class="waiting-page">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <template v-if="selectedIds.size > 0">
        <button class="action-btn" @click="pauseSelected">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
          暂停
        </button>
        <button class="action-btn" @click="startSelected">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M8 5v14l11-7z"/>
          </svg>
          开始
        </button>
        <button class="action-btn danger" @click="deleteSelected">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          删除
        </button>
      </template>
      <template v-else>
        <button class="action-btn" @click="pauseAll">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
          全部暂停
        </button>
        <button class="action-btn" @click="startAll">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M8 5v14l11-7z"/>
          </svg>
          全部开始
        </button>
        <button class="action-btn danger" @click="deleteAll">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          全部删除
        </button>
      </template>
    </div>

    <!-- 任务列表 -->
    <div class="task-list" v-if="tasks.length > 0">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-item"
        @mouseenter="hoverTaskId = task.id"
        @mouseleave="hoverTaskId = null"
      >
        <div class="task-checkbox">
          <input
            type="checkbox"
            :checked="selectedIds.has(task.id)"
            @change="toggleSelect(task.id)"
          />
        </div>
        <div class="task-icon">
          <svg v-if="task.file.isdir === 1" viewBox="0 0 24 24" width="24" height="24">
            <path fill="#ffc107" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="24" height="24">
            <path fill="#90caf9" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        </div>
        <div class="task-info">
          <div class="task-name">{{ task.file.server_filename }}</div>
          <div class="task-status" :class="task.status">
            {{ getStatusText(task.status) }}
            <span v-if="task.error" class="error-text">: {{ task.error }}</span>
          </div>
        </div>
        <div class="task-size">
          {{ task.file.isdir === 1 ? '--' : formatSize(task.file.size) }}
        </div>
        <div class="task-actions" v-if="hoverTaskId === task.id">
          <button
            v-if="task.status === 'waiting' || task.status === 'processing'"
            class="icon-btn"
            @click="pauseTask(task.id)"
            title="暂停"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
          <button
            v-if="task.status === 'paused' || task.status === 'error'"
            class="icon-btn"
            @click="startTask(task.id)"
            title="开始"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <button
            class="icon-btn danger"
            @click="deleteTask(task.id)"
            title="删除"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <svg viewBox="0 0 24 24" width="48" height="48">
        <path fill="#5f6368" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>
      <p>没有等待中的任务</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDownloadStore } from '@/stores/download'
import { useDownloadManager } from '@/composables/useDownloadManager'
import type { TaskStatus } from '@/types'

const downloadStore = useDownloadStore()
const downloadManager = useDownloadManager()

const tasks = computed(() => downloadStore.waitingTasks)
const selectedIds = ref<Set<string>>(new Set())
const hoverTaskId = ref<string | null>(null)

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function getStatusText(status: TaskStatus): string {
  const statusMap: Record<TaskStatus, string> = {
    waiting: '等待处理',
    processing: '处理中',
    downloading: '下载中',
    paused: '已暂停',
    completed: '已完成',
    error: '异常'
  }
  return statusMap[status] || status
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function pauseTask(id: string) {
  downloadStore.updateWaitingTaskStatus(id, 'paused')
}

function startTask(id: string) {
  downloadStore.updateWaitingTaskStatus(id, 'waiting')
  downloadManager.resetErrorCount()
  downloadManager.processWaitingQueue()
}

function deleteTask(id: string) {
  downloadStore.removeFromWaiting([id])
  selectedIds.value.delete(id)
}

function pauseSelected() {
  selectedIds.value.forEach(id => pauseTask(id))
}

function startSelected() {
  selectedIds.value.forEach(id => startTask(id))
}

function deleteSelected() {
  downloadStore.removeFromWaiting([...selectedIds.value])
  selectedIds.value.clear()
}

function pauseAll() {
  downloadStore.pauseAllWaiting()
}

function startAll() {
  downloadStore.resumeAllWaiting()
  downloadManager.resetErrorCount()
  downloadManager.processWaitingQueue()
}

function deleteAll() {
  downloadStore.removeFromWaiting(tasks.value.map(t => t.id))
  selectedIds.value.clear()
}

onMounted(() => {
  downloadManager.startDownload()
})
</script>

<style lang="scss" scoped>
.waiting-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.action-bar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid $border-color;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid $border-color;
  border-radius: 6px;
  background: transparent;
  color: $text-secondary;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: $bg-hover;
    color: $text-primary;
  }

  &.danger:hover {
    background: rgba($danger-color, 0.1);
    border-color: $danger-color;
    color: $danger-color;
  }
}

.task-list {
  flex: 1;
  overflow: auto;
  padding: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: background 0.15s;

  &:hover {
    background: $bg-hover;
  }
}

.task-checkbox {
  flex-shrink: 0;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
}

.task-icon {
  flex-shrink: 0;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-name {
  font-size: 14px;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-status {
  font-size: 12px;
  margin-top: 4px;

  &.waiting { color: $text-secondary; }
  &.processing { color: $primary-color; }
  &.paused { color: $warning-color; }
  &.error { color: $danger-color; }

  .error-text {
    color: $danger-color;
  }
}

.task-size {
  flex-shrink: 0;
  width: 80px;
  text-align: right;
  font-size: 13px;
  color: $text-secondary;
}

.task-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: $text-secondary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    background: $bg-tertiary;
    color: $text-primary;
  }

  &.danger:hover {
    background: rgba($danger-color, 0.1);
    color: $danger-color;
  }
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: $text-secondary;
}
</style>
