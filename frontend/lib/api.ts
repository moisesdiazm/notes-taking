import { type CategoryId, type Note } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  })
  if (res.status === 401) {
    clearTokens()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  return res
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNote(raw: any): Note {
  return {
    id: String(raw.id),
    title: raw.title,
    content: raw.content,
    category: raw.category,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export async function register(
  email: string,
  password: string,
): Promise<{ access: string; refresh: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    const msg = (err.email?.[0] as string | undefined) ?? (err.password?.[0] as string | undefined) ?? (err.non_field_errors?.[0] as string | undefined) ?? 'Registration failed'
    throw new Error(msg)
  }
  return res.json()
}

export async function login(
  email: string,
  password: string,
): Promise<{ access: string; refresh: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    const msg = (err.non_field_errors?.[0] as string | undefined) ?? 'Login failed'
    throw new Error(msg)
  }
  return res.json()
}

export async function getNotes(category?: string | null): Promise<Note[]> {
  const url = category ? `/api/notes/?category=${category}` : '/api/notes/'
  const res = await apiFetch(url)
  if (!res.ok) throw new Error('Failed to fetch notes')
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((n: any) => mapNote(n))
}

export async function createNote(data: {
  title: string
  content: string
  category: CategoryId
}): Promise<Note> {
  const res = await apiFetch('/api/notes/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create note')
  return mapNote(await res.json())
}

export async function getNote(id: string): Promise<Note> {
  const res = await apiFetch(`/api/notes/${id}/`)
  if (!res.ok) throw new Error('Note not found')
  return mapNote(await res.json())
}

export async function patchNote(
  id: string,
  patch: Partial<{ title: string; content: string; category: CategoryId | null }>,
): Promise<Note> {
  const res = await apiFetch(`/api/notes/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update note')
  return mapNote(await res.json())
}
