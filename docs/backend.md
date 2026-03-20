# Backend Reference

## Stack

Django 5, Django REST Framework, SimpleJWT, django-filters, django-cors-headers, django-environ, PostgreSQL. Runs on port 8000.

## File map

```
backend/
├── config/
│   ├── settings/
│   │   ├── base.py            # All shared settings
│   │   └── development.py     # DEBUG=True, CORS_ALLOW_ALL_ORIGINS=True, reads DATABASE_URL
│   ├── urls.py                # Root URL router
│   └── wsgi.py / asgi.py
│
└── apps/
    ├── users/
    │   ├── models.py          # CustomUser (email-based, no username)
    │   ├── serializers.py     # LoginSerializer — validates credentials, returns JWT pair
    │   ├── views.py           # LoginView (AllowAny)
    │   └── urls.py            # /login/, /token/refresh/
    │
    └── notes/
        ├── models.py          # Category (slug PK), Note (FK to Category + User)
        ├── serializers.py     # CategorySerializer, NoteSerializer (SlugRelatedField for category)
        ├── filters.py         # NoteFilter — ?category=<slug>
        ├── views.py           # CategoryListView, NoteViewSet
        ├── urls.py            # /categories/, /notes/, /notes/{id}/
        ├── admin.py           # Category + Note registered in Django admin
        └── management/commands/seed.py  # Creates demo user + sample notes
```

---

## Settings — `config/settings/base.py`

**`AUTH_USER_MODEL = 'users.CustomUser'`** — all of Django's auth uses this model.

**`REST_FRAMEWORK` defaults:**
- Authentication: `JWTAuthentication` only
- Permission: `IsAuthenticated` for all views by default
- Filter backend: `DjangoFilterBackend`

**`SIMPLE_JWT`:** access token lifetime = 1 hour, refresh = 7 days.

**`INSTALLED_APPS`** local apps: `apps.users`, `apps.notes` (in that order — users must come first due to AUTH_USER_MODEL dependency).

---

## apps/users

### `CustomUser` model

Uses `email` as `USERNAME_FIELD`. No `username` field. `REQUIRED_FIELDS = []`.

### `LoginSerializer`

Calls `authenticate(username=email, password=...)`. Django's `authenticate()` uses `USERNAME_FIELD`, so passing email as `username` is correct here. On success, issues a `RefreshToken` and returns `{ access, refresh }` as strings.

### `LoginView`

`AllowAny`. Delegates entirely to `LoginSerializer`. Any validation error is raised with 400.

### URLs

| Method | Path | View |
|--------|------|------|
| POST | `/api/auth/login/` | `LoginView` |
| POST | `/api/auth/token/refresh/` | `TokenRefreshView` (SimpleJWT built-in) |

---

## apps/notes

### `Category` model

Slug as primary key (e.g. `"random-thoughts"`). Seeded by migration `0003_seed_categories`. Modifying categories requires a new migration.

### `Note` model

- `category` FK uses `on_delete=SET_NULL` — deleting a category nullifies the note's category, not the note itself.
- `user` FK uses `on_delete=CASCADE` — deleting a user deletes all their notes.
- Default ordering: `['-updated_at']`

### `NoteSerializer`

`category` uses `SlugRelatedField(slug_field='id')` — reads/writes the slug string directly. Frontend sends `"school"`, backend stores it as FK to `Category(id='school')`.

`read_only_fields = ['id', 'created_at', 'updated_at']` — these cannot be set by the client.

### `NoteFilter`

Filters `?category=<slug>` via `category__id` exact match. Used by `NoteViewSet`.

### `NoteViewSet`

- `get_queryset()` always filters by `user=request.user` — enforces data isolation.
- `perform_create()` injects `user=request.user` before save.
- `http_method_names` excludes PUT (only PATCH for partial updates).

### `CategoryListView`

Read-only `ListAPIView`. Returns all categories (no user filter — categories are global).

### URLs

| Method | Path | View |
|--------|------|------|
| GET | `/api/categories/` | `CategoryListView` |
| GET | `/api/notes/` | `NoteViewSet.list` |
| POST | `/api/notes/` | `NoteViewSet.create` |
| GET | `/api/notes/{id}/` | `NoteViewSet.retrieve` |
| PATCH | `/api/notes/{id}/` | `NoteViewSet.partial_update` |
| DELETE | `/api/notes/{id}/` | `NoteViewSet.destroy` |

---

## Adding a new app

1. `python manage.py startapp <name>` inside `apps/`
2. Add `'apps.<name>'` to `INSTALLED_APPS` in `base.py`
3. Create models, serializers, views, urls
4. Wire urls into `config/urls.py`
5. Run `makemigrations` + `migrate`
6. Add tests to `apps/<name>/tests.py`

## Adding a new endpoint to an existing app

1. Add view to `apps/<app>/views.py`
2. Register route in `apps/<app>/urls.py`
3. If a new serializer field: update `apps/<app>/serializers.py`
4. If a new model field: add to model, run `makemigrations`
5. Update `frontend/lib/api.ts` with the new fetch function
6. Update `frontend/lib/types.ts` if the TypeScript type changes
7. Add tests

## Environment variables

| Variable | Default | Notes |
|----------|---------|-------|
| `SECRET_KEY` | `django-insecure-change-me` | Must be changed in production |
| `DEBUG` | `False` | Set `True` in dev |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated list |
| `DATABASE_URL` | `postgres://notes:notes@localhost:5432/notes` | django-environ format |
| `CORS_ALLOWED_ORIGINS` | — | Set in production; dev uses `CORS_ALLOW_ALL_ORIGINS=True` |

`DJANGO_SETTINGS_MODULE` is set to `config.settings.development` by Docker Compose.
