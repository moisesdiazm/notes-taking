# Testing

## Running tests

**Frontend unit tests:**
```bash
docker compose exec frontend npm test
docker compose exec frontend npm run test:coverage
```

**Frontend E2E tests (Playwright):**
```bash
docker compose exec frontend npm run test:e2e
```

**Backend:**
```bash
docker compose exec backend uv run coverage run --source='apps' manage.py test
docker compose exec backend uv run coverage report -m
```

## Frontend unit test gotchas

- **`next/navigation`** — mock with `jest.fn()` and return a stable router object (same reference) in `beforeEach`. A new object on each render causes `useEffect([router])` to re-fire.
- **`lib/api` in component tests** — use the relative path (`../../lib/api`), not the `@/` alias. `jest.mock` factories don't resolve path aliases reliably.
- **`TZ=UTC`** — set in the test script so date formatting tests are deterministic across environments.

## Frontend E2E patterns

- All tests mock the API via `page.route()` — no real backend is needed.
- `e2e/helpers.ts` provides shared auth setup and mock fixtures. Use these instead of repeating setup across specs.

## Backend test patterns

- Use `APITestCase` from DRF.
- Authenticate with `self.client.force_authenticate(user=self.user)`.
