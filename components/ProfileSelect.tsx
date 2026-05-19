'use client'

import { useApp } from '@/context/AppContext'
import type { Person } from '@/types'

const profiles = [
  { id: 'mane' as Person, label: 'Mane', emoji: '🌿', color: 'var(--olive-600)', bg: 'var(--olive-50)', border: 'var(--olive-200)' },
  { id: 'myriem' as Person, label: 'Myriem', emoji: '🌸', color: 'var(--red-500)', bg: 'var(--red-50)', border: 'var(--red-200)' },
]

export function ProfileSelect() {
  const { setProfile } = useApp()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 text-[var(--brown-900)]">💸 Comptes</h1>
        <p className="text-sm text-[var(--brown-400)]">Mane & Myriem — Qui es-tu ?</p>
      </div>

      <div className="flex gap-4">
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => setProfile(p.id)}
            className="flex flex-col items-center gap-3 px-10 py-8 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-sm"
            style={{ background: p.bg, border: `1px solid ${p.border}` }}
          >
            <span className="text-4xl">{p.emoji}</span>
            <span className="font-semibold text-lg" style={{ color: p.color }}>{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
