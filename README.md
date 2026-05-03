# OpenNovel

一个基于 Cloudflare 全栈基础设施构建的中文小说阅读平台。

在线访问：[opennovel.zxs.io](https://opennovel.zxs.io)

## 功能特性

### 读者端

- **小说浏览** — 网格视图展示小说封面、连载状态、作者信息
- **分类筛选** — 支持按分类标签过滤，水平滚动标签栏
- **搜索** — 按书名或作者搜索小说
- **全屏阅读器** — 支持两种阅读模式：
  - 翻页模式：带动画翻页效果，支持滑动和点击
  - 滚动模式：连续垂直滚动
- **阅读主题** — 4 种内置主题（默认/浅色、护眼/米色、绿色、夜间/深色）
- **字号调节** — 5 档字号（14px - 22px）
- **章节导航** — 上/下一章、章节列表侧边栏、键盘快捷键（方向键、Esc）
- **书签** — 在章节任意位置添加书签，记录上下文文本
- **收藏** — 收藏喜欢的小说（本地存储）
- **阅读记录** — 自动记录最近阅读的 50 本小说及阅读进度
- **深色/浅色主题** — 全局主题切换，支持跟随系统偏好

### 管理端

- **小说管理** — 创建、编辑、删除小说（书名、作者、简介、分类、状态）
- **封面上传** — 上传封面图片至 R2 存储
- **批量上传章节** — 拖拽或选择 `.md` / `.txt` 文件批量上传，自动按文件名排序
- **章节管理** — 编辑、删除单个章节

## 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | Cloudflare Workers |
| 后端框架 | Hono |
| 数据库 | Cloudflare D1 (SQLite) |
| 对象存储 | Cloudflare R2 |
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 5 |
| 样式 | Tailwind CSS 3 |
| 路由 | React Router v6 |
| 动画 | Framer Motion |
| 部署 | Wrangler |

## 项目结构

```
OpenNovel/
├── src/                    # 后端 (Hono on Cloudflare Workers)
│   ├── index.ts            # 入口：CORS + 路由挂载
│   ├── types.ts            # 共享 TypeScript 类型定义
│   ├── auth.ts             # Basic Auth 中间件
│   └── routes/
│       ├── public.ts       # 公开只读 API
│       └── admin.ts        # 管理端 CRUD API
│
├── frontend/               # 前端 SPA (Vite + Tailwind)
│   └── src/
│       ├── pages/          # 页面组件
│       ├── components/     # 通用组件（阅读器、布局等）
│       ├── hooks/          # 自定义 Hooks
│       └── api.ts          # API 请求封装
│
├── migrations/             # D1 数据库迁移
├── wrangler.toml           # Cloudflare Workers 配置
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm
- Cloudflare 账号（部署时需要）

### 安装依赖

```bash
# 后端依赖
npm install

# 前端依赖
cd frontend && npm install
```

### 环境变量

复制环境变量模板并配置：

```bash
cp .env.example .env
```

需要设置以下变量：

| 变量 | 说明 |
|------|------|
| `ADMIN_USERNAME` | 管理员用户名 |
| `ADMIN_PASSWORD` | 管理员密码 |

### 本地开发

启动后端开发服务器：

```bash
npm run dev
# 后端运行在 http://localhost:8787
```

在另一个终端启动前端开发服务器：

```bash
cd frontend
npm run dev
# 前端运行在 http://localhost:5173，自动代理 /api 请求到后端
```

### 数据库迁移

```bash
# 本地开发
wrangler d1 migrations apply opennovel-db --local

# 生产环境
wrangler d1 migrations apply opennovel-db --remote
```

## 部署

```bash
# 构建并部署到 Cloudflare
npm run deploy
```

部署时 Vite 会自动构建前端产物，Wrangler 将后端和前端静态资源一起部署到 Cloudflare Workers。

## API 接口

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/categories` | 获取分类列表及数量 |
| GET | `/api/novels` | 分页获取小说列表（支持分类筛选） |
| GET | `/api/novels/:id` | 获取小说详情及章节列表 |
| GET | `/api/novels/:id/chapters/:chapterId` | 获取章节内容 |
| GET | `/api/storage/:key` | 获取 R2 存储中的资源 |

### 管理接口（需 Basic Auth 认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/admin/novels` | 获取/创建小说 |
| PUT/DELETE | `/api/admin/novels/:id` | 更新/删除小说 |
| POST | `/api/admin/novels/:id/upload-cover` | 上传封面 |
| POST | `/api/admin/novels/:id/chapters/upload` | 批量上传章节 |
| PUT/DELETE | `/api/admin/novels/:id/chapters/:chapterId` | 更新/删除章节 |

## 开发命令

```bash
# 后端
npm run dev        # 启动本地开发服务器
npm run build      # 构建
npm run deploy     # 部署到生产环境
npm run types      # 生成 Wrangler 类型定义
npm run clean      # 清理构建产物

# 前端
cd frontend
npm run dev        # 启动 Vite 开发服务器
npm run build      # TypeScript 检查 + 构建
npm run lint       # ESLint 检查
```

## 架构说明

- **数据存储**：小说元数据存储在 D1（SQLite），章节内容和封面图片存储在 R2
- **用户数据**：收藏、阅读记录、书签、主题偏好均使用 localStorage，无需用户账号
- **部署架构**：前端作为静态 SPA 由 Workers Assets 托管，`/api/**` 请求路由到 Hono Worker
