# Online Novel Reading Website - Design Specification

## Project Overview

Full-stack online novel reading website built entirely on Cloudflare infrastructure. Features:
- Public browsing of novels by category
- Clean chapter reading experience with full Markdown support
- Admin backend with folder upload (one chapter = one .md file)
- All infrastructure on Cloudflare: Workers, D1 (SQL database), R2 (object storage), Static Assets hosting

## Requirements

### Functional Requirements

**Public Frontend:**
1. Homepage displays novels grouped by category
2. Novel detail page shows description, cover, and chapter list
3. Chapter reader page renders Markdown content with images
4. Navigation between chapters
5. Search novels by title/author (nice-to-have)

**Admin Backend (Basic Auth protected):**
1. Create/edit/delete novels
2. Upload novel cover images
3. Folder upload - upload entire folder of .md files, each file becomes a chapter
4. Auto-order chapters by filename (lexicographical order works for 01.md, 02.md naming)
5. Edit chapter metadata

**Non-functional Requirements:**
- Modern clean design following web-design-guidelines
- Fully responsive (mobile + desktop)
- All content stored on Cloudflare infrastructure
- Zero egress fees (thanks to R2)
- Serverless edge deployment

## Architecture

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Backend/API** | Cloudflare Workers + Hono.js | Modern edge-first framework, native Cloudflare service bindings |
| **Database** | Cloudflare D1 | Serverless SQLite at edge, perfect for read-heavy novel site with single admin writer |
| **Object Storage** | Cloudflare R2 | Zero egress fees for stored markdown and images |
| **Frontend** | React 18 + TypeScript + Tailwind CSS | Popular, modern, well-supported |
| **Markdown Rendering** | react-markdown | Secure, feature-rich Markdown rendering for React |
| **Hosting** | Cloudflare Workers Static Assets | Single deployment contains both API and static frontend |
| **Authentication** | HTTP Basic Auth | Simplest possible for single admin user |

### Project Structure

```
open-novel/
├── src/                      # Backend API (Hono)
│   ├── auth.ts              # Basic Auth middleware
│   ├── routes/
│   │   ├── admin.ts         # Admin API endpoints
│   │   └── public.ts        # Public API endpoints
│   ├── db/
│   │   └── schema.sql       # Database schema
│   ├── types.ts             # TypeScript types
│   └── index.ts             # Main Hono app entry
├── frontend/                # Frontend React app
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── components/      # Shared components
│   │   ├── pages/
│   │   │   ├── Home.tsx       # Category browse
│   │   │   ├── Novel.tsx      # Novel detail
│   │   │   ├── Reader.tsx     # Chapter reader
│   │   │   └── admin/
│   │   │       ├── Dashboard.tsx
│   │   │       └── Upload.tsx  # Folder upload
│   │   ├── api.ts           # API client
│   │   └── main.tsx         # Entry point
│   └── dist/                # Build output (deployed as static assets)
├── migrations/              # D1 migrations
│   └── 0001_initial.sql
├── .env.example
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── wrangler.toml            # Cloudflare Worker configuration
```

### Database Schema (D1)

#### `novels` table

Stores metadata about each novel.

```sql
CREATE TABLE IF NOT EXISTS novels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  cover_image_key TEXT,
  status TEXT NOT NULL DEFAULT 'ongoing',  -- 'ongoing' or 'completed'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CONSTRAINT status_check CHECK (status IN ('ongoing', 'completed'))
);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_novels_category ON novels(category);
-- Index for browsing by updated date
CREATE INDEX IF NOT EXISTS idx_novels_updated_at ON novels(updated_at DESC);
```

#### `chapters` table

Stores metadata about each chapter. Actual content stored in R2.

```sql
CREATE TABLE IF NOT EXISTS chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  novel_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  content_key TEXT NOT NULL,  -- R2 object key
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

-- Index for ordering chapters
CREATE INDEX IF NOT EXISTS idx_chapters_novel_id ON chapters(novel_id, chapter_number ASC);
```

### Storage Structure (R2)

Object key naming convention:

```
novels/
├── {novel-id}/
│   ├── covers/{filename}    # Novel cover image
│   ├── chapters/{filename} # Chapter markdown files
│   └── images/{filename}    # Images embedded in chapters
```

Examples:
- `novels/1/covers/cover.jpg`
- `novels/1/chapters/chapter-01.md`
- `novels/1/images/illustration-01.png`

### API Endpoints

#### Public API

- `GET /api/categories` - Get list of all categories with novel counts
- `GET /api/novels` - List novels (optionally filtered by category)
- `GET /api/novels/:id` - Get novel metadata + chapter list
- `GET /api/novels/:id/chapters/:chapterId` - Get chapter content (markdown as text)
- `GET /api/storage/:key` - Serve image/asset from R2

#### Admin API (protected by Basic Auth)

- `GET /api/admin/novels` - List all novels
- `POST /api/admin/novels` - Create new novel
- `PUT /api/admin/novels/:id` - Update novel metadata
- `DELETE /api/admin/novels/:id` - Delete novel
- `POST /api/admin/novels/:id/upload-cover` - Upload novel cover image
- `POST /api/admin/novels/:id/upload-chapters` - Upload multiple chapters (folder upload)
- `DELETE /api/admin/novels/:id/chapters/:chapterId` - Delete chapter
- `PUT /api/admin/novels/:id/chapters/:chapterId` - Update chapter metadata

## Frontend Pages

### Public Pages

1. **Home** (`/`)
   - Category navigation sidebar
   - Grid of novel cards with cover, title, author, category
   - Filter by category

2. **Novel Detail** (`/novel/:id`)
   - Cover image on left, metadata on right
   - Description
   - Ordered chapter list with links
   - Last updated date

3. **Reader** (`/novel/:id/chapter/:chapterId`)
   - Clean, distraction-free reading layout
   - Top navigation bar with novel/chapter title, back button
   - Previous/Next chapter navigation at bottom
   - Markdown content rendered with proper typography
   - Responsive - comfortable reading on mobile

### Admin Pages (protected by Basic Auth)

1. **Dashboard** (`/admin`)
   - List all novels with quick actions
   - Button to create new novel

2. **Novel Edit/Create** (`/admin/novel/:id?`)
   - Form for title, author, description, category, status
   - Cover image preview + upload
   - Chapter list

3. **Upload** (`/admin/novel/:id/upload`)
   - Folder drop zone (accepts folder selection via HTML5 input)
   - Shows detected .md files before upload
   - Auto-sorts by filename
   - Upload all chapters in one operation

## Design Guidelines

- Follow [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)
- Clean, modern minimalist design
- Good typography with comfortable line heights for reading
- Mobile-first responsive design
- Dark/light mode toggle (nice-to-have)

## Success Criteria

1. Can create a novel via admin
2. Can upload an entire folder of markdown chapters
3. Chapters are correctly ordered by filename
4. Public can browse by category
5. Public can read chapters with images working
6. All deployed to Cloudflare
7. No external services or databases - everything on Cloudflare infrastructure

## Deployment

- Local development: `wrangler dev`
- Production deployment: `wrangler deploy`
- Database migrations: `wrangler d1 migrations apply <db-name>`
- Requires: Cloudflare account with access to Workers, D1, and R2
