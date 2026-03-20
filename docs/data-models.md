# Data Models

## Backend (Django)

### `CustomUser` — `apps/users/models.py`

Email-based user. Replaces Django's default `User`.

| Field | Type | Notes |
|-------|------|-------|
| `email` | EmailField | unique, used as `USERNAME_FIELD` |
| `is_active` | BooleanField | default `True` |
| `is_staff` | BooleanField | default `False` |
| `date_joined` | DateTimeField | auto |

Set via `AUTH_USER_MODEL = 'users.CustomUser'` in settings.

---

### `Category` — `apps/notes/models.py`

Global, fixed. Seeded at migration time (`0003_seed_categories`). Not per-user.

| Field | Type | Notes |
|-------|------|-------|
| `id` | SlugField (PK) | e.g. `"random-thoughts"`, `"school"`, `"personal"` |
| `name` | CharField | e.g. `"Random Thoughts"` |
| `color` | CharField | hex color, e.g. `"#EF9C66"` |

Seeded values match `CATEGORIES` in `frontend/lib/types.ts` exactly.

---

### `Note` — `apps/notes/models.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | BigAutoField (PK) | auto-incremented integer |
| `title` | CharField(255) | blank allowed |
| `content` | TextField | blank allowed |
| `category` | FK → Category | `SET_NULL` on delete, nullable |
| `user` | FK → CustomUser | `CASCADE` on delete |
| `created_at` | DateTimeField | `auto_now_add` |
| `updated_at` | DateTimeField | `auto_now` |

Default ordering: `-updated_at` (most recently edited first).

---

## Frontend (TypeScript) — `lib/types.ts`

### `Note`

```ts
interface Note {
  id: string          // stringified integer from backend
  title: string
  content: string
  category: CategoryId
  createdAt: string   // ISO string (maps from backend created_at)
  updatedAt: string   // ISO string (maps from backend updated_at)
}
```

### `Category` / `CategoryId`

```ts
type CategoryId = 'random-thoughts' | 'school' | 'personal'

interface Category {
  id: CategoryId
  name: string
  color: string       // hex
}
```

---

## Field name mapping (backend ↔ frontend)

| Backend (snake_case) | Frontend (camelCase) |
|----------------------|----------------------|
| `id` (integer) | `id` (string) |
| `title` | `title` |
| `content` | `content` |
| `category` (slug string) | `category` (CategoryId string) |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |

Mapping applied in `mapNote()` in `frontend/lib/api.ts`.

---

## Adding a new field to Note

1. Add field to `apps/notes/models.py`
2. Run `python manage.py makemigrations && python manage.py migrate`
3. Add field to `NoteSerializer.Meta.fields` in `apps/notes/serializers.py`
4. Add field to `Note` interface in `frontend/lib/types.ts`
5. Update `mapNote()` in `frontend/lib/api.ts` if name mapping is needed
6. Update relevant tests in `backend/apps/notes/tests.py` and `frontend/__tests__/`
