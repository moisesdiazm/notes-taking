import { test, expect } from '@playwright/test'
import { setAuthToken } from './helpers'

const NOTE = {
  id: 42,
  title: 'My Test Note',
  content: 'Original content here',
  category: 'school',
  created_at: '2026-03-19T09:00:00Z',
  updated_at: '2026-03-19T10:00:00Z',
}

test.describe('Note detail page', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthToken(page)

    await page.route('**/api/notes/42/**', async (route) => {
      const method = route.request().method()
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(NOTE),
        })
      } else if (method === 'PATCH') {
        const body = JSON.parse(route.request().postData() ?? '{}')
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...NOTE, ...body, updated_at: new Date().toISOString() }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/notes/42')
  })

  test('displays the note title and content', async ({ page }) => {
    await expect(page.getByPlaceholder('Note title...')).toHaveValue('My Test Note')
    await expect(page.getByPlaceholder('Start writing...')).toHaveValue('Original content here')
  })

  test('shows the current category in the dropdown button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /School/i }).first()).toBeVisible()
  })

  test('shows "Last Edited" timestamp', async ({ page }) => {
    await expect(page.getByText(/Last Edited/i)).toBeVisible()
  })

  test('edits the note title', async ({ page }) => {
    const titleInput = page.getByPlaceholder('Note title...')
    await titleInput.fill('Updated Title')
    await expect(titleInput).toHaveValue('Updated Title')
  })

  test('edits the note content', async ({ page }) => {
    const contentInput = page.getByPlaceholder('Start writing...')
    await contentInput.fill('Updated content')
    await expect(contentInput).toHaveValue('Updated content')
  })

  test('opens category dropdown when clicking the category button', async ({ page }) => {
    await page.getByRole('button', { name: /School/i }).first().click()

    await expect(page.getByRole('button', { name: /Random Thoughts/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Personal/i })).toBeVisible()
  })

  test('changes category via dropdown', async ({ page }) => {
    await page.getByRole('button', { name: /School/i }).first().click()
    await page.getByRole('button', { name: /Personal/i }).click()

    // Dropdown closes and selected category is shown
    await expect(page.getByRole('button', { name: /Random Thoughts/i })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /Personal/i }).first()).toBeVisible()
  })

  test('closes dropdown when clicking outside', async ({ page }) => {
    await page.getByRole('button', { name: /School/i }).first().click()
    await expect(page.getByRole('button', { name: /Random Thoughts/i })).toBeVisible()

    // Click on the note card area (outside dropdown)
    await page.mouse.click(600, 400)
    await expect(page.getByRole('button', { name: /Random Thoughts/i })).not.toBeVisible()
  })

  test('navigates back to dashboard when clicking Back', async ({ page }) => {
    await page.route('**/api/notes/', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([NOTE]),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/notes/42')

    const backButton = page.getByRole('button', { name: /Back/i })
    await expect(backButton).toBeVisible()
    await backButton.evaluate((button: HTMLButtonElement) => button.click())
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('redirects to login when no access token', async ({ page }) => {
    const freshPage = await page.context().newPage()
    await freshPage.goto('/notes/42')
    await freshPage.waitForURL('/')
    await expect(freshPage).toHaveURL('/')
    await freshPage.close()
  })
})
