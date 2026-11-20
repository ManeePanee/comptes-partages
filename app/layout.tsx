import type { Metadata } from 'next'
import { Instrument_Serif, Inter_Tight, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import { Nav } from '@/components/Nav'
import { cn } from '@/lib/utils'

const display = Instrument_Serif({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-display',
})

const sans = Inter_Tight({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-sans',
})

const mono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Comptes — Mane & Myriem',
  description: 'Gestion des dépenses communes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={cn('h-full', display.variable, sans.variable, mono.variable)}>
      <body className="g-grain-page min-h-full flex flex-col">
        <AppProvider>
          <Nav />
          <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  )
}
