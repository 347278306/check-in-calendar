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
      <slot name="right">
        <div v-if="authStore.user" class="user-info">
          <span class="user-email">{{ maskEmail(authStore.user.email || '') }}</span>
          <button @click="handleLogout" class="logout-btn">登出</button>
        </div>
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCalendarStore } from '@/stores/calendar'

interface Props {
  title?: string
  showBack?: boolean
}

const { title = '📅 打卡日历', showBack = false } = defineProps<Props>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const calendarStore = useCalendarStore()

function handleBack() {
  emit('back')
}

function maskEmail(email: string): string {
  if (!email) return ''
  const [name, domain] = email.split('@')
  if (name.length <= 2) return email
  return `${name[0]}${'*'.repeat(name.length - 2)}${name.slice(-1)}@${domain}`
}

async function handleLogout() {
  await authStore.signOut()
  calendarStore.reset()
  router.push('/login')
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
  text-decoration: none;
}

.back-btn:hover {
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-email {
  color: #666;
  font-size: 14px;
}

.logout-btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #f5f5f5;
  color: #333;
  border-color: #ccc;
}
</style>
