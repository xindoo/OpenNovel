# OpenNovel - Online Novel Reading Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete online novel reading website with public browsing, chapter reading, and admin folder upload - all on Cloudflare infrastructure.

**Architecture:** Full-stack application with Cloudflare Workers+Hono backend, React+Tailwind frontend, D1 SQL database for metadata, R2 object storage for markdown files and images. Single admin with Basic Auth, no public user accounts.

**Tech Stack:**
- Backend: Cloudflare Workers, Hono.js, TypeScript
- Database: Cloudflare D1 (SQLite)
- Storage: Cloudflare R2
- Frontend: React 18, TypeScript, Tailwind CSS, Vite, react-markdown
- Auth: HTTP Basic Auth with timing-safe comparison

---

## File Structure Overview

| File | Purpose |
|------|---------|
| `package.json` | Root monorepo package with workspace scripts |
| `tsconfig.json` | Root TypeScript configuration |
| `wrangler.toml` | Cloudflare Worker configuration with D1/R2 bindings |
| `src/index.ts` | Main Hono app entry, routes setup |
| `src/auth.ts` | Basic Auth middleware |
| `src/types.ts` | TypeScript type definitions |
| `src/routes/public.ts` | Public API routes |
| `src/routes/admin.ts` | Admin API routes (auth protected) |
| `migrations/0001_initial.sql` | D1 database initial schema |
| `frontend/package.json` | Frontend dependencies |
| `frontend/vite.config.ts` | Vite configuration |
| `frontend/tailwind.config.js` | Tailwind configuration |
| `frontend/index.html` | HTML entry point |
| `frontend/src/main.tsx` | React entry point |
| `frontend/src/api.ts` | API client functions |
| `frontend/src/components/` | Shared React components |
| `frontend/src/pages/Home.tsx` | Homepage - category browsing |
| `frontend/src/pages/Novel.tsx` | Novel detail with chapter list |
| `frontend/src/pages/Reader.tsx` | Chapter reader with markdown |
| `frontend/src/pages/admin/Dashboard.tsx` | Admin dashboard |
| `frontend/src/pages/admin/Upload.tsx` | Folder upload component |
| `frontend/src/pages/admin/NovelEdit.tsx` | Novel edit/create form |

---

## Task 1: Initialize Project Configuration

**Files to create:**
- Create: `package.json` (root)
- Create: `tsconfig.json` (root)
- Create: `wrangler.toml` (root)
- Create: `.gitignore`
- Create: `.env.example`

**Steps:**
- [ ] **Step 1: Create root package.json with dependencies**
  Include: `hono`, `@cloudflare/workers-types`, `wrangler`, typescript

- [ ] **Step 2: Create tsconfig.json for TypeScript**

- [ ] **Step 3: Create wrangler.toml with D1 and R2 bindings**
  Include: assets binding, compatibility flags `nodejs_compat`, D1 database binding `DB`, R2 binding `STORAGE`

- [ ] **Step 4: Create .gitignore and .env.example**

- [ ] **Step 5: Install dependencies**

- [ ] **Step 6: Verify configuration - run `wrangler types` to generate Env types**

---

## Task 2: Create Database Schema and Migrations

**Files to create:**
- Create: `migrations/0001_initial.sql`

**Steps:**
- [ ] **Step 1: Write initial D1 schema with novels and chapters tables**
  Include: all columns from spec, proper foreign keys, indexes

- [ ] **Step 2: Verify syntax is correct SQLite**

---

## Task 3: Backend - Types and Auth Middleware

**Files to create:**
- Create: `src/types.ts`
- Create: `src/auth.ts`

**Steps:**
- [ ] **Step 1: Define Env interface with D1, R2, ADMIN_USERNAME, ADMIN_PASSWORD**
- [ ] **Step 2: Define types for Novel, Chapter, API responses**
- [ ] **Step 3: Implement Basic Auth middleware with timing-safe comparison**
- [ ] **Step 4: Export auth middleware for use in admin routes**

---

## Task 4: Backend - Public API Routes

**Files to create:**
- Create: `src/routes/public.ts`

**Steps:**
- [ ] **Step 1: Implement `GET /api/categories` - get all categories with novel counts**
- [ ] **Step 2: Implement `GET /api/novels` - list novels with optional category filter**
- [ ] **Step 3: Implement `GET /api/novels/:id` - get novel with chapter list**
- [ ] **Step 4: Implement `GET /api/novels/:id/chapters/:chapterId` - get chapter content from R2**
- [ ] **Step 5: Implement `GET /api/storage/*key` - serve images/assets from R2 with proper content-type**

---

## Task 5: Backend - Admin API Routes

**Files to create:**
- Create: `src/routes/admin.ts`

**Steps:**
- [ ] **Step 1: All routes wrapped with Basic Auth middleware**
- [ ] **Step 2: Implement `GET /api/admin/novels` - list all novels**
- [ ] **Step 3: Implement `POST /api/admin/novels` - create new novel**
- [ ] **Step 4: Implement `PUT /api/admin/novels/:id` - update novel**
- [ ] **Step 5: Implement `DELETE /api/admin/novels/:id` - delete novel (cascade delete chapters via SQL ON DELETE CASCADE)**
- [ ] **Step 6: Implement `POST /api/admin/novels/:id/upload-cover` - upload cover image to R2, update novel**
- [ ] **Step 7: Implement `POST /api/admin/novels/:id/upload-chapters` - handle multiple file upload (folder upload), create chapters in order**
- [ ] **Step 8: Implement `DELETE /api/admin/novels/:id/chapters/:chapterId` - delete chapter from D1 and R2**
- [ ] **Step 9: Implement `PUT /api/admin/novels/:id/chapters/:chapterId` - update chapter metadata**

---

## Task 6: Backend - Main Hono App Entry

**Files to create:**
- Create: `src/index.ts`

**Steps:**
- [ ] **Step 1: Import Hono and configure CORS**
- [ ] **Step 2: Mount public and admin routes**
- [ ] **Step 3: Configure static asset serving for frontend**
- [ ] **Step 4: Export default app**

---

## Task 7: Frontend - Project Initialization

**Files to create:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/vite-env.d.ts`
- Create: `frontend/src/api.ts`

**Steps:**
- [ ] **Step 1: Initialize Vite React TypeScript project structure**
- [ ] **Step 2: Install dependencies: react, react-dom, react-markdown, axios, tailwindcss, postcss, autoprefixer**
- [ ] **Step 3: Configure Vite with proxy to backend for dev mode**
- [ ] **Step 4: Configure Tailwind CSS**
- [ ] **Step 5: Create index.html with proper HTML structure and responsive meta tags**
- [ ] **Step 6: Create main.tsx with React entry and Tailwind imports**
- [ ] **Step 7: Create API client with all public and admin API functions**

---

## Task 8: Frontend - Homepage (Public Category Browsing)

**Files to create:**
- Create: `frontend/src/pages/Home.tsx`
- Create: `frontend/src/components/NovelCard.tsx`

**Steps:**
- [ ] **Step 1: Home page component - fetch categories and novels**
- [ ] **Step 2: Sidebar for category selection**
- [ ] **Step 3: Responsive grid of novel cards**
- [ ] **Step 4: NovelCard component - shows cover, title, author, category**
- [ ] **Step 5: Clicking novel card navigates to novel detail page**

---

## Task 9: Frontend - Novel Detail Page

**Files to create:**
- Create: `frontend/src/pages/Novel.tsx`

**Steps:**
- [ ] **Step 1: Fetch novel and chapter list by ID**
- [ ] **Step 2: Layout - cover on left (desktop), metadata on right**
- [ ] **Step 3: Show title, author, category, status, description**
- [ ] **Step 4: Ordered list of chapters - each links to reader**
- [ ] **Step 5: Responsive design for mobile (stacked layout)**

---

## Task 10: Frontend - Chapter Reader

**Files to create:**
- Create: `frontend/src/pages/Reader.tsx`

**Steps:**
- [ ] **Step 1: Fetch novel and chapter content by IDs**
- [ ] **Step 2: Top navigation bar with back to novel list and chapter title**
- [ ] **Step 3: Render markdown with react-markdown**
- [ ] **Step 4: Fix image URLs to point to /api/storage/* for images from R2**
- [ ] **Step 5: Add previous/next chapter navigation at bottom**
- [ ] **Step 6: Typography styling with comfortable line height for reading**
- [ ] **Step 7: Responsive - full width on mobile, max-width on desktop**

---

## Task 11: Frontend - Admin Dashboard

**Files to create:**
- Create: `frontend/src/pages/admin/Dashboard.tsx`
- Create: `frontend/src/components/AdminLayout.tsx`

**Steps:**
- [ ] **Step 1: AdminLayout with navigation header**
- [ ] **Step 2: Dashboard - list all novels with edit/delete buttons**
- [ ] **Step 3: "Create New Novel" button**
- [ ] **Step 4: Basic Auth handled by browser - page just redirects to edit/create after auth**

---

## Task 12: Frontend - Novel Edit/Create Form

**Files to create:**
- Create: `frontend/src/pages/admin/NovelEdit.tsx`

**Steps:**
- [ ] **Step 1: Form with fields: title, author, description, category, status (ongoing/completed)**
- [ ] **Step 2: Cover image upload with preview**
- [ ] **Step 3: For existing novel - display current chapter list with delete options**
- [ ] **Step 4: "Upload Folder" button links to upload page**
- [ ] **Step 5: Save changes via PUT/POST API**

---

## Task 13: Frontend - Folder Upload

**Files to create:**
- Create: `frontend/src/pages/admin/Upload.tsx`

**Steps:**
- [ ] **Step 1: Directory/folder selection input using `webkitdirectory`**
- [ ] **Step 2: Filter for .md files only**
- [ ] **Step 3: Sort files lexicographically (filename order)**
- [ ] **Step 4: Display list of detected chapters with extracted title from filename**
- [ ] **Step 5: Upload all files at once via multipart form**
- [ ] **Step 6: Show upload progress**
- [ ] **Step 7: After upload completes, navigate back to novel edit page**

---

## Task 14: Frontend - Routing and Styling

**Files to create/modify:**
- Create: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`
- Create: `frontend/src/index.css` (with Tailwind directives)

**Steps:**
- [ ] **Step 1: Set up React Router DOM with all routes**
  - `/` → Home
  - `/novel/:id` → Novel
  - `/novel/:id/chapter/:chapterId` → Reader
  - `/admin` → Admin Dashboard
  - `/admin/novel/new` → Create Novel
  - `/admin/novel/:id/edit` → Edit Novel
  - `/admin/novel/:id/upload` → Folder Upload

- [ ] **Step 2: Add global Tailwind styles in index.css**
- [ ] **Step 3: Follow web-design-guidelines - clean modern minimalist design**
- [ ] **Step 4: Add responsive design - mobile-first approach**

---

## Task 15: Local Development Testing

**Steps:**
- [ ] **Step 1: Create local D1 database**
  Run: `wrangler d1 create novel-app-db --local`

- [ ] **Step 2: Apply migrations locally**
  Run: `wrangler d1 migrations apply novel-app-db --local`

- [ ] **Step 3: Create local R2 bucket**
  Run: `wrangler r2 bucket create novel-assets`

- [ ] **Step 4: Start dev server**
  Run: `wrangler dev` in one terminal, `cd frontend && npm run dev` in another

- [ ] **Step 5: Test public API endpoints with curl**
- [ ] **Step 6: Test admin authentication**
- [ ] **Step 7: Fix any type errors or issues found**

---

## Task 16: Build Frontend for Production

**Steps:**
- [ ] **Step 1: Build frontend**
  Run: `cd frontend && npm run build`

- [ ] **Step 2: Verify output in `frontend/dist`**
- [ ] **Step 3: Check that wrangler.toml correctly points to `frontend/dist`**

---

## Verification Checklist

Before deployment:

- [ ] All TypeScript types compile without errors
- [ ] Database schema applied correctly
- [ ] Basic Auth works for admin routes
- [ ] Folder upload correctly processes multiple .md files
- [ ] Chapters sorted correctly by filename
- [ ] Markdown renders with images working
- [ ] Responsive layout works on mobile
- [ ] All pages follow modern design guidelines

---

## Deployment Notes

After completion:
1. User needs to:
   - Create Cloudflare account
   - Install wrangler CLI
   - Login with `wrangler login`
   - Create D1 database: `wrangler d1 create opennovel-db`
   - Update `wrangler.toml` with database_id
   - Create R2 bucket: `wrangler r2 bucket create opennovel-assets`
   - Update `wrangler.toml` with bucket name
   - Set admin credentials:
     ```bash
     wrangler secret put ADMIN_USERNAME
     wrangler secret put ADMIN_PASSWORD
     ```
   - Apply migrations to production: `wrangler d1 migrations apply opennovel-db --remote`
   - Deploy: `wrangler deploy`
