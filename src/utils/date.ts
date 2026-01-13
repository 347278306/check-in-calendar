import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import type { CalendarDayData, CheckInRecord } from '@/types'

dayjs.locale('zh-cn')

/** 格式化日期 */
export function formatDate(date: dayjs.Dayjs | string | Date, format = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format)
}

/** 获取今天的日期字符串 */
export function getToday(): string {
  return dayjs().format('YYYY-MM-DD')
}

/** 判断是否今天 */
export function isToday(date: string): boolean {
  return date === getToday()
}

/** 判断是否未来日期 */
export function isFuture(date: string): boolean {
  return dayjs(date).isAfter(dayjs(), 'day')
}

/** 获取某月的天数 */
export function getDaysInMonth(year: number, month: number): number {
  return dayjs(`${year}-${month}-01`).daysInMonth()
}

/** 获取某月第一天是星期几 (0-6) */
export function getFirstDayOfWeek(year: number, month: number): number {
  return dayjs(`${year}-${month}-01`).day()
}

/** 生成日历网格数据 */
export function generateCalendarDays(
  year: number,
  month: number,
  records: CheckInRecord[] = []
): CalendarDayData[] {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfWeek = getFirstDayOfWeek(year, month)
  const today = getToday()

  const days: CalendarDayData[] = []

  // 上月日期
  const prevMonth = dayjs(`${year}-${month}-01`).subtract(1, 'month')
  const prevDaysInMonth = prevMonth.daysInMonth()

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevDaysInMonth - i
    const dateStr = prevMonth.date(day).format('YYYY-MM-DD')
    days.push({
      date: dateStr,
      day,
      isCurrentMonth: false,
      isToday: false,
      isFuture: false,
      record: records.find(r => r.date === dateStr)
    })
  }

  // 当月日期
  const currentMonth = dayjs(`${year}-${month}-01`)
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = currentMonth.date(day).format('YYYY-MM-DD')
    days.push({
      date: dateStr,
      day,
      isCurrentMonth: true,
      isToday: dateStr === today,
      isFuture: isFuture(dateStr),
      record: records.find(r => r.date === dateStr)
    })
  }

  // 下月日期，补齐42个格子
  const nextMonth = dayjs(`${year}-${month}-01`).add(1, 'month')
  const remaining = 42 - days.length

  for (let day = 1; day <= remaining; day++) {
    const dateStr = nextMonth.date(day).format('YYYY-MM-DD')
    days.push({
      date: dateStr,
      day,
      isCurrentMonth: false,
      isToday: false,
      isFuture: false,
      record: records.find(r => r.date === dateStr)
    })
  }

  return days
}

/** 计算连续打卡天数 */
export function calculateStreak(records: CheckInRecord[]): number {
  if (records.length === 0) return 0

  // 按日期倒序排序
  const sorted = [...records]
    .filter(r => !r.isRetroactive)
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())

  if (sorted.length === 0) return 0

  const today = getToday()
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

  // 检查最新打卡日期是否今天或昨天
  const latestDate = sorted[0].date
  if (latestDate !== today && latestDate !== yesterday) {
    return 0
  }

  // 计算连续天数
  let streak = 0
  let checkDate = dayjs()

  while (true) {
    const dateStr = checkDate.format('YYYY-MM-DD')
    const hasRecord = sorted.some(r => r.date === dateStr)

    if (hasRecord) {
      streak++
      checkDate = checkDate.subtract(1, 'day')
    } else {
      break
    }
  }

  return streak
}

/** 计算月度完成率 */
export function calculateMonthlyRate(records: CheckInRecord[], year: number, month: number): number {
  const daysInMonth = getDaysInMonth(year, month)
  const monthStr = dayjs(`${year}-${month}-01`).format('YYYY-MM')

  const checkedDays = records.filter(r =>
    !r.isRetroactive && r.date.startsWith(monthStr)
  ).length

  return Math.round((checkedDays / daysInMonth) * 100)
}
