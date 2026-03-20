# Frontend Reference

## Routes

| Path | Page |
|------|------|
| `/` | Redirects to `/login` |
| `/login` | Sign-in form |
| `/signup` | Sign-up form |
| `/dashboard` | Note grid + category sidebar |
| `/notes/[id]` | Autosaving note editor |

## Key patterns

**Auth guard** — authenticated pages check `getAccessToken()` on mount and redirect to `/login` if missing.

**API client** (`lib/api.ts`) — all fetch calls go through a shared wrapper that attaches the auth header. On 401 it clears tokens and redirects to `/login`. When adding new API calls, always go through this wrapper.

**`LoginPage` modes** — the signin and signup pages share one component with a `mode` prop. The toggle between them navigates via `router.push()`, not local state.

**Category filtering** — the dashboard fetches all notes once and filters client-side by category. The backend supports `?category=<slug>` filtering but the frontend does not use it.

**Autosave** — the note editor debounces text changes (title, content) and sends PATCH only after the user stops typing. Category changes skip the debounce and are sent immediately. `updated_at` is always refreshed from the server response, never estimated client-side.
