import type { Metadata } from 'next'
import './globals.css'
import { NotesProvider } from '@/lib/store'
import { inter, inriaSerif } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Notes',
  description: 'Your personal notes app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${inriaSerif.variable}`}>
      <body>
        <NotesProvider>{children}</NotesProvider>
      </body>
    </html>
  )
}
