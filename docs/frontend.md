# Frontend Reference

## Stack

Next.js 14 (App Router), TypeScript, Tailwind CSS. Runs on port 3000.

## File map

```
frontend/
├── app/                        # Next.js App Router routes
│   ├── layout.tsx              # Root layout: applies fonts (Inter, Inria Serif), sets <html>
│   ├── page.tsx                # Route /        → <LoginPage />
│   ├── dashboard/page.tsx      # Route /dashboard → <DashboardPage />
│   └── notes/[id]/page.tsx     # Route /notes/:id → <NoteDetailPage id={params.id} />
│
├── components/                 # All UI logic (all 'use client')
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   └── NoteDetailPage.tsx
│
└── lib/
    ├── api.ts                  # All HTTP calls to the backend
    ├── types.ts                # Note, Category, CategoryId types + CATEGORIES constant
    ├── utils.ts                # formatDate, formatLastEdited, generateId
    └── fonts.ts                # Next.js font definitions (Inter, Inria Serif)
```

Route pages in `app/` are thin server components that render a single client component. All state and logic live in `components/`.

---

## Components

### `LoginPage` — `components/LoginPage.tsx`

**State:** `email`, `password`, `error`, `loading`, `variant` ('new-friend' | 'returning')

**On mount (`useEffect`):**
- Randomly picks a UI variant (cat image vs plant image, different heading copy)
- If `getAccessToken()` is set → `router.replace('/dashboard')`

**On submit (`handleSignIn`):**
- Calls `login(email, password)` from `lib/api.ts`
- On success: `setTokens(access, refresh)` → `router.push('/dashboard')`
- On error: sets `error` state, shows message below the form

**Key elements:**
- `input[placeholder="Email"]` — email field
- `input[placeholder="Password"]` — password field
- `button[type="submit"]` — shows "Sign In" or "Signing in…" when loading
- Toggle link — switches between variant copy

---

### `DashboardPage` — `components/DashboardPage.tsx`

**State:** `notes` (Note[]), `activeCategory` (CategoryId | null), `loading`

**On mount (`useEffect`):**
- If no token → `router.replace('/')`
- Calls `getNotes()` → sets `notes` state
- On error → `router.replace('/')`

**Filtering:** client-side. `filtered = activeCategory ? notes.filter(...) : notes`

**Category sidebar:** iterates `CATEGORIES` from `lib/types.ts`. Clicking sets `activeCategory`; clicking the active category again deselects it. Count badge derived from `notes` array.

**New Note button:** calls `createNote({ title: 'Untitled', content: '', category: activeCategory ?? 'random-thoughts' })` → navigates to `/notes/{id}`

**Empty state:** shown when `filtered.length === 0` (coffee image + italic message)

**Note cards:** clicking navigates to `/notes/{note.id}`

---

### `NoteDetailPage` — `components/NoteDetailPage.tsx`

**Props:** `id: string`

**State:** `note`, `title`, `content`, `category`, `dropdownOpen`, `lastUpdated`

**On mount (`useEffect`):**
- If no token → `router.replace('/')`
- Calls `getNote(id)` → populates all state fields
- On error → `router.replace('/dashboard')`

**Auto-save:** `scheduleSave(patch)` debounces `patchNote(id, patch)` by 400ms. Called on every title/content keystroke. On success, updates `lastUpdated` from the response.

**Category change:** immediate (no debounce). Calls `patchNote(id, { title, content, category })` synchronously.

**Auto-resize textareas:** `autoResize()` sets `height: auto` then `height: scrollHeight` on both title and content textareas whenever their value changes.

**Dropdown:** clicking outside the card closes it via an `onClick` handler on the outer div.

**Back button:** `router.push('/dashboard')`

---

## lib/api.ts — API client

```ts
// Token management (localStorage)
getAccessToken(): string | null
setTokens(access, refresh): void
clearTokens(): void

// API calls
login(email, password): Promise<{ access, refresh }>
getNotes(category?: string | null): Promise<Note[]>
createNote(data): Promise<Note>
getNote(id): Promise<Note>
patchNote(id, patch): Promise<Note>
```

`apiFetch()` is the internal wrapper: attaches auth header, handles 401 by clearing tokens and redirecting to `/`.

`mapNote(raw)` converts backend snake_case to frontend camelCase and coerces `id` to string.

---

## lib/types.ts — Types and constants

```ts
type CategoryId = 'random-thoughts' | 'school' | 'personal'

const CATEGORIES: Category[]  // 3 entries matching backend seed data
function getCategoryById(id: CategoryId): Category
```

`CATEGORIES` is used directly in both `DashboardPage` and `NoteDetailPage` for rendering the sidebar and dropdown. It matches backend data exactly — no API call needed.

---

## lib/utils.ts — Utilities

```ts
formatDate(isoString): string
// Returns 'Today', 'Yesterday', or 'Month Day' (e.g. 'March 1')
// Used in note cards on the dashboard

formatLastEdited(isoString): string
// Returns full datetime: 'March 19, 2026 at 2:30 PM'
// Used in the note detail header

generateId(): string
// Random alphanumeric string — used only in the old in-memory store (lib/store.tsx, not used in production)
```

---

## Environment variables

| Variable | Where used | Default |
|----------|-----------|---------|
| `NEXT_PUBLIC_API_URL` | `lib/api.ts` — base URL for all fetch calls | `http://localhost:8000` |

---

## Adding a new page

1. Create `app/<route>/page.tsx` that renders a new component
2. Create `components/MyPage.tsx` with `'use client'` at the top
3. Guard with `if (!getAccessToken()) { router.replace('/'); return }` if auth-required
4. Add API functions to `lib/api.ts` if new endpoints are needed
5. Add Playwright test in `e2e/`
