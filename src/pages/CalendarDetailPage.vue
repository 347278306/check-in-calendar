<template>
  <Layout :show-back="true" @back="handleBack">
    <template #right>
      <div class="header-icon" @click="showEditModal = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </div>
    </template>

    <div v-if="!calendar" class="loading">
      <p>日历不存在</p>
      <router-link to="/" class="btn-link">返回首页</router-link>
    </div>

    <template v-else>
      <div class="calendar-header">
        <div class="calendar-title">
          <div class="title-icon" :style="{ background: calendar.color }">
            {{ calendar.icon }}
          </div>
          <h2>{{ calendar.name }}</h2>
        </div>
      </div>

      <div class="tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'calendar' }"
          @click="activeTab = 'calendar'"
        >日历</button>
        <button
          class="tab"
          :class="{ active: activeTab === 'records' }"
          @click="activeTab = 'records'"
        >打卡记录</button>
      </div>

      <!-- 日历视图 -->
      <div v-show="activeTab === 'calendar'" class="tab-content">
        <CalendarGrid
          :records="store.records"
          :year="year"
          :month="month"
          @dayClick="handleDayClick"
          @monthChange="handleMonthChange"
        />
      </div>

      <!-- 打卡记录列表 -->
      <div v-show="activeTab === 'records'" class="tab-content">
        <div v-if="calendarRecords.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>暂无打卡记录</h3>
          <p>开始你的打卡之旅吧！</p>
        </div>
        <div v-else class="record-list">
          <div
            v-for="record in calendarRecords"
            :key="record.id"
            class="record-item"
            @click="showRecordDetail(record)"
          >
            <div class="record-date">
              <div class="day">{{ getDay(record.date) }}</div>
              <div class="month">{{ getMonth(record.date) }}月</div>
            </div>
            <div class="record-content">
              <div class="record-text">{{ record.content || '今日打卡' }}</div>
              <div v-if="record.images.length > 0" class="record-images">
                <img
                  v-for="(img, i) in record.images.slice(0, 3)"
                  :key="i"
                  :src="img"
                  alt=""
                />
                <span v-if="record.images.length > 3" class="more">
                  +{{ record.images.length - 3 }}
                </span>
              </div>
              <div class="record-meta">
                {{ formatTime(record.checkInTime) }}
                <span v-if="record.isRetroactive" class="retroactive">补打卡</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 打卡弹窗 -->
    <CheckInModal
      v-model="showCheckInModal"
      :calendar="calendar"
      :date="selectedDate"
      :existing-record="existingRecord"
      @submit="handleCheckIn"
    />

    <!-- 编辑日历弹窗 -->
    <AddCalendarModal
      v-model="showEditModal"
      :calendar="calendar"
      @submit="handleUpdateCalendar"
      @delete="handleDeleteCalendar"
    />
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Layout from '@/components/layout/Layout.vue'
import { CalendarGrid, AddCalendarModal } from '@/components/Calendar'
import { CheckInModal } from '@/components/CheckIn'
import { useCalendarStore } from '@/stores'
import { formatTimestamp } from '@/utils'
import type { CheckInRecord } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useCalendarStore()

const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth() + 1)
const activeTab = ref<'calendar' | 'records'>('calendar')
const showCheckInModal = ref(false)
const showEditModal = ref(false)
const selectedDate = ref('')
const existingRecord = ref<CheckInRecord | null>(null)

const calendar = computed(() => {
  const id = route.params.id as string
  return store.calendars.find(c => c.id === id)
})

const calendarRecords = computed(() => {
  const id = route.params.id as string
  return store.records
    .filter(r => r.calendarId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

onMounted(async () => {
  if (!calendar.value) {
    router.push('/')
    return
  }
  await store.loadRecords(calendar.value.id)
})

watch(() => route.params.id, async (id) => {
  if (id && calendar.value) {
    await store.loadRecords(id as string)
  }
})

function handleBack() {
  router.push('/')
}

function handleMonthChange(y: number, m: number) {
  year.value = y
  month.value = m
}

function handleDayClick(day: { date: string; record?: CheckInRecord }) {
  selectedDate.value = day.date
  existingRecord.value = day.record || null
  showCheckInModal.value = true
}

async function handleCheckIn(data: { content: string; images: string[] }) {
  if (!calendar.value) return
  await store.checkIn(calendar.value.id, selectedDate.value, data.content, data.images)
}

async function handleUpdateCalendar(data: { name: string; icon: string; color: string; description: string }) {
  if (!calendar.value) return
  await store.updateCalendar(calendar.value.id, data)
}

async function handleDeleteCalendar() {
  if (!calendar.value) return
  await store.deleteCalendar(calendar.value.id)
  router.push('/')
}

function showRecordDetail(record: CheckInRecord) {
  selectedDate.value = record.date
  existingRecord.value = record
  showCheckInModal.value = true
}

function getDay(dateStr: string): string {
  return dateStr.split('-')[2]
}

function getMonth(dateStr: string): string {
  return dateStr.split('-')[1]
}

function formatTime(timestamp: number): string {
  return formatTimestamp(timestamp) + ' 完成打卡'
}
</script>

<style scoped>
.calendar-header {
  margin-bottom: 24px;
}

.calendar-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.calendar-title h2 {
  font-size: 24px;
  font-weight: 600;
}

.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  background: #f0f0f0;
  padding: 4px;
  border-radius: 12px;
  width: fit-content;
}

.tab {
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  background: transparent;
  color: #666;
}

.tab.active {
  background: #fff;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.record-list {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
}

.record-item {
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
  display: flex;
  gap: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.record-item:hover {
  background: #fafafa;
}

.record-item:last-child {
  border-bottom: none;
}

.record-date {
  width: 50px;
  text-align: center;
  flex-shrink: 0;
}

.record-date .day {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.record-date .month {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.record-content {
  flex: 1;
  min-width: 0;
}

.record-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.record-images {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.record-images img {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
}

.record-images .more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: #f0f0f0;
  color: #666;
  font-size: 12px;
}

.record-meta {
  font-size: 12px;
  color: #999;
}

.record-meta .retroactive {
  margin-left: 8px;
  padding: 2px 6px;
  background: #fff3cd;
  color: #856404;
  border-radius: 4px;
  font-size: 11px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.btn-link {
  display: inline-block;
  margin-top: 16px;
  color: #2196F3;
  text-decoration: underline;
}

.header-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.header-icon:hover {
  background: #f0f0f0;
}
</style>
