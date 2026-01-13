<template>
  <div class="calendar-container">
    <div class="calendar-nav">
      <h3>{{ title }}</h3>
      <div class="nav-arrows">
        <button class="nav-arrow" @click="prevMonth">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button class="nav-arrow" @click="nextMonth">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="weekdays">
      <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
    </div>

    <div class="calendar-grid">
      <div
        v-for="item in days"
        :key="item.date"
        class="calendar-day"
        :class="{
          'other-month': !item.isCurrentMonth,
          'today': item.isToday,
          'checked': !!item.record,
          'future': item.isFuture,
          'clickable': canClick(item)
        }"
        @click="handleDayClick(item)"
      >
        <span class="day-num">{{ item.day }}</span>
        <span v-if="item.record" class="check-dot"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CalendarDayData, CheckInRecord } from '@/types'
import { generateCalendarDays } from '@/utils/date'

interface Props {
  records: CheckInRecord[]
  year?: number
  month?: number
}

const props = withDefaults(defineProps<Props>(), {
  year: () => new Date().getFullYear(),
  month: () => new Date().getMonth() + 1
})

const emit = defineEmits<{
  (e: 'dayClick', day: CalendarDayData): void
  (e: 'monthChange', year: number, month: number): void
}>()

const currentYear = ref(props.year)
const currentMonth = ref(props.month)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const title = computed(() => {
  return `${currentYear.value}年${currentMonth.value}月`
})

const days = computed(() => {
  return generateCalendarDays(currentYear.value, currentMonth.value, props.records)
})

function prevMonth() {
  if (currentMonth.value === 1) {
    currentYear.value--
    currentMonth.value = 12
  } else {
    currentMonth.value--
  }
  emit('monthChange', currentYear.value, currentMonth.value)
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentYear.value++
    currentMonth.value = 1
  } else {
    currentMonth.value++
  }
  emit('monthChange', currentYear.value, currentMonth.value)
}

function canClick(item: CalendarDayData): boolean {
  return item.isCurrentMonth && !item.isFuture
}

function handleDayClick(item: CalendarDayData) {
  if (canClick(item)) {
    emit('dayClick', item)
  }
}

// 监听外部年份月份变化
watch(() => [props.year, props.month], ([year, month]) => {
  currentYear.value = year
  currentMonth.value = month
})
</script>

<style scoped>
.calendar-container {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.calendar-nav h3 {
  font-size: 14px;
  font-weight: 600;
}

.nav-arrows {
  display: flex;
  gap: 4px;
}

.nav-arrow {
  width: 24px;
  height: 24px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.nav-arrow:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
}

.weekday {
  text-align: center;
  font-size: 11px;
  color: #999;
  padding: 4px 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 4px;
  height: calc(100vh - 300px);
  max-height: 360px;
  min-height: 200px;
}

.calendar-day {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: default;
  transition: all 0.2s;
  position: relative;
  background: #fafafa;
}

.calendar-day.clickable {
  cursor: pointer;
}

.calendar-day.clickable:hover {
  background: #f0f0f0;
}

.calendar-day.other-month {
  color: #ccc;
}

.calendar-day.today {
  border: 2px solid #333;
}

.calendar-day.checked {
  background: linear-gradient(135deg, #4CAF50, #45B49D);
  color: #fff;
}

.calendar-day.future {
  opacity: 0.5;
}

.day-num {
  font-size: clamp(10px, 2.5vw, 14px);
  font-weight: 500;
}

.check-dot {
  display: none;
}
</style>
