import { createRouter, createWebHistory } from 'vue-router'
import { HomePage, CalendarDetailPage } from '@/pages'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/calendar/:id',
    name: 'CalendarDetail',
    component: CalendarDetailPage,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
