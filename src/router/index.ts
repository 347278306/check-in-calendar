import { createRouter, createWebHistory } from 'vue-router'
import { HomePage, CalendarDetailPage, LoginPage } from '@/pages'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { guest: true }
  },
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar/:id',
    name: 'CalendarDetail',
    component: CalendarDetailPage,
    meta: { requiresAuth: true },
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // 如果还未初始化认证状态，先初始化
  if (authStore.loading) {
    await authStore.init()
  }

  const requiresAuth = to.meta.requiresAuth as boolean
  const isGuest = to.meta.guest as boolean

  if (requiresAuth && !authStore.user) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (isGuest && authStore.user) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
