# Backend & Architecture

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Django 5, Django REST Framework, SimpleJWT |
| Database | PostgreSQL 16 |
| Auth | JWT — access (1h) + refresh (7d), stored in `localStorage` |
| Dev | Docker Compose — frontend :3000, backend :8000, db :5432 |

## Auth flow

1. `POST /api/auth/login/` with `{ email, password }` → `{ access, refresh }`
2. Frontend stores both in `localStorage`
3. All subsequent requests send `Authorization: Bearer <access>`
4. On 401: tokens are cleared and user is redirected to `/login`
5. Token refresh endpoint exists (`POST /api/auth/token/refresh/`) but is not yet wired in the frontend

## Key conventions

- **Email-based auth** — `CustomUser` uses `email` as `USERNAME_FIELD`. There is no `username` field anywhere in the system.
- **snake_case ↔ camelCase** — backend fields are snake_case, frontend is camelCase. The mapping lives in `mapNote()` in `lib/api.ts`. When adding fields, both sides need updating.
- **Category slug as PK** — `Category.id` is a slug string (`"school"`, `"personal"`, `"random-thoughts"`). The API sends and receives slug strings directly — no integer ID. The frontend `CATEGORIES` constant in `lib/types.ts` matches the backend seed data exactly.
- **PATCH only, no PUT** — `NoteViewSet` disables PUT. Always use PATCH for note updates.
- **User-scoped notes** — notes are always filtered by `request.user`. A note from another user returns 404, not 403.
- **Global categories** — categories are not per-user. They are seeded by a migration and are the same for all users. Adding a category requires a new migration.
- **IsAuthenticated by default** — DRF is configured to require auth globally. Only `LoginView` uses `AllowAny`. New views inherit this unless explicitly overridden.
- **Thin route pages** — Next.js `app/` pages are server components that render a single client component. All state and logic live in `components/`.

## Environment variables

| Variable | Default | Notes |
|----------|---------|-------|
| `SECRET_KEY` | `django-insecure-change-me` | Must change in production |
| `DEBUG` | `False` | Set `True` in dev |
| `DATABASE_URL` | `postgres://notes:notes@localhost:5432/notes` | django-environ format |
| `CORS_ALLOWED_ORIGINS` | — | Required in production; dev uses `CORS_ALLOW_ALL_ORIGINS=True` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Baked into the frontend bundle at build time |

`DJANGO_SETTINGS_MODULE` is set to `config.settings.development` by Docker Compose.
