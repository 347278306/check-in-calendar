import Dexie, { type Table } from 'dexie'
import type { Calendar, CheckInRecord, UserSettings } from '@/types'

class CheckInDatabase extends Dexie {
  calendars!: Table<Calendar>
  records!: Table<CheckInRecord>
  settings!: Table<UserSettings>

  constructor() {
    super('checkin-calendar-db')
    this.version(1).stores({
      calendars: 'id, name, createdAt',
      records: 'id, calendarId, date, checkInTime',
      settings: 'id'
    })
  }
}

export const db = new CheckInDatabase()

// 初始化默认设置
export async function initSettings() {
  const existing = await db.settings.get('user-settings')
  if (!existing) {
    await db.settings.add({
      id: 'user-settings',
      theme: 'light',
      version: 1
    })
  }
}

// 初始化示例数据（首次使用时）
export async function initSampleData() {
  const calendars = await db.calendars.toArray()
  if (calendars.length === 0) {
    const now = Date.now()
    await db.calendars.bulkAdd([
      {
        id: crypto.randomUUID(),
        name: '每日读书',
        icon: '📚',
        color: '#FF6B6B',
        description: '每天阅读至少30分钟',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        name: '健身打卡',
        icon: '💪',
        color: '#4CAF50',
        description: '每天运动1小时',
        createdAt: now,
        updatedAt: now
      }
    ])
  }
}

// 启动初始化
initSettings()
