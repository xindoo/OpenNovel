# Chapter Editing Feature Design

**Date:** 2026-05-04
**Status:** Approved

## Overview

Add a chapter text editing feature to the admin dashboard, allowing admins to browse a novel's chapters, select one, edit its content in a textarea, and save changes back to R2 via the existing `PUT /api/admin/novels/:id/chapters/:chapterId` endpoint.

## Current State

- **Backend API exists**: `PUT /api/admin/novels/:id/chapters/:chapterId` accepts `{ title?, content? }`, writes content to R2, updates `content_key` in D1
- **Frontend API client exists**: `updateChapter(novelId, chapterId, data)` in `api.ts` line 200-208
- **Frontend API client exists**: `getChapter(novelId, chapterId)` returns `{ chapter, content }` in `api.ts` line 95-100
- **Missing**: No UI in AdminDashboard to browse chapters and edit content

## Approach

Add a "章节管理" (Chapter Management) tab to AdminDashboard's existing tab system. Extract the chapter editor into a separate component file to keep AdminDashboard manageable.

## Architecture

### New Files

1. **`frontend/src/pages/admin/ChapterEditor.tsx`** — Chapter editor component
   - Novel selector (dropdown, reuses novels list from parent)
   - Chapter list (fetched via `getNovel(id)` which returns `NovelWithChapters`)
   - Chapter content editor (textarea, loaded via `getChapter(novelId, chapterId)`)
   - Title editor (input field)
   - Save button (calls `updateChapter(novelId, chapterId, { title, content })`)
   - Delete button (calls `deleteChapter(novelId, chapterId)`)

### Modified Files

1. **`frontend/src/pages/AdminDashboard.tsx`** — Add 4th tab
   - Add `'chapters'` to `Tab` type union
   - Add tab button with `FileText` icon
   - Render `ChapterEditor` component when tab is active
   - Pass `novels` list and `openUpload` callback as props

### No Backend Changes

The existing API endpoints are sufficient:
- `GET /api/novels/:id` → returns `NovelWithChapters` (chapter list)
- `GET /api/novels/:id/chapters/:chapterId` → returns `{ chapter, content }`
- `PUT /api/admin/novels/:id/chapters/:chapterId` → updates title + content
- `DELETE /api/admin/novels/:id/chapters/:chapterId` → deletes chapter

## Component Design: ChapterEditor

### State

```
- selectedNovelId: number | null
- chapters: Chapter[]
- loadingChapters: boolean
- selectedChapterId: number | null
- chapterTitle: string
- chapterContent: string
- loadingContent: boolean
- saving: boolean
- saveError: string
- saveSuccess: string
```

### Flow

1. User selects a novel from dropdown
2. Chapters load via `getNovel(novelId)` → `chapters` array
3. User clicks a chapter in the list
4. Content loads via `getChapter(novelId, chapterId)` → textarea populated
5. User edits title and/or content
6. User clicks "保存" → `updateChapter(novelId, chapterId, { title, content })`
7. Success feedback, chapter list refreshed

### UI Layout

```
┌─────────────────────────────────────────────┐
│  选择小说: [dropdown ▼]                      │
├──────────┬──────────────────────────────────┤
│ 章节列表  │  编辑区                           │
│          │                                  │
│ Ch 1     │  标题: [input]                    │
│ Ch 2 ←   │                                  │
│ Ch 3     │  内容:                            │
│ Ch 4     │  ┌──────────────────────────────┐│
│          │  │                              ││
│          │  │  textarea (full height)      ││
│          │  │                              ││
│          │  └──────────────────────────────┘│
│          │                                  │
│          │  [删除]              [保存]       │
└──────────┴──────────────────────────────────┘
```

### Styling

- Follow existing AdminDashboard Tailwind patterns
- Dark mode support via `dark:` variants
- Purple accent color (consistent with admin theme)
- `framer-motion` for tab transitions
- `lucide-react` icons (FileText, Save, Trash2, Loader2, etc.)

## Edge Cases

- **Empty novel**: Show placeholder "暂无章节" with prompt to upload
- **No novel selected**: Show prompt to select a novel
- **Large content**: Textarea with scroll, no size limit (R2 handles it)
- **Save conflict**: Last-write-wins (no optimistic locking)
- **Network error**: Error banner with retry (same pattern as existing admin)
- **Unsaved changes**: No dirty check for v1 (can add later)

## Success Criteria

1. Admin can select a novel and see its chapter list
2. Admin can click a chapter and see its content in a textarea
3. Admin can edit the chapter title and content
4. Admin can save changes and see success feedback
5. Admin can delete a chapter from the editor
6. Dark mode works correctly
7. Existing admin functionality (novels, edit, upload) is unaffected
