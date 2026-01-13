<template>
  <div class="calendar-card" @click="handleClick">
    <div class="card-header">
      <div class="card-icon" :style="{ background: gradientColor }">
        {{ calendar.icon }}
      </div>
      <div class="card-info">
        <h3>{{ calendar.name }}</h3>
        <span v-if="calendar.description">{{ calendar.description }}</span>
        <span v-else>每日打卡</span>
      </div>
    </div>
    <div class="card-stats">
      <div class="stat">
        <div class="stat-value streak">{{ stats.streak }}</div>
        <div class="stat-label">连续天数</div>
      </div>
      <div class="stat">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">总打卡</div>
      </div>
      <div class="stat">
        <div class="stat-value rate">{{ stats.rate }}%</div>
        <div class="stat-label">完成率</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Calendar, CalendarStats } from '@/types'

interface Props {
  calendar: Calendar
  stats: CalendarStats
}

const props = defineProps<Props>()
const router = useRouter()

const gradientColor = computed(() => {
  const color = props.calendar.color
  return `linear-gradient(135deg, ${color}, ${color}88)`
})

function handleClick() {
  router.push(`/calendar/${props.calendar.id}`)
}
</script>

<style scoped>
.calendar-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
}

.calendar-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.card-info h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.card-info span {
  font-size: 13px;
  color: #888;
}

.card-stats {
  display: flex;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.stat {
  text-align: center;
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.stat-value.streak {
  color: #4CAF50;
}

.stat-value.rate {
  color: #2196F3;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
</style>
