'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, CategoryId, getCategoryById } from '@/lib/types'
import { formatLastEdited } from '@/lib/utils'
import { getNote, patchNote, getAccessToken } from '@/lib/api'
import type { Note } from '@/lib/types'

interface Props {
  id: string
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function NoteDetailPage({ id }: Props) {
  const router = useRouter()
  const [note, setNote] = useState<Note | null>(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<CategoryId>('random-thoughts')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString())

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/')
      return
    }
    getNote(id)
      .then((n) => {
        setNote(n)
        setTitle(n.title)
        setContent(n.content)
        setCategory(n.category)
        setLastUpdated(n.updatedAt)
      })
      .catch(() => router.replace('/dashboard'))
  }, [id, router])

  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [])

  useEffect(() => { autoResize(titleRef.current) }, [title, autoResize])
  useEffect(() => { autoResize(contentRef.current) }, [content, autoResize])

  function scheduleSave(patch: Partial<{ title: string; content: string; category: CategoryId }>) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      patchNote(id, patch).then((updated) => setLastUpdated(updated.updatedAt)).catch(() => {})
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
    patchNote(id, { title, content, category: cat })
      .then((updated) => setLastUpdated(updated.updatedAt))
      .catch(() => {})
  }

  if (!note) return null

  const activeCat = getCategoryById(category)
  const cardBg = hexToRgba(activeCat.color, 0.5)

  return (
    <div
      className="min-h-screen w-full bg-cream"
      onClick={() => dropdownOpen && setDropdownOpen(false)}
    >
      {/* Top bar */}
      <div className="h-[35px] flex items-center px-6 border-b border-black/10 flex-shrink-0">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-title-brown font-sans text-sm p-0 transition-opacity hover:opacity-70"
        >
          <span className="text-lg leading-none">←</span>
          <span>Back</span>
        </button>
      </div>

      {/* Content area */}
      <div className="px-[37px] pt-3 pb-[37px] flex flex-col gap-2 min-h-[calc(100vh-35px)]">
        {/* Category dropdown */}
        <div
          className="relative self-start"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 px-[10px] py-[5px] rounded-md bg-transparent cursor-pointer font-sans text-[13px] text-[#3a2a0a] transition-colors hover:bg-black/[0.04]"
            style={{ border: '1.5px solid #9747FF' }}
          >
            <span
              className="w-[11px] h-[11px] rounded-full flex-shrink-0 inline-block"
              style={{ backgroundColor: activeCat.color }}
            />
            <span>{activeCat.name}</span>
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M2 4L6 8L10 4" stroke="#9747FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {dropdownOpen && (
            <div
              className="absolute top-full mt-1 left-0 rounded-md bg-cream shadow-md z-20 overflow-hidden min-w-[180px]"
              style={{ border: '1.5px solid #9747FF' }}
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 bg-transparent border-none cursor-pointer font-sans text-[13px] text-[#3a2a0a] text-left transition-colors hover:bg-black/5 ${
                    cat.id === category ? 'font-semibold' : 'font-normal'
                  }`}
                >
                  <span
                    className="w-[11px] h-[11px] rounded-full flex-shrink-0 inline-block"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Note card */}
        <div
          className="flex-1 rounded-[11px] flex flex-col gap-6 min-h-[700px] transition-colors duration-[250ms] pt-[39px] px-16 pb-16"
          style={{
            backgroundColor: cardBg,
            border: `3px solid ${activeCat.color}`,
            boxShadow: '1px 1px 2px rgba(0,0,0,0.25)',
          }}
        >
          <p className="m-0 font-sans text-xs text-black/45 leading-[1.4] select-none">
            Last Edited: {formatLastEdited(lastUpdated)}
          </p>

          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Note title..."
            rows={1}
            className="m-0 p-0 w-full bg-transparent border-none outline-none resize-none overflow-hidden font-serif font-bold text-[34px] leading-[1.25] text-[#1a1007]"
          />

          <div className="h-px bg-black/10" />

          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing..."
            rows={1}
            className="m-0 p-0 flex-1 w-full bg-transparent border-none outline-none resize-none overflow-hidden font-sans text-[15px] text-[#1a1007] leading-[1.65] min-h-[200px]"
          />
        </div>
      </div>
    </div>
  )
}
