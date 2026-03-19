'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import catImg from '@/app/img/cat.png'
import plantImg from '@/app/img/plant.png'

type LoginVariant = 'new-friend' | 'returning'

function pickVariant(): LoginVariant {
  return Math.random() < 0.5 ? 'new-friend' : 'returning'
}

export default function LoginPage() {
  const router = useRouter()
  const [variant, setVariant] = useState<LoginVariant>('new-friend')

  useEffect(() => {
    setVariant(pickVariant())
  }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isNewFriend = variant === 'new-friend'

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    router.push('/dashboard')
  }

  function toggleVariant() {
    setVariant((v) => (v === 'new-friend' ? 'returning' : 'new-friend'))
  }

  return (
    <div className="min-h-screen w-full bg-cream flex items-center justify-center">
      <div className="flex justify-center w-full max-w-[50rem]">
        <div className="flex flex-col justify-center px-16 gap-8">
          <CharacterBadge isNewFriend={isNewFriend} />

          <h1 className="m-0 font-serif font-bold text-5xl leading-[1.1] text-title-brown">
            {isNewFriend ? 'Yay, New Friend!' : "Yay, You're Back!"}
          </h1>

          <form onSubmit={handleSignIn} className="flex flex-col gap-[14px]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full h-[39px] px-[14px] border border-accent-purple rounded-md bg-transparent font-sans text-sm text-[#3a2a0a] outline-none focus:shadow-[0_0_0_2px_#9747FF44]"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-[39px] px-[14px] border border-accent-purple rounded-md bg-transparent font-sans text-sm text-[#3a2a0a] outline-none focus:shadow-[0_0_0_2px_#9747FF44]"
            />
            <button
              type="submit"
              className="w-full h-[43px] mt-2 border border-accent-brown rounded-full bg-transparent font-sans text-sm font-medium text-accent-brown cursor-pointer transition-opacity hover:opacity-70"
            >
              Sign In
            </button>
          </form>

          <span
            onClick={toggleVariant}
            className="font-sans text-xs text-accent-brown underline cursor-pointer select-none text-center"
          >
            {isNewFriend ? "We're already friends!" : "Oops! I've never been here before"}
          </span>
        </div>
      </div>
    </div>
  )
}

function CharacterBadge({ isNewFriend }: { isNewFriend: boolean }) {
  const accent = isNewFriend ? '#EF9C66' : '#78ABA8'
  return (
    <div
      className="flex flex-col justify-center gap-2"
    >
      <Image
        src={isNewFriend ? catImg : plantImg}
        alt={isNewFriend ? 'cat' : 'plant'}
        className="object-contain"
        style={{ maxHeight: '140px', width: 'auto' }}
      />
    </div>
  )
}
