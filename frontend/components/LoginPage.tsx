'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import catImg from '@/app/img/cat.png'
import plantImg from '@/app/img/plant.png'
import { login, register, setTokens, getAccessToken } from '@/lib/api'

type Mode = 'signin' | 'signup'

export default function LoginPage({ mode = 'signin' }: { mode?: Mode }) {
  const router = useRouter()

  useEffect(() => {
    if (getAccessToken()) {
      router.replace('/dashboard')
    }
  }, [router])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'signup'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const tokens = await (isSignUp ? register(email, password) : login(email, password))
      setTokens(tokens.access, tokens.refresh)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : isSignUp ? 'Registration failed' : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-cream flex items-center justify-center">
      <div className="flex justify-center w-full max-w-[50rem]">
        <div className="flex flex-col justify-center px-16 gap-8">
          <CharacterBadge isSignUp={isSignUp} />

          <h1 className="m-0 font-serif font-bold text-5xl leading-[1.1] text-title-brown">
            {isSignUp ? 'Yay, New Friend!' : "Yay, You're Back!"}
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full h-[39px] px-[14px] border border-accent-purple rounded-md bg-transparent font-sans text-sm text-[#3a2a0a] outline-none focus:shadow-[0_0_0_2px_#9747FF44]"
            />
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-[39px] px-[14px] pr-10 border border-accent-purple rounded-md bg-transparent font-sans text-sm text-[#3a2a0a] outline-none focus:shadow-[0_0_0_2px_#9747FF44]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 text-accent-purple opacity-60 hover:opacity-100 focus:outline-none"
                tabIndex={-1}
              >
                {!showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <p className="m-0 font-sans text-xs text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[43px] mt-2 border border-accent-brown rounded-full bg-transparent font-sans text-sm font-medium text-accent-brown cursor-pointer transition-opacity hover:opacity-70 disabled:opacity-50"
            >
              {loading
                ? isSignUp ? 'Signing up…' : 'Signing in…'
                : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <span
            onClick={() => router.push(isSignUp ? '/login' : '/signup')}
            className="font-sans text-xs text-accent-brown underline cursor-pointer select-none text-center"
          >
            {isSignUp ? "We're already friends!" : "Oops! I've never been here before"}
          </span>
        </div>
      </div>
    </div>
  )
}

function CharacterBadge({ isSignUp }: { isSignUp: boolean }) {
  return (
    <div className="flex flex-col justify-center gap-2">
      <Image
        src={isSignUp ? catImg : plantImg}
        alt={isSignUp ? 'cat' : 'plant'}
        className="object-contain"
        style={{ maxHeight: '140px', width: 'auto' }}
      />
    </div>
  )
}
