import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  // 初始化认证状态
  async function init() {
    loading.value = true
    error.value = null
    try {
      const { data } = await supabase.auth.getSession()
      session.value = data.session
      user.value = data.session?.user ?? null

      supabase.auth.onAuthStateChange((_event, _session) => {
        session.value = _session
        user.value = _session?.user ?? null
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : '初始化失败'
    } finally {
      loading.value = false
    }
  }

  // 邮箱密码注册
  async function signUp(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email,
        password
      })
      if (supabaseError) throw supabaseError
      return data
    } catch (e) {
      error.value = e instanceof Error ? e.message : '注册失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 邮箱密码登录
  async function signInWithPassword(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (supabaseError) throw supabaseError
      return data
    } catch (e) {
      error.value = e instanceof Error ? e.message : '登录失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 登出
  async function signOut() {
    loading.value = true
    try {
      const { error: supabaseError } = await supabase.auth.signOut()
      if (supabaseError) throw supabaseError
      user.value = null
      session.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : '登出失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    session,
    loading,
    error,
    init,
    signUp,
    signInWithPassword,
    signOut
  }
})
