import { test, expect, type Page } from '@playwright/test'
import { setAuthToken, mockNotesList, MOCK_NOTES } from './helpers'

test.describe('Dashboard', () => {
  const sidebar = (page: Page) => page.locator('aside')
  const notesGrid = (page: Page) => page.locator('main')

  test.beforeEach(async ({ page }) => {
    await setAuthToken(page)
    await mockNotesList(page)
    await page.goto('/dashboard')
  })

  test('displays all notes by default', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Bucket list/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Midterm prep/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Weekend plans/i })).toBeVisible()
  })

  test('shows category sidebar with note counts', async ({ page }) => {
    await expect(sidebar(page).getByRole('button', { name: /All Categories/i })).toBeVisible()
    await expect(sidebar(page).getByRole('button', { name: /Random Thoughts/i })).toBeVisible()
    await expect(sidebar(page).getByRole('button', { name: /School/i })).toBeVisible()
    await expect(sidebar(page).getByRole('button', { name: /Personal/i })).toBeVisible()
  })

  test('filters notes by category when clicking a category', async ({ page }) => {
    await sidebar(page).getByRole('button', { name: /School/i }).click()

    await expect(notesGrid(page).getByRole('button', { name: /Midterm prep/i })).toBeVisible()
    await expect(notesGrid(page).getByRole('button', { name: /Bucket list/i })).not.toBeVisible()
    await expect(notesGrid(page).getByRole('button', { name: /Weekend plans/i })).not.toBeVisible()
  })

  test('shows all notes again when clicking "All Categories"', async ({ page }) => {
    await sidebar(page).getByRole('button', { name: /School/i }).click()
    await sidebar(page).getByRole('button', { name: /All Categories/i }).click()

    await expect(notesGrid(page).getByRole('button', { name: /Bucket list/i })).toBeVisible()
    await expect(notesGrid(page).getByRole('button', { name: /Midterm prep/i })).toBeVisible()
  })

  test('shows empty state when no notes match the selected category', async ({ page }) => {
    // Override mock with no personal notes
    await page.route('**/api/notes/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.goto('/dashboard')
    await expect(page.getByText(/waiting for your charming notes/i)).toBeVisible()
  })

  test('creates a new note and navigates to its detail page', async ({ page }) => {
    const newNote = {
      id: 99,
      title: 'Untitled',
      content: '',
      category: 'random-thoughts',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await page.route('**/api/notes/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newNote),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_NOTES),
        })
      }
    })

    await page.route('**/api/notes/99/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(newNote),
      })
    })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: /New Note/i }).click()
    await page.waitForURL(/\/notes\/99/)
    await expect(page).toHaveURL(/\/notes\/99/)
  })

  test('redirects to login when no access token', async ({ page }) => {
    const freshPage = await page.context().newPage()
    await freshPage.goto('/dashboard')
    await freshPage.waitForURL('/')
    await expect(freshPage).toHaveURL('/')
    await freshPage.close()
  })
})
