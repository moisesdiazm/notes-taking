'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, CategoryId, getDisplayCategory } from '@/lib/types'
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
  const [category, setCategory] = useState<CategoryId | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString())

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPatchRef = useRef<Partial<{ title: string; content: string; category: CategoryId | null }>>({})
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

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  function scheduleSave(patch: Partial<{ title: string; content: string; category: CategoryId | null }>) {
    pendingPatchRef.current = { ...pendingPatchRef.current, ...patch }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      const pendingPatch = pendingPatchRef.current
      pendingPatchRef.current = {}
      patchNote(id, pendingPatch)
        .then((updated) => setLastUpdated(updated.updatedAt))
        .catch(() => {})
    }, 400)
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    scheduleSave({ title: val })
  }

  function handleContentChange(val: string) {
    setContent(val)
    scheduleSave({ content: val })
  }

  function handleCategoryChange(cat: CategoryId) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    const pendingPatch = { ...pendingPatchRef.current, category: cat }
    pendingPatchRef.current = {}

    setCategory(cat)
    setDropdownOpen(false)
    patchNote(id, pendingPatch)
      .then((updated) => setLastUpdated(updated.updatedAt))
      .catch(() => {})
  }

  if (!note) return null

  const activeCat = getDisplayCategory(category)
  const cardBg = hexToRgba(activeCat.color, 0.5)

  return (
    <div
      className="h-screen w-full bg-cream flex flex-col overflow-hidden"
      onClick={() => dropdownOpen && setDropdownOpen(false)}
    >
      {/* Content area */}
      <div className="px-[37px] pt-8 pb-[37px] flex flex-col gap-2 flex-1 overflow-hidden">
        {/* Category dropdown + close button row */}
        <div className="flex items-center justify-between">
        <div
          className="relative self-start"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 px-[10px] min-w-[220px] min-h-[35px] py-[5px] rounded-md bg-transparent cursor-pointer font-sans text-[13px] text-[#3a2a0a] transition-colors hover:bg-black/[0.04]"
            style={{ border: '1px solid #3a2d25' }}
          >
            <span
              className="w-[11px] h-[11px] rounded-full flex-shrink-0 inline-block"
              style={{ backgroundColor: activeCat.color }}
            />
            <span className='grow text-left'>{activeCat.name}</span>
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M2 4L6 8L10 4" stroke="#3a2d25" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {dropdownOpen && (
            <div
              className="absolute top-full mt-1   min-w-[220px] left-0 rounded-md bg-cream shadow-md z-20 overflow-hidden min-w-[180px]"
   
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

          <button
            onClick={() => router.push('/dashboard')}
            aria-label="Close note"
            className="bg-transparent border-none cursor-pointer text-title-brown p-2 transition-opacity hover:opacity-70 leading-none"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="20" y2="20" />
              <line x1="20" y1="2" x2="2" y2="20" />
            </svg>
          </button>
        </div>

        {/* Note card */}
        <div
          className="flex-1 rounded-[11px] flex flex-col gap-6 overflow-y-auto transition-colors duration-[250ms] pt-[39px] px-16 pb-16"
          style={{
            backgroundColor: cardBg,
            border: `3px solid ${activeCat.color}`,
            boxShadow: '1px 1px 2px rgba(0,0,0,0.25)',
          }}
        >
          <div className='w-[100%] flex justify-end'>
            <p className="m-0 font-sans text-xs text-black leading-[1.4] select-none">
              Last Edited: {formatLastEdited(lastUpdated)}
            </p>
          </div>

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
            className="m-0 p-0 flex-1 w-full bg-transparent border-none outline-none resize-none font-sans text-[15px] text-[#1a1007] leading-[1.65] min-h-[200px]"
          />
        </div>
      </div>
    </div>
  )
}
