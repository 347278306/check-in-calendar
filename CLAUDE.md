# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Check-in Calendar (打卡日历) is a lightweight, privacy-focused habit tracking web application. It allows users to create multiple habit calendars, track daily check-ins with text and images, and view statistics like streak count and monthly completion rate. All data is stored locally in IndexedDB - no account required.

**Tech Stack**: Vue 3.4+, TypeScript 5.x, Vite 5.x, Pinia 2.x, Dexie.js (IndexedDB), dayjs

## Build and Development

```bash
# Start development server (port 3000)
npm run dev

# Type-check and build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Project Structure

```
src/
├── components/
│   ├── Calendar/         # Calendar grid, calendar card, add calendar modal
│   ├── CheckIn/          # Check-in modal component
│   ├── common/           # Shared UI components (Modal)
│   └── layout/           # Layout components (Header, Main, Layout)
├── composables/          # Vue composables (none yet)
├── pages/
│   ├── HomePage.vue      # Calendar list page
│   └── CalendarDetailPage.vue  # Individual calendar view
├── router/               # Vue Router config
├── stores/               # Pinia stores (useCalendarStore)
├── types/                # TypeScript interfaces
├── utils/
│   ├── date.ts           # Calendar day generation, streak calculation
│   ├── image.ts          # Image compression and validation
│   └── index.ts          # Utility functions (debounce, throttle, etc.)
├── db/                   # IndexedDB configuration (Dexie.js)
├── App.vue
└── main.ts
```

### Data Model

**Calendar** - Habit tracker entity
- `id`: UUID
- `name`, `icon`, `color`, `description`
- `createdAt`, `updatedAt`: timestamps

**CheckInRecord** - Check-in entry
- `id`: UUID
- `calendarId`: foreign key to Calendar
- `date`: YYYY-MM-DD format
- `checkInTime`: timestamp
- `content`: text description
- `images`: Base64 encoded image array
- `isRetroactive`: boolean (true for past-date check-ins)

**UserSettings** - App preferences
- `id`: fixed to "user-settings"
- `theme`: "light" | "dark"
- `version`: schema version

### Core Components

- **CalendarGrid**: Renders 6x7 grid (42 days) with navigation for month switching
- **CalendarCard**: Displays habit summary (streak, total, completion rate)
- **CheckInModal**: Handles check-in with text input and image upload
- **AddCalendarModal**: Creates new habit trackers with emoji icons and colors

### Routing

- `/` - Home page with all calendars list
- `/calendar/:id` - Individual calendar detail with calendar grid

### State Management (Pinia)

`useCalendarStore` manages:
- `calendars[]`: All habit calendars
- `records[]`: Check-in records (filtered by calendarId)
- `loading`: Loading state

Key actions:
- `loadCalendars()`, `loadRecords(calendarId)`
- `createCalendar(params)`, `updateCalendar()`, `deleteCalendar()`
- `checkIn(calendarId, date, content, images)`
- `getCalendarStats(calendarId)`: Returns { streak, total, rate, checkedToday }

### Local Storage

**IndexedDB** (via Dexie.js) stores all data:
- Database: `checkin-calendar-db`
- Stores: `calendars`, `records`, `settings`
- Images stored as Base64 strings in `records.images`

### Date Utilities (`utils/date.ts`)

- `generateCalendarDays(year, month, records)`: Generates 42-day calendar grid
- `calculateStreak(records)`: Computes consecutive check-in days
- `calculateMonthlyRate(records, year, month)`: Returns percentage (0-100)

### Image Handling (`utils/image.ts`)

- `compressImage(file)`: Resizes to max 1920px, 80% quality JPEG
- `processImage(file)`: Returns Base64 string for storage
- `validateImage(file)`: Checks type (JPEG/PNG/GIF/WebP) and size (<10MB)

## Key Files

- `src/db/index.ts:4` - Dexie database schema definition
- `src/stores/calendar.ts:8` - Main Pinia store
- `src/utils/date.ts:38` - Calendar grid generation logic
- `src/utils/date.ts:100` - Streak calculation algorithm
- `src/types/index.ts:1` - TypeScript interfaces
