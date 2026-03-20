import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardPage from '@/components/DashboardPage'

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
  getNotes: (...args: unknown[]) => mockGetNotes(...args),
  createNote: (...args: unknown[]) => mockCreateNote(...args),
  getAccessToken: () => mockGetAccessToken(),
}))

import { useRouter } from 'next/navigation'

const mockPush = jest.fn()
const mockReplace = jest.fn()
const stableRouter = { push: mockPush, replace: mockReplace }

const mockGetNotes = jest.fn()
const mockCreateNote = jest.fn()
const mockGetAccessToken = jest.fn()

const NOTES = [
  {
    id: '1',
    title: 'Bucket list',
    content: 'Travel to Japan',
    category: 'random-thoughts',
    createdAt: '2026-03-19T09:00:00Z',
    updatedAt: '2026-03-19T09:00:00Z',
  },
  {
    id: '2',
    title: 'Midterm prep',
    content: 'Review chapters 4-7',
    category: 'school',
    createdAt: '2026-03-18T09:00:00Z',
    updatedAt: '2026-03-18T09:00:00Z',
  },
  {
    id: '3',
    title: 'Loose thought',
    content: 'No category from API',
    category: null,
    createdAt: '2026-03-17T09:00:00Z',
    updatedAt: '2026-03-17T09:00:00Z',
  },
]

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue(stableRouter)
  mockGetAccessToken.mockReturnValue('existing-token')
  mockGetNotes.mockResolvedValue(NOTES)
})

describe('DashboardPage', () => {
  it('redirects to login if unauthenticated', async () => {
    mockGetAccessToken.mockReturnValue(null)
    render(<DashboardPage />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/')
    })
  })

  it('renders notes including a note with null category using the default display category', async () => {
    render(<DashboardPage />)

    expect(await screen.findByRole('button', { name: /Bucket list/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Loose thought/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Random Thoughts/i).length).toBeGreaterThan(0)
  })

  it('filters notes by category from the sidebar', async () => {
    render(<DashboardPage />)
    await screen.findByRole('button', { name: /Midterm prep/i })
    const sidebar = document.querySelector('aside')
    const main = document.querySelector('main')

    expect(sidebar).not.toBeNull()
    expect(main).not.toBeNull()

    await userEvent.click(within(sidebar as HTMLElement).getByRole('button', { name: /School/i }))

    expect(within(main as HTMLElement).getByRole('button', { name: /Midterm prep/i })).toBeInTheDocument()
    expect(within(main as HTMLElement).queryByRole('button', { name: /Bucket list/i })).not.toBeInTheDocument()
  })

  it('creates a new note in the active category and navigates to it', async () => {
    mockCreateNote.mockResolvedValue({ id: '99' })
    render(<DashboardPage />)
    await screen.findByRole('button', { name: /Midterm prep/i })
    const sidebar = document.querySelector('aside')

    expect(sidebar).not.toBeNull()

    await userEvent.click(within(sidebar as HTMLElement).getByRole('button', { name: /School/i }))
    await userEvent.click(screen.getByRole('button', { name: /New Note/i }))

    expect(mockCreateNote).toHaveBeenCalledWith({
      title: 'Untitled',
      content: '',
      category: 'school',
    })
    expect(mockPush).toHaveBeenCalledWith('/notes/99')
  })

  it('shows the empty state when the notes list is empty', async () => {
    mockGetNotes.mockResolvedValue([])
    render(<DashboardPage />)

    expect(await screen.findByText(/waiting for your charming notes/i)).toBeInTheDocument()
  })
})
