# 打卡日历 (Check-in Calendar)

一款轻量级、隐私优先的习惯打卡追踪应用。支持创建多个习惯日历，记录每日打卡（含文字和图片），查看连续打卡天数和完成率统计。所有数据本地存储，无需注册登录。

## 功能特性

- **多日历管理** - 创建多个习惯追踪日历，每个日历独立统计
- **每日打卡** - 支持文字记录和图片上传
- **补打卡** - 可为过去日期进行补打卡
- **数据统计** - 连续打卡天数、月度完成率、总打卡次数
- **本地存储** - IndexedDB 存储，隐私安全，无需联网
- **响应式设计** - 适配桌面端和移动端浏览器

## 技术栈

| 技术 | 用途 |
|------|------|
| Vue 3 | 前端框架 (Composition API) |
| TypeScript | 类型安全 |
| Vite 5 | 构建工具 |
| Pinia | 状态管理 |
| Dexie.js | IndexedDB 操作封装 |
| dayjs | 日期处理 |

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

启动开发服务器（默认端口 3000）：

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
src/
├── components/          # 组件
│   ├── Calendar/        # 日历网格、卡片、添加日历弹窗
│   ├── CheckIn/         # 打卡弹窗
│   ├── common/          # 通用组件
│   └── layout/          # 布局组件
├── pages/               # 页面
│   ├── HomePage.vue     # 日历列表页
│   └── CalendarDetailPage.vue  # 日历详情页
├── router/              # 路由配置
├── stores/              # Pinia 状态管理
├── types/               # TypeScript 类型定义
├── utils/               # 工具函数
│   ├── date.ts          # 日期处理和日历生成
│   └── image.ts         # 图片压缩和验证
├── db/                  # IndexedDB 配置
├── App.vue
└── main.ts
```

## 数据模型

### Calendar (日历)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID 唯一标识 |
| name | string | 日历名称 |
| icon | string | Emoji 图标 |
| color | string | 主题颜色 (#RRGGBB) |
| description | string | 习惯描述 |
| createdAt | number | 创建时间戳 |
| updatedAt | number | 更新时间戳 |

### CheckInRecord (打卡记录)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID 唯一标识 |
| calendarId | string | 关联日历 ID |
| date | string | 日期 (YYYY-MM-DD) |
| checkInTime | number | 打卡时间戳 |
| content | string | 打卡文字内容 |
| images | string[] | 图片 Base64 数组 |
| isRetroactive | boolean | 是否补打卡 |

## 核心功能实现

### 日历网格生成

`utils/date.ts` 中的 `generateCalendarDays()` 函数生成 42 天日历网格（6行×7天），包含当月日期、上下月补齐日期，以及每个日期对应的打卡记录。

### 连续打卡计算

`calculateStreak()` 函数从最新打卡日期开始向前计算连续天数。仅统计非补打卡记录，且中断超过一天则连续天数归零。

### 图片处理

上传图片时会进行压缩处理：
- 最大尺寸：1920px（等比缩放）
- 质量：80% JPEG
- 格式验证：仅支持 JPG、PNG、GIF、WebP
- 大小限制：最大 10MB

## 部署

### Vercel（推荐）

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 导入项目，自动识别为 Vue 项目
3. 点击部署

### GitHub Pages

1. 修改 `vite.config.ts` 中的 `base` 为 `./`
2. 运行 `npm run build`
3. 将 `dist` 目录推送到 `gh-pages` 分支

## 隐私说明

所有数据存储在浏览器本地 IndexedDB 中，不会上传到任何服务器。清除浏览器缓存会导致数据丢失，建议定期导出备份。

## 许可证

MIT License
