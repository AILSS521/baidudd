<template>
  <div class="transfer-page">
    <!-- 侧边导航 -->
    <div class="transfer-sidebar">
      <router-link
        to="/transfer/waiting"
        class="sidebar-item"
        active-class="active"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
        </svg>
        <span>等待中</span>
        <span class="badge" v-if="waitingCount > 0">{{ waitingCount }}</span>
      </router-link>
      <router-link
        to="/transfer/downloading"
        class="sidebar-item"
        active-class="active"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
        <span>下载中</span>
        <span class="badge" v-if="downloadingCount > 0">{{ downloadingCount }}</span>
      </router-link>
      <router-link
        to="/transfer/completed"
        class="sidebar-item"
        active-class="active"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <span>已完成</span>
        <span class="badge" v-if="completedCount > 0">{{ completedCount }}</span>
      </router-link>
    </div>

    <!-- 内容区域 -->
    <div class="transfer-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDownloadStore } from '@/stores/download'

const downloadStore = useDownloadStore()

const waitingCount = computed(() => downloadStore.waitingCount)
const downloadingCount = computed(() => downloadStore.downloadingCount)
const completedCount = computed(() => downloadStore.completedCount)
</script>

<style lang="scss" scoped>
.transfer-page {
  display: flex;
  height: 100%;
}

.transfer-sidebar {
  width: 160px;
  background: $bg-tertiary;
  border-right: 1px solid $border-color;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  color: $text-secondary;
  text-decoration: none;
  transition: all 0.15s;

  svg {
    flex-shrink: 0;
  }

  span:not(.badge) {
    flex: 1;
    font-size: 13px;
  }

  .badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    background: $primary-color;
    color: white;
    border-radius: 10px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:hover {
    background: $bg-hover;
    color: $text-primary;
  }

  &.active {
    background: rgba($primary-color, 0.2);
    color: $primary-color;
  }
}

.transfer-content {
  flex: 1;
  overflow: hidden;
}
</style>
