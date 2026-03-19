'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Note, CategoryId } from './types'
import { generateId } from './utils'

const SEED_NOTES: Note[] = [
  {
    id: 'seed-1',
    title: 'Bucket list',
    content: 'Travel to Japan, learn to surf, write a novel, see the northern lights...',
    category: 'random-thoughts',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    title: 'Midterm prep',
    content: 'Review chapters 4-7, practice problems from the textbook, group study Friday.',
    category: 'school',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'seed-3',
    title: 'Weekend plans',
    content: 'Call mom, grocery run, fix the leaky faucet, movie night with friends.',
    category: 'personal',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
]

interface NotesContextValue {
  notes: Note[]
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note
  updateNote: (id: string, patch: Partial<Pick<Note, 'title' | 'content' | 'category'>>) => void
  getNoteById: (id: string) => Note | undefined
}

const NotesContext = createContext<NotesContextValue | null>(null)

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES)

  const addNote = useCallback(
    (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
      const now = new Date().toISOString()
      const note: Note = { ...data, id: generateId(), createdAt: now, updatedAt: now }
      setNotes((prev) => [note, ...prev])
      return note
    },
    []
  )

  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<Note, 'title' | 'content' | 'category'>>) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
        )
      )
    },
    []
  )

  const getNoteById = useCallback(
    (id: string) => notes.find((n) => n.id === id),
    [notes]
  )

  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, getNoteById }}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('useNotes must be used within NotesProvider')
  return ctx
}
