'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useNotes } from '@/lib/store'
import { CATEGORIES, CategoryId, getCategoryById } from '@/lib/types'
import { formatLastEdited } from '@/lib/utils'

interface Props {
  id: string
}

export default function NoteDetailPage({ id }: Props) {
  const router = useRouter()
  const { getNoteById, updateNote } = useNotes()
  const note = getNoteById(id)

  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [category, setCategory] = useState<CategoryId>(note?.category ?? 'random-thoughts')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(note?.updatedAt ?? new Date().toISOString())

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!note) {
      router.replace('/dashboard')
    }
  }, [note, router])

  function scheduleSave(patch: Partial<{ title: string; content: string; category: CategoryId }>) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      updateNote(id, patch)
      setLastUpdated(new Date().toISOString())
    }, 400)
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    scheduleSave({ title: val, content, category })
  }

  function handleContentChange(val: string) {
    setContent(val)
    scheduleSave({ title, content: val, category })
  }

  function handleCategoryChange(cat: CategoryId) {
    setCategory(cat)
    setDropdownOpen(false)
    updateNote(id, { title, content, category: cat })
    setLastUpdated(new Date().toISOString())
  }

  if (!note) return null

  const activeCat = getCategoryById(category)

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: '#F9F1E3' }}
      onClick={() => dropdownOpen && setDropdownOpen(false)}
    >
      {/* Top bar */}
      <div
        className="h-[35px] flex items-center px-6 border-b"
        style={{ borderColor: 'rgba(0,0,0,0.1)' }}
      >
        {/* Back button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
          style={{ color: '#886428', fontFamily: 'var(--font-inter), sans-serif' }}
        >
          <span className="text-lg leading-none">←</span>
          <span>Back</span>
        </button>

        <div className="flex-1" />

        {/* Last edited */}
        <span
          className="text-xs"
          style={{ color: '#886428', fontFamily: 'var(--font-inter), sans-serif' }}
        >
          Last edited: {formatLastEdited(lastUpdated)}
        </span>
      </div>

      {/* Note area */}
      <div className="max-w-3xl mx-auto px-8 pt-10 pb-16 flex flex-col gap-6 relative">
        {/* Category dropdown */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors hover:bg-black/5"
            style={{
              borderColor: '#9747FF',
              fontFamily: 'var(--font-inter), sans-serif',
              color: '#3a2a0a',
            }}
          >
            <span
              className="w-[11px] h-[11px] rounded-full flex-shrink-0"
              style={{ backgroundColor: activeCat.color }}
            />
            <span>{activeCat.name}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            >
              <path
                d="M2 4L6 8L10 4"
                stroke="#9747FF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {dropdownOpen && (
            <div
              className="absolute top-full mt-1 left-0 rounded-md border shadow-md z-10 overflow-hidden"
              style={{ borderColor: '#9747FF', backgroundColor: '#F9F1E3', minWidth: 180 }}
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-black/5"
                  style={{
                    fontFamily: 'var(--font-inter), sans-serif',
                    color: '#3a2a0a',
                    fontWeight: cat.id === category ? 600 : 400,
                  }}
                >
                  <span
                    className="w-[11px] h-[11px] rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <textarea
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title..."
          rows={2}
          className="w-full bg-transparent border-none outline-none resize-none leading-tight"
          style={{
            fontFamily: 'var(--font-inria-serif), serif',
            fontWeight: 700,
            fontSize: 32,
            color: '#000',
          }}
        />

        {/* Divider */}
        <div className="h-px" style={{ backgroundColor: 'rgba(0,0,0,0.12)' }} />

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing..."
          className="w-full bg-transparent border-none outline-none resize-none min-h-[400px]"
          style={{
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: 14,
            color: '#000',
            lineHeight: 1.6,
          }}
        />
      </div>
    </div>
  )
}
