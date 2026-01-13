// 日历
export interface Calendar {
  id: string
  name: string
  icon: string
  color: string
  description: string
  createdAt: number
  updatedAt: number
}

// 打卡记录
export interface CheckInRecord {
  id: string
  calendarId: string
  date: string // YYYY-MM-DD
  checkInTime: number
  content: string
  images: string[]
  isRetroactive: boolean
  retroactiveTime?: number
}

// 用户设置
export interface UserSettings {
  id: string
  theme: 'light' | 'dark'
  version: number
}

// 日历统计数据
export interface CalendarStats {
  streak: number
  total: number
  rate: number
  checkedToday: boolean
}

// 日历日期格子
export interface CalendarDayData {
  date: string // YYYY-MM-DD
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isFuture: boolean
  record?: CheckInRecord
}

// 创建日历参数
export interface CreateCalendarParams {
  name: string
  icon: string
  color: string
  description?: string
}

// 打卡参数
export interface CheckInParams {
  calendarId: string
  date: string
  content: string
  images: string[]
}

// 可用的图标选项
export const ICON_OPTIONS = [
  '📚', '📖', '💪', '🏃', '🎯', '✍️',
  '🎨', '🎵', '🍎', '💊', '🌅', '🧘',
  '💻', '📝', '🎤', '🍵', '🧘', '🚴',
  '🎹', '📷', '💰', '🌱', '🎮', '🛏️'
]

// 可用的颜色选项
export const COLOR_OPTIONS = [
  '#FF6B6B', // 红
  '#4CAF50', // 绿
  '#2196F3', // 蓝
  '#FF9800', // 橙
  '#9C27B0', // 紫
  '#607D8B', // 灰
  '#E91E63', // 粉
  '#00BCD4', // 青
]
