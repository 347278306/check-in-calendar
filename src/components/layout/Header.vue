<template>
  <header class="header">
    <div class="header-left">
      <slot name="left">
        <router-link v-if="showBack" to="/" class="back-btn" @click="handleBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>返回</span>
        </router-link>
        <span v-else class="header-title">{{ title }}</span>
      </slot>
    </div>
    <div class="header-right">
      <slot name="right"></slot>
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  showBack?: boolean
}

const { title = '📅 打卡日历', showBack = false } = defineProps<Props>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

function handleBack() {
  emit('back')
}
</script>

<style scoped>
.header {
  background: #fff;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #333;
}
</style>
