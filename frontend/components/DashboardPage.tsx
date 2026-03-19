'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNotes } from '@/lib/store'
import { CATEGORIES, CategoryId, getCategoryById } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const { notes, addNote } = useNotes()
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null)

  const filtered = activeCategory
    ? notes.filter((n) => n.category === activeCategory)
    : notes

  const countByCategory = (id: CategoryId) => notes.filter((n) => n.category === id).length

  function handleNewNote() {
    const note = addNote({
      title: 'Untitled',
      content: '',
      category: activeCategory ?? 'random-thoughts',
    })
    router.push(`/notes/${note.id}`)
  }

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ backgroundColor: '#F9F1E3' }}
    >
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col pt-[101px]">
        {/* All Categories */}
        <button
          onClick={() => setActiveCategory(null)}
          className="flex items-center h-8 px-4 text-sm text-left w-full transition-colors hover:bg-black/5"
          style={{
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: activeCategory === null ? 600 : 400,
            color: '#3a2a0a',
            backgroundColor: activeCategory === null ? 'rgba(0,0,0,0.06)' : 'transparent',
          }}
        >
          All Categories
        </button>

        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
            className="flex items-center h-8 px-4 gap-2 text-sm text-left w-full transition-colors hover:bg-black/5"
            style={{
              fontFamily: 'var(--font-inter), sans-serif',
              fontWeight: activeCategory === cat.id ? 600 : 400,
              color: '#3a2a0a',
              backgroundColor:
                activeCategory === cat.id ? 'rgba(0,0,0,0.06)' : 'transparent',
            }}
          >
            <span
              className="w-[11px] h-[11px] rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span className="flex-1">{cat.name}</span>
            <span className="text-xs opacity-60">{countByCategory(cat.id)}</span>
          </button>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col pt-[39px] pr-8 pb-8">
        {/* Top bar */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleNewNote}
            className="flex items-center gap-1.5 h-[43px] px-4 rounded-full border text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              borderColor: '#956E39',
              color: '#956E39',
              fontFamily: 'var(--font-inter), sans-serif',
              backgroundColor: 'transparent',
            }}
          >
            <span className="text-lg leading-none">+</span>
            New Note
          </button>
        </div>

        {/* Notes grid or empty state */}
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            className="flex flex-wrap gap-[13px]"
            style={{ alignContent: 'flex-start' }}
          >
            {filtered.map((note) => {
              const cat = getCategoryById(note.category)
              return (
                <button
                  key={note.id}
                  onClick={() => router.push(`/notes/${note.id}`)}
                  className="text-left"
                  style={{
                    width: 303,
                    height: 246,
                    borderRadius: 11,
                    padding: 16,
                    backgroundColor: cat.color + '80',
                    border: `3px solid ${cat.color}`,
                    boxShadow: '1px 1px 2px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    flexShrink: 0,
                  }}
                >
                  {/* Meta row */}
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs"
                      style={{ fontFamily: 'var(--font-inter), sans-serif', color: '#3a2a0a' }}
                    >
                      {formatDate(note.updatedAt)}
                    </span>
                    <span
                      className="text-xs opacity-60"
                      style={{ fontFamily: 'var(--font-inter), sans-serif', color: '#3a2a0a' }}
                    >
                      {cat.name}
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    style={{
                      fontFamily: 'var(--font-inria-serif), serif',
                      fontWeight: 700,
                      fontSize: 24,
                      color: '#000',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {note.title}
                  </h2>

                  {/* Content */}
                  <p
                    style={{
                      fontFamily: 'var(--font-inter), sans-serif',
                      fontSize: 12,
                      color: '#000',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 5,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {note.content}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-16">
      {/* Simple decorative illustration */}
      <div className="flex gap-2 -rotate-3 opacity-40">
        {['#EF9C66', '#FCDCA0', '#78ABA8'].map((color, i) => (
          <div
            key={i}
            className="w-16 h-20 rounded-lg border-2"
            style={{ backgroundColor: color + '60', borderColor: color }}
          />
        ))}
      </div>
      <p
        className="text-center max-w-xs"
        style={{
          fontFamily: 'var(--font-inria-serif), serif',
          fontStyle: 'italic',
          fontSize: 18,
          color: '#886428',
        }}
      >
        I&apos;m just here waiting for your charming notes...
      </p>
    </div>
  )
}
