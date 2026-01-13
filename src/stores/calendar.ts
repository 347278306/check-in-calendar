import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import { generateId } from '@/utils'
import { calculateStreak, calculateMonthlyRate, getToday } from '@/utils/date'
import type { Calendar, CheckInRecord, CalendarStats, CreateCalendarParams } from '@/types'

export const useCalendarStore = defineStore('calendar', () => {
  // 状态
  const calendars = ref<Calendar[]>([])
  const records = ref<CheckInRecord[]>([])
  const loading = ref(false)

  // 获取所有日历
  async function loadCalendars() {
    loading.value = true
    try {
      calendars.value = await db.calendars
        .orderBy('createdAt')
        .reverse()
        .toArray()
    } finally {
      loading.value = false
    }
  }

  // 加载所有打卡记录
  async function loadAllRecords() {
    records.value = await db.records.toArray()
  }

  // 加载指定日历的记录
  async function loadRecords(calendarId: string) {
    records.value = await db.records
      .where('calendarId')
      .equals(calendarId)
      .sortBy('checkInTime')
    records.value.reverse()
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
    const now = Date.now()
    // 创建纯对象
    const calendar = {
      id: generateId(),
      name: params.name,
      icon: params.icon,
      color: params.color,
      description: params.description || '',
      createdAt: now,
      updatedAt: now
    }

    await db.calendars.add(calendar)
    calendars.value.unshift({ ...calendar })
    return calendar
  }

  // 更新日历
  async function updateCalendar(id: string, updates: Partial<Omit<Calendar, 'id' | 'createdAt'>>) {
    const calendar = calendars.value.find(c => c.id === id)
    if (calendar) {
      // 创建纯对象
      const updated = {
        ...calendar,
        ...updates,
        updatedAt: Date.now()
      }
      await db.calendars.put(updated)
      const index = calendars.value.findIndex(c => c.id === id)
      if (index !== -1) {
        calendars.value[index] = { ...updated }
      }
    }
  }

  // 删除日历
  async function deleteCalendar(id: string) {
    await db.transaction('rw', db.calendars, db.records, async () => {
      await db.records.where('calendarId').equals(id).delete()
      await db.calendars.delete(id)
    })
    calendars.value = calendars.value.filter(c => c.id !== id)
    records.value = records.value.filter(r => r.calendarId !== id)
  }

  // 打卡
  async function checkIn(calendarId: string, date: string, content: string, images: string[]) {
    // 检查是否已打卡
    const existing = records.value.find(r => r.calendarId === calendarId && r.date === date)
    if (existing) {
      throw new Error('该日期已打卡')
    }

    // 创建纯对象以避免 IndexedDB 克隆问题
    const record = {
      id: generateId(),
      calendarId,
      date,
      checkInTime: Date.now(),
      content,
      images: [...images], // 确保是普通数组
      isRetroactive: date !== getToday()
    }

    await db.records.add(record)
    // 添加到响应式数组
    records.value.push({ ...record })
    return record
  }

  // 更新打卡记录
  async function updateRecord(id: string, updates: Partial<CheckInRecord>) {
    const record = records.value.find(r => r.id === id)
    if (record) {
      // 创建纯对象
      const updated = {
        ...record,
        ...updates,
        images: updates.images ? [...updates.images] : record.images
      }
      await db.records.put(updated)
      const index = records.value.findIndex(r => r.id === id)
      if (index !== -1) {
        records.value[index] = { ...updated }
      }
    }
  }

  // 删除打卡记录
  async function deleteRecord(id: string) {
    await db.records.delete(id)
    records.value = records.value.filter(r => r.id !== id)
  }

  // 获取指定日期的记录
  function getRecordByDate(calendarId: string, date: string): CheckInRecord | undefined {
    return records.value.find(r => r.calendarId === calendarId && r.date === date)
  }

  // 计算总打卡数
  const totalCheckIns = computed(() => records.value.length)

  return {
    calendars,
    records,
    loading,
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
    getRecordByDate
  }
})
