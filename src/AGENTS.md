# BACKEND KNOWLEDGE BASE

## OVERVIEW
Hono backend on Cloudflare Workers with D1 (SQLite) and R2 (object storage).

## STRUCTURE
```
src/
├── index.ts          # App entry: CORS → routes
├── types.ts          # Worker bindings, domain models, API response format
├── auth.ts           # Basic Auth middleware (timing-safe)
└── routes/
    ├── public.ts     # GET-only endpoints (no auth)
    └── admin.ts      # CRUD endpoints (Basic Auth required)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add public API endpoint | `routes/public.ts` | GET-only, returns `ApiResponse<T>` |
| Add admin API endpoint | `routes/admin.ts` | Behind Basic Auth middleware |
| Change domain types | `types.ts` | `Novel`, `Chapter`, `ApiResponse<T>` |
| Modify auth logic | `auth.ts` | Constant-time Basic Auth comparison |
| Change CORS settings | `index.ts` | Global CORS configuration |
| Add new middleware | `index.ts` | Apply before route mounting |

## CONVENTIONS
- **Response format**: All routes return `ApiResponse<T>` envelope (`{success, data?, error?}`)
- **Timestamp handling**: Convert D1 datetime strings to Unix seconds (`Date.getTime()/1000`)
- **Error handling**: No validation library — manual checks (`isNaN`, `undefined` checks)
- **Database access**: Raw SQL via `c.env.DB.prepare().bind().run()` — no ORM
- **Admin auth**: `basicAuth` middleware applied to all admin routes (`adminRouter.use('/*', basicAuth)`)
- **MIME inference**: `/storage/:key` endpoint guesses content type from file extension

## ANTI-PATTERNS
- Do NOT add validation library — manual checks are intentional
- Do NOT add ORM — raw SQL via D1's prepared statements
- Do NOT change timestamp format — Unix seconds at API boundary
- Do NOT remove CORS from public.ts — redundant but intentional
- Do NOT store chapter content in D1 — R2 only, metadata in D1
