'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, CategoryId, getCategoryById } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { getNotes, createNote, getAccessToken } from '@/lib/api'
import type { Note } from '@/lib/types'
import Image from 'next/image'
import coffeeImage from '@/app/img/coffee.png'

export default function DashboardPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/')
      return
    }
    getNotes().then(setNotes).catch(() => router.replace('/')).finally(() => setLoading(false))
  }, [router])

  const filtered = activeCategory
    ? notes.filter((n) => n.category === activeCategory)
    : notes

  const countByCategory = (id: CategoryId) => notes.filter((n) => n.category === id).length

  async function handleNewNote() {
    try {
      const note = await createNote({
        title: 'Untitled',
        content: '',
        category: activeCategory ?? 'random-thoughts',
      })
      router.push(`/notes/${note.id}`)
    } catch {
      // ignore — stay on dashboard
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col pl-[23px] pr-[34px]">
      {/* Top bar */}
      <div className="h-[101px] flex items-center justify-end">
        <button
          onClick={handleNewNote}
          className="h-[43px] px-4 rounded-full border border-accent-brown bg-transparent text-accent-brown font-sans text-sm font-medium flex items-center gap-[6px] cursor-pointer transition-opacity hover:opacity-70"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1V13M1 7H13" stroke="#956E39" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New Note
        </button>
      </div>

      {/* Content row */}
      <div className="flex-1 flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 flex flex-col">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex items-center h-8 px-4 font-sans text-sm text-[#3a2a0a] border-none rounded cursor-pointer text-left transition-colors hover:bg-black/5 ${activeCategory === null ? 'font-semibold bg-black/[0.06]' : 'font-normal bg-transparent'
              }`}
          >
            All Categories
          </button>

          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(isActive ? null : cat.id)}
                className={`flex items-center h-8 px-4 gap-2 font-sans text-sm text-[#3a2a0a] border-none rounded cursor-pointer text-left transition-colors hover:bg-black/5 ${isActive ? 'font-semibold bg-black/[0.06]' : 'font-normal bg-transparent'
                  }`}
              >
                <span
                  className="w-[11px] h-[11px] rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="flex-1">{cat.name}</span>
                <span className="font-sans text-xs text-[#3a2a0a] opacity-60 min-w-[16px] text-right tabular-nums">
                  {countByCategory(cat.id)}
                </span>
              </button>
            )
          })}
        </aside>

        {/* Notes grid */}
        <main className="flex-1">
          {loading ? null : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-wrap gap-x-[13px] gap-y-4 content-start">
              {filtered.map((note) => {
                const cat = getCategoryById(note.category)
                return (
                  <button
                    key={note.id}
                    onClick={() => router.push(`/notes/${note.id}`)}
                    className="w-[303px] h-[246px] rounded-[11px] p-4 flex flex-col gap-3 flex-shrink-0 cursor-pointer text-left"
                    style={{
                      backgroundColor: cat.color + '80',
                      border: `3px solid ${cat.color}`,
                      boxShadow: '1px 1px 2px rgba(0,0,0,0.25)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs text-[#3a2a0a]">
                        {formatDate(note.updatedAt)}
                      </span>
                      <span className="font-sans text-xs text-[#3a2a0a] opacity-60">
                        {cat.name}
                      </span>
                    </div>

                    <h2 className="font-serif font-bold text-2xl leading-tight text-black m-0 line-clamp-2">
                      {note.title}
                    </h2>

                    <p className="font-sans text-xs leading-[1.5] text-black m-0 flex-1 line-clamp-5">
                      {note.content}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-[100%] align-center gap-6 pb-16">
      <div className="flex gap-2 -rotate-3 opacity-40">
        <Image
          src={coffeeImage}
          alt="coffee"
          className="object-contain"
          style={{ width: '300px' }}
        />
      </div>
      <p className="font-serif italic text-xl text-title-brown text-center m-0">
        I&apos;m just here waiting for your charming notes...
      </p>
    </div>
  )
}
