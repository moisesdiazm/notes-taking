import { test, expect } from '@playwright/test'
import { MOCK_NOTES } from './helpers'

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the login form with email, password, and sign-in button', async ({ page }) => {
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows an error message when credentials are invalid', async ({ page }) => {
    await page.route('**/api/auth/login/**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ non_field_errors: ['Unable to log in with provided credentials.'] }),
      })
    })

    await page.getByPlaceholder('Email').fill('bad@example.com')
    await page.getByPlaceholder('Password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText(/Unable to log in/i)).toBeVisible()
  })

  test('redirects to /dashboard on successful login', async ({ page }) => {
    await page.route('**/api/auth/login/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: 'test-access', refresh: 'test-refresh' }),
      })
    })

    await page.route('**/api/notes/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NOTES),
      })
    })

    await page.getByPlaceholder('Email').fill('user@example.com')
    await page.getByPlaceholder('Password').fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('shows "Signing in…" and disables button while request is in flight', async ({ page }) => {
    let resolveLogin: () => void
    await page.route('**/api/auth/login/**', async (route) => {
      await new Promise<void>((res) => { resolveLogin = res })
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: 'a', refresh: 'r' }),
      })
    })

    await page.getByPlaceholder('Email').fill('user@example.com')
    await page.getByPlaceholder('Password').fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()

    const btn = page.getByRole('button', { name: /signing in/i })
    await expect(btn).toBeVisible()
    await expect(btn).toBeDisabled()

    resolveLogin!()
  })

  test('toggles heading between new-friend and returning variants', async ({ page }) => {
    // One of the two headings must appear
    const newFriendHeading = page.getByText('Yay, New Friend!')
    const returningHeading = page.getByText("Yay, You're Back!")
    const isNewFriend = await newFriendHeading.isVisible()

    if (isNewFriend) {
      await page.getByText("We're already friends!").click()
      await expect(returningHeading).toBeVisible()
    } else {
      await page.getByText("Oops! I've never been here before").click()
      await expect(newFriendHeading).toBeVisible()
    }
  })
})
