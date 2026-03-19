'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

type LoginVariant = 'new-friend' | 'returning'

function pickVariant(): LoginVariant {
  return Math.random() < 0.5 ? 'new-friend' : 'returning'
}

export default function LoginPage() {
  const router = useRouter()
  const variant = useMemo<LoginVariant>(pickVariant, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isNewFriend = variant === 'new-friend'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push('/dashboard')
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor: '#F9F1E3' }}
    >
      <div className="flex w-full max-w-[1280px] h-[832px] relative overflow-hidden">
        {/* Illustration side */}
        <div className="flex-1 flex items-center justify-center relative">
          <IllustrationBlob isNewFriend={isNewFriend} />
        </div>

        {/* Form side */}
        <div className="w-[480px] flex flex-col justify-center px-16 gap-8">
          {/* Heading */}
          <h1
            className="text-5xl leading-tight"
            style={{
              fontFamily: 'var(--font-inria-serif), serif',
              fontWeight: 700,
              color: '#886428',
            }}
          >
            {isNewFriend ? 'Yay, New Friend!' : "Yay, You're Back!"}
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {/* Email input */}
            <div className="flex flex-col gap-1">
              <label
                className="text-xs font-medium"
                style={{ color: '#886428', fontFamily: 'var(--font-inter), sans-serif' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full h-[39px] px-4 rounded-md border bg-transparent text-sm outline-none focus:ring-1"
                style={{
                  borderColor: '#9747FF',
                  fontFamily: 'var(--font-inter), sans-serif',
                  color: '#3a2a0a',
                }}
              />
            </div>

            {/* Password input */}
            <div className="flex flex-col gap-1">
              <label
                className="text-xs font-medium"
                style={{ color: '#886428', fontFamily: 'var(--font-inter), sans-serif' }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-[39px] px-4 rounded-md border bg-transparent text-sm outline-none focus:ring-1"
                style={{
                  borderColor: '#9747FF',
                  fontFamily: 'var(--font-inter), sans-serif',
                  color: '#3a2a0a',
                }}
              />
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              className="mt-2 h-[43px] rounded-full border transition-opacity hover:opacity-80 text-sm font-medium"
              style={{
                borderColor: '#956E39',
                color: '#956E39',
                fontFamily: 'var(--font-inter), sans-serif',
                backgroundColor: 'transparent',
              }}
            >
              Sign In
            </button>
          </form>

          {/* Variant switch link */}
          <p
            className="text-sm text-center cursor-pointer hover:underline"
            style={{ color: '#886428', fontFamily: 'var(--font-inter), sans-serif' }}
            onClick={() => router.push('/dashboard')}
          >
            {isNewFriend ? "We're already friends!" : "Oops! I've never been here before"}
          </p>
        </div>
      </div>
    </div>
  )
}

function IllustrationBlob({ isNewFriend }: { isNewFriend: boolean }) {
  return (
    <div className="relative w-80 h-80 flex items-center justify-center select-none">
      {/* Decorative blob background */}
      <svg
        viewBox="0 0 320 320"
        className="absolute inset-0 w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="160" cy="160" rx="140" ry="130" fill="#EF9C66" fillOpacity="0.25" />
        <ellipse cx="145" cy="155" rx="100" ry="95" fill="#FCDCA0" fillOpacity="0.35" />
      </svg>

      {/* Simple note stack illustration */}
      <div className="relative z-10 flex flex-col gap-2 -rotate-6">
        {[
          { color: '#EF9C66', label: 'Random Thoughts', offset: '' },
          { color: '#FCDCA0', label: 'School', offset: 'ml-4 mt-1' },
          { color: '#78ABA8', label: 'Personal', offset: 'ml-8 mt-1' },
        ].map((card, i) => (
          <div
            key={i}
            className={`w-32 h-20 rounded-lg border-2 flex flex-col justify-end p-2 ${card.offset}`}
            style={{
              backgroundColor: card.color + '80',
              borderColor: card.color,
              boxShadow: '1px 1px 2px rgba(0,0,0,0.15)',
            }}
          >
            <span
              className="text-[10px] font-bold"
              style={{ fontFamily: 'var(--font-inria-serif), serif', color: '#3a2a0a' }}
            >
              {card.label}
            </span>
          </div>
        ))}
      </div>

      {/* Greeting text badge */}
      <div
        className="absolute -bottom-4 -right-4 px-3 py-1 rounded-full text-xs font-medium rotate-3"
        style={{
          backgroundColor: '#9747FF',
          color: '#fff',
          fontFamily: 'var(--font-inter), sans-serif',
        }}
      >
        {isNewFriend ? '👋 Hello!' : '✨ Welcome back!'}
      </div>
    </div>
  )
}
