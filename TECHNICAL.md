# 打卡日历技术方案

## 1 技术选型

### 1.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue.js | 3.4+ | 前端框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |
| Pinia | 2.x | 状态管理 |
| IndexedDB | 原生 | 本地数据存储 |
| Day.js | 1.11+ | 日期处理 |

### 1.2 选型理由

**Vue 3 + TypeScript**：Vue 3 的组合式 API 与 TypeScript 结合紧密，类型推断能力强，代码可维护性好。Vue 3 的响应式系统性能优秀，适合日历这种高频交互场景。

**Vite**：开发服务器启动快，热更新体验优秀，打包性能优于 Webpack。

**Pinia**：Vue 3 官方推荐的状态管理库，API 简洁，完美支持 TypeScript。

**IndexedDB**：LocalStorage 容量有限（通常 5MB），IndexedDB 容量大（设备可用空间 50%），适合存储图片等大量数据。

**Day.js**：轻量级日期库（2KB），API 与 Moment.js 兼容，支持 tree-shaking。

---

## 2 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────┐
│                    Browser                           │
│  ┌───────────────────────────────────────────────┐  │
│  │                 Vue Application                │  │
│  │  ┌─────────────┐  ┌─────────────┐             │  │
│  │  │   Views     │  │  Components │             │  │
│  │  │ (页面组件)   │  │ (通用组件)   │             │  │
│  │  └──────┬──────┘  └──────┬──────┘             │  │
│  │         │                │                      │  │
│  │  ┌──────▼──────┐  ┌──────▼──────┐             │  │
│  │  │    Pinia    │  │  Composables│             │  │
│  │  │  (状态管理)  │  │  (逻辑复用)  │             │  │
│  │  └──────┬──────┘  └──────┬──────┘             │  │
│  │         └────────┬────────┘                      │  │
│  │                  │                               │  │
│  │  ┌──────────────▼──────────────┐                │  │
│  │  │      IndexedDB Wrapper       │                │  │
│  │  │     (Dexie.js / custom)      │                │  │
│  │  └──────────────────────────────┘                │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 2.2 模块划分

```
src/
├── api/                 # 业务 API 封装
├── assets/              # 静态资源
├── components/          # 通用组件
│   ├── Calendar/        # 日历相关组件
│   ├── CheckIn/         # 打卡相关组件
│   ├── Modal/           # 弹窗组件
│   └── common/          # 通用UI组件
├── composables/         # 组合式函数
├── layouts/             # 布局组件
├── pages/               # 页面组件
├── router/              # 路由配置
├── stores/              # Pinia 状态管理
├── types/               # TypeScript 类型定义
├── utils/               # 工具函数
└── App.vue
└── main.ts
```

---

## 3 数据存储方案

### 3.1 IndexedDB 数据结构

```
checkin-calendar-db (数据库)
├── calendars (对象仓库)
│   ├── id: string (UUID)
│   ├── name: string
│   ├── icon: string
│   ├── color: string
│   ├── description: string
│   ├── createdAt: number (timestamp)
│   └── updatedAt: number
│
├── records (对象仓库)
│   ├── id: string (UUID)
│   ├── calendarId: string (外键)
│   ├── date: string (YYYY-MM-DD)
│   ├── checkInTime: number (timestamp)
│   ├── content: string
│   ├── images: string[] (Base64 或 Blob URL)
│   ├── isRetroactive: boolean
│   └── retroactiveTime?: number
│
└── settings (对象仓库)
    └── id: "user-settings"
        ├── theme: "light" | "dark"
        └── version: number
```

### 3.2 存储策略

| 数据类型 | 存储方式 | 容量限制 | 说明 |
|---------|---------|---------|------|
| 日历元数据 | IndexedDB | 无限制 | 结构化数据 |
| 打卡记录 | IndexedDB | 无限制 | 结构化数据 |
| 图片 | IndexedDB (Blob) | ≤50MB | 压缩后存储 |
| 简单配置 | LocalStorage | 5MB | 主题偏好等 |

### 3.3 图片处理流程

```
用户选择图片
    │
    ▼
┌──────────────┐
│ 文件类型校验  │ ──→ 不通过 → 提示错误
└──────┬───────┘
       │ 通过
       ▼
┌──────────────┐
│ 尺寸压缩     │ ──→ 超过最大尺寸 → 等比缩放
│ (max 1920px) │
└──────┬───────┘
       │ 压缩后
       ▼
┌──────────────┐
│ 质量压缩     │ ──→ JPEG 80% 质量
└──────┬───────┘
       │ 压缩后
       ▼
┌──────────────┐
│ 转换为 Blob  │
└──────┬───────┘
       │
       ▼
  存储到 IndexedDB
```

---

## 4 核心功能实现

### 4.1 日历组件

#### 4.1.1 数据结构

```typescript
interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}

interface CalendarDay {
  date: Dayjs;           // 日期
  day: number;           // 几日
  isCurrentMonth: boolean;
  isToday: boolean;
  isChecked: boolean;    // 是否已打卡
  record?: CheckInRecord; // 打卡记录
}
```

#### 4.1.2 渲染逻辑

1. 获取当前年月，计算该月第一天是星期几
2. 生成日历网格数据（42个格子：6行 × 7天）
3. 标记今日位置
4. 标记已打卡日期
5. 根据 `isChecked` 状态应用不同样式

### 4.2 打卡功能

#### 4.2.1 打卡流程

```typescript
async function checkIn(calendarId: string, date: string, content: string, images: File[]) {
  // 1. 校验
  const calendar = await getCalendar(calendarId);
  const existingRecord = await getRecord(calendarId, date);
  if (existingRecord) {
    throw new Error('该日期已打卡');
  }

  // 2. 处理图片
  const imageUrls = await Promise.all(
    images.map(file => compressAndStoreImage(file))
  );

  // 3. 创建记录
  const record: CheckInRecord = {
    id: generateUUID(),
    calendarId,
    date,
    checkInTime: Date.now(),
    content,
    images: imageUrls,
    isRetroactive: isRetroactive(date),
  };

  // 4. 保存
  await saveRecord(record);

  // 5. 更新日历的连续打卡统计
  await updateCalendarStats(calendarId);

  return record;
}
```

### 4.3 数据统计

#### 4.3.1 连续打卡计算

```typescript
function calculateStreak(records: CheckInRecord[]): number {
  if (records.length === 0) return 0;

  // 按日期排序
  const sorted = records
    .filter(r => !r.isRetroactive) // 仅计算正常打卡
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sorted.length === 0) return 0;

  let streak = 0;
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  // 检查是否今天或昨天有打卡
  const latestDate = sorted[0].date;
  if (latestDate !== today && latestDate !== yesterday) {
    return 0; // 中断了
  }

  // 倒序计算连续天数
  for (let i = 0; i < sorted.length; i++) {
    const expectedDate = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    if (sorted.find(r => r.date === expectedDate)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
```

### 4.4 本地存储服务

```typescript
// db.ts
import Dexie, { type Table } from 'dexie';

interface Calendar {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

interface Record {
  id: string;
  calendarId: string;
  date: string;
  checkInTime: number;
  content: string;
  images: string[];
  isRetroactive: boolean;
  retroactiveTime?: number;
}

class CheckInDatabase extends Dexie {
  calendars!: Table<Calendar>;
  records!: Table<Record>;

  constructor() {
    super('checkin-calendar-db');
    this.version(1).stores({
      calendars: 'id, name, createdAt',
      records: 'id, calendarId, date, checkInTime',
    });
  }
}

export const db = new CheckInDatabase();
```

---

## 5 组件设计

### 5.1 组件树

```
App.vue
├── Layout
│   ├── Header
│   └── Main
│       ├── HomePage (日历列表)
│       │   ├── CalendarCard[]
│       │   └── AddButton
│       ├── CalendarDetailPage
│       │   ├── CalendarHeader
│       │   ├── Tabs (日历/记录)
│       │   ├── CalendarView
│       │   │   ├── CalendarNav
│       │   │   ├── WeekdaysHeader
│       │   │   └── CalendarGrid
│       │   │       └── CalendarDay[]
│       │   └── RecordList
│       │       └── RecordItem[]
│       └── SettingsPage
│           └── SettingsContent
│
└── Modals (全局)
    ├── CheckInModal
    │   ├── DateHeader
    │   ├── ContentInput
    │   └── ImageUploader
    └── AddCalendarModal
        ├── NameInput
        ├── IconSelector
        ├── ColorSelector
        └── DescriptionInput
```

### 5.2 关键组件接口

```typescript
// CalendarDay.vue
interface CalendarDayProps {
  date: Dayjs;
  isCurrentMonth: boolean;
  isToday: boolean;
  isChecked: boolean;
  record?: CheckInRecord;
}

interface CalendarDayEmits {
  (e: 'click', date: Dayjs): void;
  (e: 'contextmenu', date: Dayjs): void;
}

// CalendarCard.vue
interface CalendarCardProps {
  calendar: Calendar;
  stats: CalendarStats;
}

interface CalendarStats {
  streak: number;
  total: number;
  rate: number;
}
```

---

## 6 工具函数

### 6.1 日期工具

```typescript
// utils/date.ts
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export function formatDate(date: dayjs.Dayjs, format = 'YYYY-MM-DD'): string {
  return date.format(format);
}

export function getMonthData(year: number, month: number): CalendarDay[] {
  const start = dayjs(`${year}-${month}-01`);
  const daysInMonth = start.daysInMonth();
  const startDayOfWeek = start.day(); // 0-6

  const days: CalendarDay[] = [];

  // 上月日期
  const prevMonth = start.subtract(1, 'month');
  const prevDaysInMonth = prevMonth.daysInMonth();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: prevMonth.date(prevDaysInMonth - i),
      day: prevDaysInMonth - i,
      isCurrentMonth: false,
      isToday: false,
      isChecked: false,
    });
  }

  // 当月日期
  for (let i = 1; i <= daysInMonth; i++) {
    const date = start.date(i);
    const today = dayjs();
    days.push({
      date,
      day: i,
      isCurrentMonth: true,
      isToday: date.isSame(today, 'day'),
      isChecked: false,
    });
  }

  // 下月日期，补齐42个格子
  const remaining = 42 - days.length;
  const nextMonth = start.add(1, 'month');
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: nextMonth.date(i),
      day: i,
      isCurrentMonth: false,
      isToday: false,
      isChecked: false,
    });
  }

  return days;
}
```

### 6.2 图片压缩

```typescript
// utils/image.ts
export async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // 等比缩放
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('压缩失败'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

---

## 7 路由配置

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/HomePage.vue'),
  },
  {
    path: '/calendar/:id',
    name: 'CalendarDetail',
    component: () => import('@/pages/CalendarDetailPage.vue'),
    props: true,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/SettingsPage.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
```

---

## 8 状态管理

```typescript
// stores/calendar.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '@/db';
import type { Calendar, CheckInRecord } from '@/types';

export const useCalendarStore = defineStore('calendar', () => {
  const calendars = ref<Calendar[]>([]);
  const currentCalendar = ref<Calendar | null>(null);
  const records = ref<CheckInRecord[]>([]);
  const loading = ref(false);

  // 获取所有日历
  async function loadCalendars() {
    loading.value = true;
    try {
      calendars.value = await db.calendars.orderBy('createdAt').reverse().toArray();
    } finally {
      loading.value = false;
    }
  }

  // 创建日历
  async function createCalendar(data: Omit<Calendar, 'id' | 'createdAt' | 'updatedAt'>) {
    const calendar: Calendar = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.calendars.add(calendar);
    calendars.value.unshift(calendar);
    return calendar;
  }

  // 删除日历
  async function deleteCalendar(id: string) {
    await db.transaction('rw', db.calendars, db.records, async () => {
      await db.records.where('calendarId').equals(id).delete();
      await db.calendars.delete(id);
    });
    calendars.value = calendars.value.filter(c => c.id !== id);
  }

  // 加载日历的打卡记录
  async function loadRecords(calendarId: string) {
    records.value = await db.records
      .where('calendarId')
      .equals(calendarId)
      .sortBy('checkInTime');
    records.value.reverse();
  }

  // 打卡
  async function checkIn(calendarId: string, date: string, content: string, images: string[]) {
    const record: CheckInRecord = {
      id: crypto.randomUUID(),
      calendarId,
      date,
      checkInTime: Date.now(),
      content,
      images,
      isRetroactive: false,
    };
    await db.records.add(record);
    records.value.push(record);
    return record;
  }

  // 计算统计数据
  const stats = computed(() => {
    const total = records.value.length;
    const today = dayjs().format('YYYY-MM-DD');
    const checkedToday = records.value.some(r => r.date === today);
    const streak = calculateStreak(records.value);
    const monthDays = dayjs().daysInMonth();
    const monthChecked = records.value.filter(r =>
      r.date.startsWith(dayjs().format('YYYY-MM-'))
    ).length;
    const rate = Math.round((monthChecked / monthDays) * 100);

    return { total, streak, rate, checkedToday };
  });

  return {
    calendars,
    currentCalendar,
    records,
    loading,
    loadCalendars,
    createCalendar,
    deleteCalendar,
    loadRecords,
    checkIn,
    stats,
  };
});
```

---

## 9 构建部署

### 9.1 构建配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]',
      },
    },
  },
});
```

### 9.2 部署方案

**方案一：Vercel（推荐）**

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 导入项目，自动检测为 Vue 项目
3. 点击 Deploy 完成部署
4. 访问 `https://your-project.vercel.app`

**方案二：GitHub Pages**

1. 在 `vite.config.ts` 配置 `base: './'`
2. 运行 `npm run build`
3. 将 `dist` 目录内容推送到 `gh-pages` 分支
4. 访问 `https://username.github.io/repo-name`

**方案三：本地静态服务器**

```bash
# 使用 http-server
npx http-server dist -p 3000

# 或使用 Nginx
```

---

## 10 性能优化

### 10.1 优化策略

| 优化点 | 策略 |
|-------|------|
| 图片加载 | 懒加载 + 渐进式加载 |
| 日历渲染 | 虚拟滚动（如果数据量大） |
| 状态缓存 | Pinia 持久化插件 |
| 包体积 | 按需引入组件和工具函数 |
| 交互响应 | 乐观更新（先更新UI，后存库） |

### 10.2 代码分割

```typescript
// 路由懒加载
const CalendarDetailPage = () => import('@/pages/CalendarDetailPage.vue');

// 组件懒加载
const CalendarDay = defineAsyncComponent(() =>
  import('@/components/Calendar/CalendarDay.vue')
);
```

---

## 11 开发规范

### 11.1 Git 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具相关
```

### 11.2 代码风格

- 使用 ESLint + Prettier
- Vue 组件使用 `<script setup>` 语法
- 组件名使用 PascalCase
- CSS 类名使用 kebab-case

---

*文档版本：1.0*
*创建日期：2024年*
