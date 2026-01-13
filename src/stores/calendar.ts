import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { calendarService } from '@/services/calendarService'
import { recordService } from '@/services/recordService'
import { useAuthStore } from './auth'
import { calculateStreak, calculateMonthlyRate, getToday } from '@/utils/date'
import type { Calendar, CheckInRecord, CalendarStats, CreateCalendarParams } from '@/types'

export const useCalendarStore = defineStore('calendar', () => {
  const authStore = useAuthStore()

  // 状态
  const calendars = ref<Calendar[]>([])
  const records = ref<CheckInRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取所有日历
  async function loadCalendars() {
    loading.value = true
    error.value = null
    try {
      calendars.value = await calendarService.getAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载日历失败'
    } finally {
      loading.value = false
    }
  }

  // 加载所有打卡记录
  async function loadAllRecords() {
    if (calendars.value.length === 0) return
    const allRecords: CheckInRecord[] = []
    for (const calendar of calendars.value) {
      try {
        const calendarRecords = await recordService.getByCalendar(calendar.id)
        allRecords.push(...calendarRecords)
      } catch (e) {
        console.error(`加载日历 ${calendar.id} 的记录失败:`, e)
      }
    }
    records.value = allRecords.sort((a, b) => a.checkInTime - b.checkInTime)
  }

  // 加载指定日历的记录
  async function loadRecords(calendarId: string) {
    loading.value = true
    error.value = null
    try {
      records.value = await recordService.getByCalendar(calendarId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载记录失败'
    } finally {
      loading.value = false
    }
  }

  // 获取日历统计数据
  function getCalendarStats(calendarId: string): CalendarStats {
    const calendarRecords = records.value.filter(r => r.calendarId === calendarId)
    const today = getToday()
    const checkedToday = calendarRecords.some(r => r.date === today)
    const streak = calculateStreak(calendarRecords)
    const total = calendarRecords.length

    // 计算本月完成率
    const now = new Date()
    const rate = calculateMonthlyRate(calendarRecords, now.getFullYear(), now.getMonth() + 1)

    return {
      streak,
      total,
      rate,
      checkedToday
    }
  }

  // 创建日历
  async function createCalendar(params: CreateCalendarParams) {
    if (!authStore.user) {
      throw new Error('用户未登录')
    }

    loading.value = true
    error.value = null
    try {
      const calendar = await calendarService.create({
        user_id: authStore.user.id,
        name: params.name,
        icon: params.icon,
        color: params.color,
        description: params.description || ''
      })
      calendars.value.unshift(calendar)
      return calendar
    } catch (e) {
      error.value = e instanceof Error ? e.message : '创建日历失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 更新日历
  async function updateCalendar(id: string, updates: Partial<Omit<Calendar, 'id' | 'user_id' | 'createdAt'>>) {
    loading.value = true
    error.value = null
    try {
      const calendar = await calendarService.update(id, {
        name: updates.name,
        icon: updates.icon,
        color: updates.color,
        description: updates.description
      })
      const index = calendars.value.findIndex(c => c.id === id)
      if (index !== -1) {
        calendars.value[index] = calendar
      }
      return calendar
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新日历失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 删除日历
  async function deleteCalendar(id: string) {
    loading.value = true
    error.value = null
    try {
      await calendarService.delete(id)
      calendars.value = calendars.value.filter(c => c.id !== id)
      records.value = records.value.filter(r => r.calendarId !== id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除日历失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 打卡
  async function checkIn(calendarId: string, date: string, content: string, images: string[]) {
    if (!authStore.user) {
      throw new Error('用户未登录')
    }

    loading.value = true
    error.value = null
    try {
      // 检查是否已打卡
      const existing = records.value.find(r => r.calendarId === calendarId && r.date === date)
      if (existing) {
        throw new Error('该日期已打卡')
      }

      const record = await recordService.create({
        user_id: authStore.user.id,
        calendar_id: calendarId,
        date,
        content,
        images,
        is_retroactive: date !== getToday()
      })

      records.value.push(record)
      return record
    } catch (e) {
      error.value = e instanceof Error ? e.message : '打卡失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 更新打卡记录
  async function updateRecord(id: string, updates: Partial<CheckInRecord>) {
    loading.value = true
    error.value = null
    try {
      const record = await recordService.update(id, {
        content: updates.content,
        images: updates.images
      })
      const index = records.value.findIndex(r => r.id === id)
      if (index !== -1) {
        records.value[index] = record
      }
      return record
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新记录失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 删除打卡记录
  async function deleteRecord(id: string) {
    loading.value = true
    error.value = null
    try {
      await recordService.delete(id)
      records.value = records.value.filter(r => r.id !== id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除记录失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 获取指定日期的记录
  function getRecordByDate(calendarId: string, date: string): CheckInRecord | undefined {
    return records.value.find(r => r.calendarId === calendarId && r.date === date)
  }

  // 计算总打卡数
  const totalCheckIns = computed(() => records.value.length)

  // 重置状态（登出时使用）
  function reset() {
    calendars.value = []
    records.value = []
    error.value = null
  }

  return {
    calendars,
    records,
    loading,
    error,
    totalCheckIns,
    loadCalendars,
    loadAllRecords,
    loadRecords,
    getCalendarStats,
    createCalendar,
    updateCalendar,
    deleteCalendar,
    checkIn,
    updateRecord,
    deleteRecord,
    getRecordByDate,
    reset
  }
})
