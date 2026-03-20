# Architecture Overview

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Django 5, Django REST Framework, SimpleJWT |
| Database | PostgreSQL 16 (via Docker), SQLite fallback for local dev |
| Auth | JWT — access token (1h) + refresh token (7d), stored in `localStorage` |
| Dev environment | Docker Compose |

## Repository layout

```
notes-taking/
├── frontend/                  # Next.js app
│   ├── app/                   # Route segments (thin wrappers, logic lives in components/)
│   │   ├── page.tsx           # → renders LoginPage
│   │   ├── dashboard/page.tsx # → renders DashboardPage
│   │   └── notes/[id]/page.tsx# → renders NoteDetailPage
│   ├── components/            # All UI logic
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── NoteDetailPage.tsx
│   ├── lib/
│   │   ├── api.ts             # All fetch calls to the backend
│   │   ├── types.ts           # Shared TypeScript types + CATEGORIES constant
│   │   └── utils.ts           # formatDate, formatLastEdited, generateId
│   ├── __tests__/             # Jest unit tests
│   └── e2e/                   # Playwright integration tests
│
├── backend/
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py        # Shared settings (JWT, DRF, installed apps)
│   │   │   └── development.py # Dev overrides: DEBUG=True, CORS_ALLOW_ALL_ORIGINS
│   │   └── urls.py            # Root router: /api/auth/ + /api/
│   └── apps/
│       ├── users/             # CustomUser model (email-based auth), login view
│       └── notes/             # Category + Note models, CRUD views
│
├── docker-compose.yml         # db (postgres) + backend (8000) + frontend (3000)
└── docs/                      # Agent reference documentation (this folder)
```

## Request flow

```
Browser → Next.js frontend (3000)
            └── fetch() in lib/api.ts
                  └── Django DRF backend (8000)
                        └── PostgreSQL (5432)
```

Frontend authenticates by POSTing to `/api/auth/login/`, receives JWT tokens, stores them in `localStorage`, and sends `Authorization: Bearer <access>` on every subsequent request.

## Auth flow

1. User submits email + password → `POST /api/auth/login/`
2. Backend validates via `authenticate(username=email, password=...)` (custom `CustomUser` uses email as `USERNAME_FIELD`)
3. Returns `{ access, refresh }`
4. Frontend stores both in `localStorage` via `setTokens()` in `lib/api.ts`
5. All subsequent API calls attach `Authorization: Bearer <access>` header via `apiFetch()`
6. On 401: tokens are cleared and user is redirected to `/`
7. Access token refresh: `POST /api/auth/token/refresh/` with `{ refresh }` — not yet wired in the frontend

## Data ownership

Notes are **user-scoped**. `NoteViewSet.get_queryset()` filters by `user=request.user`, and `perform_create()` injects the user. No note is accessible by another user.

Categories are **global** (not per-user), seeded at migration time, and match the `CATEGORIES` constant in `frontend/lib/types.ts` exactly.

## Key conventions

- Backend uses `snake_case` field names; frontend uses `camelCase`. Mapping lives in `mapNote()` in `lib/api.ts`.
- `Note.category` is a FK to `Category` with `slug` as PK. The serializer uses `SlugRelatedField` so the API sends/receives the slug string directly (e.g. `"school"`), not an integer ID.
- All API views require `IsAuthenticated` by default (set globally in `REST_FRAMEWORK` settings). Only `LoginView` uses `AllowAny`.
- Frontend route pages in `app/` are thin wrappers — all logic lives in `components/`.
