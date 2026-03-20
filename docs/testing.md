# Testing Reference

## Frontend

**Tools:** Jest 30 + React Testing Library + Playwright

### Unit tests

```bash
cd frontend
npm test                  # run once
npm run test:coverage     # with coverage report
npm run test:watch        # watch mode
```

**Config:** `frontend/jest.config.js` (uses `next/jest` for SWC transforms + path alias resolution). `TZ=UTC` is set in the script to make date tests deterministic.

**Test files:**

| File | What it tests |
|------|--------------|
| `__tests__/lib/utils.test.ts` | `formatDate` (today/yesterday/older), `formatLastEdited`, `generateId` uniqueness |
| `__tests__/lib/types.test.ts` | `CATEGORIES` shape/count, `getCategoryById` for all 3 IDs |
| `__tests__/lib/api.test.ts` | Token helpers, `login` success + error cases, all CRUD functions with mocked `fetch` |
| `__tests__/components/LoginPage.test.tsx` | Renders, variant toggle, error on failed login, redirect on success, loading state, already-authenticated redirect |

**Coverage (as of last run):**

| File | Stmts | Branch | Funcs | Lines |
|------|-------|--------|-------|-------|
| `LoginPage.tsx` | 100% | 84% | 100% | 100% |
| `api.ts` | 88% | 78% | 100% | 93% |
| `types.ts` | 100% | 100% | 100% | 100% |
| `utils.ts` | 100% | 100% | 100% | 100% |
| **All files** | **94%** | **83%** | **100%** | **97%** |

**Mocking patterns:**

- `next/navigation`: mock with `jest.fn()` and `mockReturnValue(stableRouter)` in `beforeEach`. Use a stable object reference to prevent `useEffect([router])` from re-running on re-renders.
- `next/image`: mock as plain `<img>` via `jest.mock('next/image', ...)`
- `lib/api.ts` in component tests: use relative path `jest.mock('../../lib/api', factory)` — `jest.mock` with a factory doesn't resolve `@/` aliases reliably.
- `fetch`: assign `global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(...) })`
- `localStorage`: available natively in `jest-environment-jsdom`; call `localStorage.clear()` in `beforeEach`

### Integration tests (Playwright)

```bash
cd frontend
npm run test:e2e       # headless Chromium
npm run test:e2e:ui    # interactive UI mode
```

**Config:** `frontend/playwright.config.ts`. Spins up `next dev` automatically via `webServer`. Reuses existing server if already running.

**API mocking:** all tests use `page.route('**/api/...', ...)` to intercept fetch calls — no real backend needed.

**Auth setup helper:** `e2e/helpers.ts` exports:
- `setAuthToken(page)` — injects `access_token` into `localStorage` via `addInitScript` before page load
- `mockNotesList(page, notes?)` — intercepts GET `/api/notes/` calls
- `MOCK_NOTES` — shared fixture data

**Test files:**

| File | What it tests |
|------|--------------|
| `e2e/login.spec.ts` | Form renders, invalid credentials error, successful redirect, loading state, variant toggle |
| `e2e/dashboard.spec.ts` | Notes display, category filter, empty state, create new note + navigation, unauthenticated redirect |
| `e2e/note-detail.spec.ts` | Title/content display, category dropdown open/change/close-on-outside-click, editing, back navigation, unauthenticated redirect |

---

## Backend

**Tools:** Django's built-in test runner + `coverage`

```bash
docker compose exec backend uv run coverage run --source='apps' manage.py test
docker compose exec backend uv run coverage report -m
```

**Coverage (as of last run):**

| File | Cover |
|------|-------|
| `apps/notes/models.py` | 100% |
| `apps/notes/views.py` | 100% |
| `apps/notes/serializers.py` | 100% |
| `apps/notes/filters.py` | 100% |
| `apps/users/models.py` | 100% |
| `apps/users/views.py` | 100% |
| `apps/users/serializers.py` | 93% |
| `apps/notes/management/commands/seed.py` | 0% (management command, not unit tested) |
| **Total** | **95%** (48 tests) |

**Test files:**
- `apps/notes/tests.py` — 216 lines covering CRUD, auth, category filtering, ownership isolation
- `apps/users/tests.py` — 59 lines covering login success/failure, token refresh, user model

---

## Adding tests for a new feature

### Backend
Add test cases to `apps/<app>/tests.py`. Use `APITestCase` from DRF. Authenticate with `self.client.force_authenticate(user=self.user)`.

### Frontend unit
Add file to `__tests__/lib/` or `__tests__/components/`. Mock `next/navigation` and any API calls.

### Frontend E2E
Add spec to `e2e/`. Use `page.route()` to mock API responses. Use `setAuthToken(page)` for pages that require auth.
