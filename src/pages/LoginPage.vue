<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo">
        <span class="logo-icon">📅</span>
        <h1>打卡日历</h1>
      </div>

      <div class="tab-switch">
        <button
          :class="{ active: isLogin }"
          @click="isLogin = true"
        >登录</button>
        <button
          :class="{ active: !isLogin }"
          @click="isLogin = false"
        >注册</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="请输入邮箱"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <div class="password-input">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="请输入密码"
              minlength="6"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              <span v-if="showPassword">🙈</span>
              <span v-else>👁️</span>
            </button>
          </div>
        </div>

        <div v-if="!isLogin" class="form-group">
          <label for="confirmPassword">确认密码</label>
          <div class="password-input">
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              placeholder="请再次输入密码"
              minlength="6"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <span v-if="showConfirmPassword">🙈</span>
              <span v-else>👁️</span>
            </button>
          </div>
        </div>

        <p v-if="error" class="error-message">{{ error }}</p>
        <p v-if="!isLogin && passwordMismatch" class="error-message">两次输入的密码不一致</p>

        <button type="submit" :disabled="loading || (!isLogin && passwordMismatch)">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
        </button>
      </form>

      <p class="hint">
        {{ isLogin ? '还没有账号？点击上方"注册"创建' : '已有账号？点击上方"登录"' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCalendarStore } from '@/stores/calendar'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const calendarStore = useCalendarStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const passwordMismatch = computed(() => {
  if (isLogin.value) return false
  if (!confirmPassword.value) return false
  return password.value !== confirmPassword.value
})

async function handleSubmit() {
  if (!isLogin.value && passwordMismatch.value) return

  loading.value = true
  error.value = null

  try {
    if (isLogin.value) {
      await authStore.signInWithPassword(email.value, password.value)
    } else {
      await authStore.signUp(email.value, password.value)
    }

    // 加载数据并跳转
    await calendarStore.loadCalendars()

    const redirect = route.query.redirect as string
    router.push(redirect || '/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '操作失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 380px;
}

.logo {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.logo h1 {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.tab-switch {
  display: flex;
  margin-bottom: 1.5rem;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
}

.tab-switch button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  border-radius: 6px;
  transition: all 0.2s;
  color: #666;
}

.tab-switch button.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-size: 0.875rem;
  font-weight: 500;
}

.password-input {
  position: relative;
}

.password-input input {
  width: 100%;
  padding: 0.875rem 3rem 0.875rem 1rem;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.password-input input:focus {
  outline: none;
  border-color: #667eea;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.toggle-password:hover {
  opacity: 1;
}

button[type="submit"] {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button[type="submit"]:hover:not(:disabled) {
  opacity: 0.9;
}

.error-message {
  color: #f44336;
  font-size: 0.875rem;
  margin: 0.5rem 0 1rem;
  padding: 0.75rem;
  background: #ffebee;
  border-radius: 6px;
}

.hint {
  text-align: center;
  color: #999;
  font-size: 0.875rem;
  margin-top: 1.5rem;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
