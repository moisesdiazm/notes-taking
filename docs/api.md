# API Reference

Base URL: `http://localhost:8000` (configured via `NEXT_PUBLIC_API_URL` env var in frontend)

All endpoints except login and token refresh require:
```
Authorization: Bearer <access_token>
```

On 401, the frontend (`lib/api.ts:apiFetch`) clears tokens and redirects to `/`.

---

## Auth

### `POST /api/auth/login/`

No auth required. Handled by `LoginView` + `LoginSerializer` in `apps/users/`.

**Request:**
```json
{ "email": "user@example.com", "password": "secret" }
```

**Response 200:**
```json
{ "access": "<jwt>", "refresh": "<jwt>" }
```

**Response 400:**
```json
{ "non_field_errors": ["Invalid email or password."] }
```

---

### `POST /api/auth/token/refresh/`

No auth required. Handled by SimpleJWT's built-in `TokenRefreshView`.

**Request:**
```json
{ "refresh": "<jwt>" }
```

**Response 200:**
```json
{ "access": "<new_jwt>" }
```

---

## Categories

### `GET /api/categories/`

Auth required. Returns all categories (global, not per-user).

**Response 200:**
```json
[
  { "id": "random-thoughts", "name": "Random Thoughts", "color": "#EF9C66" },
  { "id": "school",          "name": "School",          "color": "#FCDCA0" },
  { "id": "personal",        "name": "Personal",        "color": "#78ABA8" }
]
```

Handled by `CategoryListView` (read-only `ListAPIView`).

---

## Notes

All note endpoints are scoped to the authenticated user. Handled by `NoteViewSet` (ModelViewSet). Allowed methods: `GET`, `POST`, `PATCH`, `DELETE` (PUT is disabled).

### `GET /api/notes/`

Returns user's notes, ordered by `updated_at` desc.

**Optional query param:** `?category=<slug>` — filters by category (e.g. `?category=school`)

**Response 200:**
```json
[
  {
    "id": 1,
    "title": "Midterm prep",
    "content": "Review chapters 4-7",
    "category": "school",
    "created_at": "2026-03-18T10:00:00Z",
    "updated_at": "2026-03-18T10:00:00Z"
  }
]
```

---

### `POST /api/notes/`

Creates a note for the authenticated user.

**Request:**
```json
{
  "title": "My note",
  "content": "Some text",
  "category": "personal"
}
```

`title` and `content` are optional (blank allowed). `category` is the slug string.

**Response 201:** full note object (same shape as above).

---

### `GET /api/notes/{id}/`

Returns a single note. Returns 404 if note belongs to another user.

**Response 200:** single note object.

---

### `PATCH /api/notes/{id}/`

Partial update. Send only the fields to change.

**Request (any subset):**
```json
{ "title": "Updated title", "category": "personal" }
```

**Response 200:** full updated note object with new `updated_at`.

---

### `DELETE /api/notes/{id}/`

**Response 204:** no body.

---

## Routing (backend)

```
config/urls.py
├── /admin/                          → Django admin
├── /api/auth/login/                 → LoginView
├── /api/auth/token/refresh/         → TokenRefreshView
├── /api/categories/                 → CategoryListView
├── /api/notes/                      → NoteViewSet (list + create)
└── /api/notes/{id}/                 → NoteViewSet (retrieve, patch, destroy)
```

## Frontend API client — `lib/api.ts`

All fetch calls go through `apiFetch()` which:
- Reads the access token from `localStorage` via `getAccessToken()`
- Attaches `Authorization: Bearer` header
- On 401: calls `clearTokens()` + redirects to `/`

Public functions: `login`, `getNotes`, `createNote`, `getNote`, `patchNote`
Token helpers: `getAccessToken`, `setTokens`, `clearTokens`
