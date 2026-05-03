# FRONTEND KNOWLEDGE BASE

**Generated:** 2026-05-03
**Scope:** frontend/src/

## OVERVIEW
React 18 SPA with Vite, Tailwind CSS, React Router 6, framer-motion animations. No server-side user state — all persistence via localStorage hooks.

## STRUCTURE
```
frontend/src/
├── main.tsx          # Entry point → App.tsx
├── App.tsx           # Router config: Layout-wrapped public pages, unwrapped admin pages
├── api.ts            # Centralized fetch wrapper, admin credentials, re-exports backend types
├── index.css         # Tailwind directives
│
├── components/       # UI components (8 files)
│   ├── ReaderContext.tsx    # Full-screen reading context provider
│   ├── ReaderOverlay.tsx    # Full-screen overlay UI, renders markdown
│   ├── Layout.tsx           # App shell (Header + Sidebar + Outlet)
│   ├── Header.tsx, Sidebar.tsx
│   ├── BookCard.tsx, NovelCard.tsx
│   └── AnimatedCharacter.tsx
│
├── pages/            # Route components (7 files + admin/)
│   ├── Home.tsx, Discover.tsx, BookDetail.tsx
│   ├── Recent.tsx, Favorites.tsx
│   └── admin/AdminLogin.tsx, AdminDashboard.tsx (609 lines — largest)
│
├── hooks/            # localStorage-backed state (3 files)
│   ├── useFavorites.ts      # STORAGE_KEY='opennovel-favorites'
│   ├── useRecentReads.ts    # STORAGE_KEY='opennovel-recent-reads', max 50
│   └── useTheme.ts          # STORAGE_KEY='opennovel-theme', data-theme attr
│
└── types/cloudflare.d.ts    # Worker type augmentation
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add new public page | `pages/` → register in `App.tsx` inside `<Route element={<Layout />}>` | |
| Add admin-only page | `pages/admin/` → register in `App.tsx` outside Layout wrapper | |
| Add shared component | `components/` | Use Tailwind classes, framer-motion for animation |
| Add API call | `api.ts` | Uses `/api` prefix, Basic Auth headers for admin |
| Add localStorage hook | `hooks/` | Pattern: STORAGE_KEY constant, load/save functions |
| Reader integration | `ReaderContext.tsx` | Context provider, `useReader()` hook |
| Theme switching | `useTheme.ts` | Respects `prefers-color-scheme`, uses `data-theme` |
| Type imports | `api.ts` line 2-8 | `from '../../src/types'` (monorepo relative path) |

## CONVENTIONS
- **Types**: Imported from `../../src/types` — not a package, monorepo relative path.
- **State hooks**: All localStorage-backed (no server-side user state).
- **Reader pattern**: Context-driven overlay, NOT a route — triggered from any page via `useReader().openReader()`.
- **Admin credentials**: In-memory only via `setAdminCredentials()`/`clearAdminCredentials()` in `api.ts`.
- **Animation**: framer-motion for transitions, lucide-react for icons, recharts for charts.
- **Tailwind**: Use utility classes, no custom CSS unless absolutely necessary.

## NOTES
- All hooks follow same pattern: `STORAGE_KEY` constant, `loadX()`/`saveX()` helpers, useState with useEffect sync.
- Reader fetches chapter content lazily via `api.ts` — content stored in R2, metadata in D1.
- `cloudflare.d.ts` augments `Window` with `__env` for dev-time environment variables.
- Vite handles HMR — no need to restart dev server for frontend changes.
