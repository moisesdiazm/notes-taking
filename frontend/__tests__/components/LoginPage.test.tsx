import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/components/LoginPage'

// Must be jest.fn() so we can call mockReturnValue in beforeEach with a stable object ref,
// preventing the useEffect([router]) from re-firing on every re-render.
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={alt} {...props} />
  ),
}))

jest.mock('../../lib/api', () => ({
  login: (...args: unknown[]) => mockLogin(...args),
  setTokens: (...args: unknown[]) => mockSetTokens(...args),
  getAccessToken: () => mockGetAccessToken(),
}))

import { useRouter } from 'next/navigation'

const mockPush = jest.fn()
const mockReplace = jest.fn()
// Stable object so useEffect([router]) doesn't re-run on each re-render
const stableRouter = { push: mockPush, replace: mockReplace }

const mockLogin = jest.fn()
const mockSetTokens = jest.fn()
const mockGetAccessToken = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue(stableRouter)
  mockGetAccessToken.mockReturnValue(null)
})

describe('LoginPage (signin mode)', () => {
  it('renders the email and password inputs and sign in button', () => {
    render(<LoginPage mode="signin" />)
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows "Yay, You\'re Back!" heading', () => {
    render(<LoginPage mode="signin" />)
    expect(screen.getByText(/Yay, You're Back!/i)).toBeInTheDocument()
  })

  it('navigates to /signup when clicking the toggle link', async () => {
    render(<LoginPage mode="signin" />)
    await userEvent.click(screen.getByText(/I've never been here before/i))
    expect(mockPush).toHaveBeenCalledWith('/signup')
  })

  it('shows an error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))
    render(<LoginPage mode="signin" />)

    await userEvent.type(screen.getByPlaceholderText('Email'), 'bad@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('redirects to /dashboard after successful login', async () => {
    mockLogin.mockResolvedValue({ access: 'acc', refresh: 'ref' })
    render(<LoginPage mode="signin" />)

    await userEvent.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
    expect(mockSetTokens).toHaveBeenCalledWith('acc', 'ref')
  })

  it('shows "Signing in…" text and disables button while request is in flight', async () => {
    let resolveLogin!: (v: unknown) => void
    mockLogin.mockReturnValue(new Promise((r) => { resolveLogin = r }))
    render(<LoginPage mode="signin" />)

    await userEvent.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    const btn = screen.getByRole('button', { name: /signing in/i })
    expect(btn).toBeDisabled()

    // Resolve to avoid act() warnings from pending state updates
    await waitFor(() => resolveLogin({ access: 'a', refresh: 'r' }))
  })

  it('redirects to /dashboard if already authenticated', async () => {
    mockGetAccessToken.mockReturnValue('existing-token')
    render(<LoginPage mode="signin" />)
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard')
    })
  })
})

describe('LoginPage (signup mode)', () => {
  it('renders the email and password inputs and sign up button', () => {
    render(<LoginPage mode="signup" />)
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('shows "Yay, New Friend!" heading', () => {
    render(<LoginPage mode="signup" />)
    expect(screen.getByText(/Yay, New Friend!/i)).toBeInTheDocument()
  })

  it('navigates to /login when clicking the toggle link', async () => {
    render(<LoginPage mode="signup" />)
    await userEvent.click(screen.getByText(/We're already friends!/i))
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('shows "Signing up…" text and disables button while request is in flight', async () => {
    let resolveLogin!: (v: unknown) => void
    mockLogin.mockReturnValue(new Promise((r) => { resolveLogin = r }))
    render(<LoginPage mode="signup" />)

    await userEvent.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password')
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }))

    const btn = screen.getByRole('button', { name: /signing up/i })
    expect(btn).toBeDisabled()

    await waitFor(() => resolveLogin({ access: 'a', refresh: 'r' }))
  })
})
