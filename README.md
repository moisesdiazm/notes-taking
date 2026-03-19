# Notes Taking App

A full-stack notes app. Next.js frontend with in-memory state (ready to wire up), Django REST Framework backend.

```
notes-taking/
├── frontend/           # Next.js 14 App Router (TypeScript + Tailwind)
├── backend/            # Django 5 + DRF + SimpleJWT
└── docker-compose.yml  # Local development
```

---

## Docker (local dev)

**Prerequisites:** Docker and Docker Compose.

```bash
# Start both services with hot-reload
docker compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:8000
```

On first run, run migrations and seed the database (wait for containers to be healthy):

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed
```

This creates `demo@example.com` / `demo1234` and sample notes.

Postgres data is stored in the `pgdata` named volume and persists across restarts. To reset it:

```bash
docker compose down -v   # removes containers and the pgdata volume
```

**Common commands:**

```bash
docker compose up            # start (no rebuild)
docker compose up --build    # rebuild images and start
docker compose down          # stop and remove containers
docker compose logs -f       # follow logs from all services
docker compose logs -f backend  # follow backend logs only
```

Both services mount the local source directory, so code changes reload automatically — no rebuild needed during development.

---

## Frontend

**Stack:** Next.js 14, TypeScript, Tailwind CSS

**Routes:**
| Path | Component |
|------|-----------|
| `/` | `LoginPage` — email/password form |
| `/dashboard` | `DashboardPage` — note grid + category sidebar |
| `/notes/[id]` | `NoteDetailPage` — autosaving note editor |

**Running:**
```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

**Current state:** All data lives in `lib/store.tsx` (React Context, in-memory). The backend section below describes exactly what to replace.

---

## Backend

**Stack:** Django 5, Django REST Framework, SimpleJWT, django-cors-headers, django-filter, SQLite (dev)

### Setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate          # creates DB + seeds 3 categories
python manage.py seed             # creates demo@example.com / demo1234 + 3 sample notes
python manage.py runserver        # http://localhost:8000
```

Copy `.env.example` to `.env` to override defaults. No `.env` file is required for local development.

---

### Authentication

JWT-based. Login returns an `access` token (1 hour) and a `refresh` token (7 days).

**Send on every authenticated request:**
```
Authorization: Bearer <access_token>
```

**Token refresh:** call `POST /api/auth/token/refresh/` with `{ "refresh": "<refresh_token>" }` before the access token expires.

---

### Endpoints

#### `POST /api/auth/login/`

No auth required.

**Request:**
```json
{ "email": "demo@example.com", "password": "demo1234" }
```

**Response `200`:**
```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>"
}
```

**Error `400`:**
```json
{ "non_field_errors": ["Invalid email or password."] }
```

---

#### `POST /api/auth/token/refresh/`

No auth required.

**Request:**
```json
{ "refresh": "<jwt_refresh_token>" }
```

**Response `200`:**
```json
{ "access": "<new_jwt_access_token>" }
```

---

#### `GET /api/categories/`

Auth required.

**Response `200`:**
```json
[
  { "id": "random-thoughts", "name": "Random Thoughts", "color": "#EF9C66" },
  { "id": "school",          "name": "School",          "color": "#FCDCA0" },
  { "id": "personal",        "name": "Personal",        "color": "#78ABA8" }
]
```

Categories are global (not per-user) and fixed — identical to the frontend `CATEGORIES` constant in `lib/types.ts`.

---

#### `GET /api/notes/`

Auth required. Returns only the authenticated user's notes, ordered by `updated_at` descending.

**Optional query param:** `?category=school` — filters by category slug.

**Response `200`:**
```json
[
  {
    "id": 1,
    "title": "Midterm prep",
    "content": "Review chapters 4-7...",
    "category": "school",
    "created_at": "2026-03-18T10:00:00Z",
    "updated_at": "2026-03-18T10:00:00Z"
  }
]
```

---

#### `POST /api/notes/`

Auth required.

**Request:**
```json
{
  "title": "My note",
  "content": "Some text",
  "category": "personal"
}
```

`title` and `content` are optional (blank is allowed). `category` is the slug string.

**Response `201`:** same shape as a single note object above.

---

#### `GET /api/notes/{id}/`

Auth required. Returns 404 if the note belongs to another user.

**Response `200`:** same shape as a single note object.

---

#### `PATCH /api/notes/{id}/`

Auth required. Partial update — send only the fields you want to change.

**Request (any subset):**
```json
{ "title": "Updated title" }
```

**Response `200`:** full note object with updated `updated_at`.

---

#### `DELETE /api/notes/{id}/`

Auth required.

**Response `204`:** no body.

---

### Field name mapping

The frontend uses camelCase; the backend uses snake_case. Map these when reading/writing:

| Frontend (`lib/types.ts`) | Backend API |
|---------------------------|-------------|
| `note.id` | `note.id` |
| `note.title` | `note.title` |
| `note.content` | `note.content` |
| `note.category` (CategoryId string) | `note.category` (same slug string) |
| `note.createdAt` | `note.created_at` |
| `note.updatedAt` | `note.updated_at` |

---

### Connecting the frontend

These are the exact locations in the frontend codebase to replace with API calls:

#### 1. Login — `components/LoginPage.tsx:27`

`handleSignIn` currently does `router.push('/dashboard')` unconditionally. Replace with:
- `POST /api/auth/login/` with `{ email, password }`
- On success: store `access` + `refresh` tokens (e.g. `localStorage`), then `router.push('/dashboard')`
- On error: show the error message from the response

#### 2. Notes list — `components/DashboardPage.tsx:11`

`const { notes, addNote } = useNotes()` pulls from in-memory state.

- On mount: `GET /api/notes/` and set local state
- Category filter: pass `?category=<id>` when `activeCategory` is set (or filter client-side)
- `countByCategory` sidebar counts: derive from the fetched notes array

#### 3. Create note — `components/DashboardPage.tsx:20`

`addNote(...)` currently creates a local note and returns it synchronously.

Replace with:
- `POST /api/notes/` with `{ title: 'Untitled', content: '', category: activeCategory ?? 'random-thoughts' }`
- On success: use the returned `id` to navigate to `/notes/<id>`

#### 4. Load single note — `components/NoteDetailPage.tsx:23`

`getNoteById(id)` reads from context.

Replace with:
- `GET /api/notes/{id}/` on mount
- Map `created_at` → `createdAt`, `updated_at` → `updatedAt`

#### 5. Autosave — `components/NoteDetailPage.tsx:48`

`scheduleSave(patch)` calls `updateNote(id, patch)` after a 400 ms debounce.

Replace `updateNote` with:
- `PATCH /api/notes/{id}/` with the patch payload
- Update `lastUpdated` state from the returned `updated_at`

#### 6. Category list — `components/DashboardPage.tsx:57` and `NoteDetailPage.tsx:124`

Both iterate `CATEGORIES` from `lib/types.ts`. This can stay as-is (categories are fixed and match the backend exactly), or be fetched once from `GET /api/categories/` and cached.

---

### Demo credentials

```
email:    demo@example.com
password: demo1234
```

Run `python manage.py seed` to create them (idempotent — safe to run multiple times).
