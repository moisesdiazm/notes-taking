import {
  getAccessToken,
  setTokens,
  clearTokens,
  login,
  getNotes,
  createNote,
  getNote,
  patchNote,
} from '@/lib/api'

function mockFetch(body: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response)
}

const RAW_NOTE = {
  id: 1,
  title: 'Test Note',
  content: 'Some content',
  category: 'school',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
}

const MAPPED_NOTE = {
  id: '1',
  title: 'Test Note',
  content: 'Some content',
  category: 'school',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
}

beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
})

describe('token helpers', () => {
  it('getAccessToken returns null when nothing is stored', () => {
    expect(getAccessToken()).toBeNull()
  })

  it('setTokens stores both tokens and getAccessToken returns the access token', () => {
    setTokens('access-123', 'refresh-456')
    expect(getAccessToken()).toBe('access-123')
    expect(localStorage.getItem('refresh_token')).toBe('refresh-456')
  })

  it('clearTokens removes both tokens', () => {
    setTokens('access-123', 'refresh-456')
    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })
})

describe('login', () => {
  it('resolves with access and refresh tokens on success', async () => {
    mockFetch({ access: 'acc', refresh: 'ref' })
    const result = await login('user@example.com', 'password')
    expect(result).toEqual({ access: 'acc', refresh: 'ref' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login/'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('throws with error message from API on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ non_field_errors: ['Invalid credentials'] }),
    } as unknown as Response)

    await expect(login('bad@example.com', 'wrong')).rejects.toThrow('Invalid credentials')
  })

  it('throws generic message when no non_field_errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({}),
    } as unknown as Response)

    await expect(login('bad@example.com', 'wrong')).rejects.toThrow('Login failed')
  })
})

describe('getNotes', () => {
  beforeEach(() => setTokens('test-token', 'r'))

  it('returns mapped notes array', async () => {
    mockFetch([RAW_NOTE])
    const notes = await getNotes()
    expect(notes).toEqual([MAPPED_NOTE])
  })

  it('appends category query param when provided', async () => {
    mockFetch([])
    await getNotes('school')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('category=school'),
      expect.anything(),
    )
  })

  it('throws on non-ok response', async () => {
    mockFetch({}, false, 500)
    await expect(getNotes()).rejects.toThrow('Failed to fetch notes')
  })

  it('preserves null categories from the API', async () => {
    mockFetch([{ ...RAW_NOTE, category: null }])
    const notes = await getNotes()
    expect(notes[0].category).toBeNull()
  })
})

describe('createNote', () => {
  beforeEach(() => setTokens('test-token', 'r'))

  it('posts and returns the mapped note', async () => {
    mockFetch(RAW_NOTE)
    const note = await createNote({ title: 'Test Note', content: 'Some content', category: 'school' })
    expect(note).toEqual(MAPPED_NOTE)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes/'),
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

describe('getNote', () => {
  beforeEach(() => setTokens('test-token', 'r'))

  it('fetches and returns a single mapped note', async () => {
    mockFetch(RAW_NOTE)
    const note = await getNote('1')
    expect(note).toEqual(MAPPED_NOTE)
  })

  it('throws when note not found', async () => {
    mockFetch({}, false, 404)
    await expect(getNote('999')).rejects.toThrow('Note not found')
  })
})

describe('patchNote', () => {
  beforeEach(() => setTokens('test-token', 'r'))

  it('sends PATCH and returns updated mapped note', async () => {
    const updated = { ...RAW_NOTE, title: 'Updated' }
    mockFetch(updated)
    const note = await patchNote('1', { title: 'Updated' })
    expect(note.title).toBe('Updated')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes/1/'),
      expect.objectContaining({ method: 'PATCH' }),
    )
  })
})
