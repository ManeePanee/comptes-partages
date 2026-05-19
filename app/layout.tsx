import type { Metadata } from 'next'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import { Nav } from '@/components/Nav'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Comptes — Mane & Myriem',
  description: 'Gestion des dépenses communes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={cn("h-full", "font-sans", geist.variable)}>
      <body className={`${inter.className} min-h-full flex flex-col`}>
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
