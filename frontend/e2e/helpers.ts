import { Page } from '@playwright/test'

export const MOCK_NOTES = [
  {
    id: 1,
    title: 'Bucket list',
    content: 'Travel to Japan, learn to surf...',
    category: 'random-thoughts',
    created_at: '2026-03-19T09:00:00Z',
    updated_at: '2026-03-19T09:00:00Z',
  },
  {
    id: 2,
    title: 'Midterm prep',
    content: 'Review chapters 4-7',
    category: 'school',
    created_at: '2026-03-18T09:00:00Z',
    updated_at: '2026-03-18T09:00:00Z',
  },
  {
    id: 3,
    title: 'Weekend plans',
    content: 'Call mom, grocery run',
    category: 'personal',
    created_at: '2026-03-17T09:00:00Z',
    updated_at: '2026-03-17T09:00:00Z',
  },
]

/** Injects a valid access token into localStorage before page scripts run. */
export async function setAuthToken(page: Page, token = 'test-access-token') {
  await page.addInitScript((t) => {
    localStorage.setItem('access_token', t)
  }, token)
}

/** Mocks the notes list API endpoint. */
export async function mockNotesList(page: Page, notes = MOCK_NOTES) {
  await page.route('**/api/notes/**', async (route) => {
    if (route.request().method() === 'GET' && !route.request().url().match(/\/api\/notes\/\d+\//)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(notes),
      })
    } else {
      await route.continue()
    }
  })
}
