import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteDetailPage from '@/components/NoteDetailPage'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('../../lib/api', () => ({
  getNote: (...args: unknown[]) => mockGetNote(...args),
  patchNote: (...args: unknown[]) => mockPatchNote(...args),
  getAccessToken: () => mockGetAccessToken(),
}))

import { useRouter } from 'next/navigation'

const mockPush = jest.fn()
const mockReplace = jest.fn()
const stableRouter = { push: mockPush, replace: mockReplace }

const mockGetNote = jest.fn()
const mockPatchNote = jest.fn()
const mockGetAccessToken = jest.fn()

const NOTE = {
  id: '42',
  title: 'My Test Note',
  content: 'Original content here',
  category: 'school',
  createdAt: '2026-03-19T09:00:00Z',
  updatedAt: '2026-03-19T10:00:00Z',
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  ;(useRouter as jest.Mock).mockReturnValue(stableRouter)
  mockGetAccessToken.mockReturnValue('existing-token')
  mockGetNote.mockResolvedValue(NOTE)
  mockPatchNote.mockImplementation(async (_id, patch) => ({
    ...NOTE,
    ...patch,
    updatedAt: '2026-03-19T11:00:00Z',
  }))
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})

describe('NoteDetailPage', () => {
  it('redirects to login if unauthenticated', async () => {
    mockGetAccessToken.mockReturnValue(null)
    render(<NoteDetailPage id="42" />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/')
    })
  })

  it('renders a note with null category using the default display category', async () => {
    mockGetNote.mockResolvedValue({ ...NOTE, category: null })
    render(<NoteDetailPage id="42" />)

    expect(await screen.findByPlaceholderText('Note title...')).toHaveValue('My Test Note')
    expect(screen.getByRole('button', { name: /Random Thoughts/i })).toBeInTheDocument()
  })

  it('debounces content edits into a single patch request', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<NoteDetailPage id="42" />)

    const contentInput = await screen.findByPlaceholderText('Start writing...')
    await user.clear(contentInput)
    await user.type(contentInput, 'Updated content')

    expect(mockPatchNote).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(400)
    })

    expect(mockPatchNote).toHaveBeenCalledTimes(1)
    expect(mockPatchNote).toHaveBeenLastCalledWith('42', { content: 'Updated content' })
  })

  it('merges a pending content save into an immediate category change', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<NoteDetailPage id="42" />)

    const contentInput = await screen.findByPlaceholderText('Start writing...')
    await user.clear(contentInput)
    await user.type(contentInput, 'Updated content')

    await user.click(screen.getByRole('button', { name: /School/i }))
    await user.click(screen.getByRole('button', { name: /Personal/i }))

    expect(mockPatchNote).toHaveBeenCalledTimes(1)
    expect(mockPatchNote).toHaveBeenLastCalledWith('42', {
      content: 'Updated content',
      category: 'personal',
    })

    await act(async () => {
      jest.advanceTimersByTime(400)
    })

    expect(mockPatchNote).toHaveBeenCalledTimes(1)
  })

  it('navigates back to the dashboard', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<NoteDetailPage id="42" />)
    await screen.findByPlaceholderText('Note title...')

    await user.click(screen.getByRole('button', { name: /close note/i }))

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })
})
