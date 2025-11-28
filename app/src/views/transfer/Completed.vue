<template>
  <div class="completed-page">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <template v-if="selectedIds.size > 0">
        <button class="action-btn" @click="clearSelected">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          清除记录
        </button>
      </template>
      <template v-else>
        <button class="action-btn" @click="clearAll">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          清空全部记录
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
            <template v-if="task.status === 'completed'">
              {{ formatTime(task.completedAt) }}
              <template v-if="task.isFolder && task.totalCount"> · 共 {{ task.totalCount }} 个文件</template>
            </template>
            <template v-else>
              {{ task.error || '下载失败' }}
              <template v-if="task.isFolder && task.completedCount !== undefined && task.totalCount">
                · 已完成 {{ task.completedCount }}/{{ task.totalCount }} 个文件
              </template>
            </template>
          </div>
        </div>
        <div class="task-size" v-if="hoverTaskId !== task.id">
          {{ task.isFolder ? '--' : formatSize(task.file.size) }}
        </div>
        <div class="task-actions" v-else>
          <button
            class="icon-btn"
            @click="clearTask(task.id)"
            title="删除记录"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
          <button
            v-if="task.status === 'completed' && task.localPath"
            class="icon-btn"
            @click="showInFolder(task.localPath)"
            title="打开文件位置"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
            </svg>
          </button>
          <button
            v-if="task.status === 'completed' && task.localPath"
            class="icon-btn"
            @click="openFile(task.localPath)"
            title="打开文件"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <svg viewBox="0 0 24 24" width="48" height="48">
        <path fill="#5f6368" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      <p>没有已完成的任务</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDownloadStore } from '@/stores/download'
import dayjs from 'dayjs'

const downloadStore = useDownloadStore()

const tasks = computed(() => downloadStore.completedTasks)
const selectedIds = ref<Set<string>>(new Set())
const hoverTaskId = ref<string | null>(null)

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return ''
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}

function clearTask(id: string) {
  downloadStore.removeCompleted([id])
  selectedIds.value.delete(id)
}

function clearSelected() {
  downloadStore.removeCompleted([...selectedIds.value])
  selectedIds.value.clear()
}

function clearAll() {
  downloadStore.clearCompleted()
  selectedIds.value.clear()
}

function showInFolder(path: string) {
  window.electronAPI?.showItemInFolder(path)
}

function openFile(path: string) {
  window.electronAPI?.openPath(path)
}
</script>

<style lang="scss" scoped>
.completed-page {
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
  color: $text-secondary;

  &.completed { color: $success-color; }
  &.error { color: $danger-color; }
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
