'use client'

import { useApp } from '@/context/AppContext'
import type { Person } from '@/types'

const profiles: { id: Person; label: string; emoji: string; color: string; bg: string }[] = [
  { id: 'mane', label: 'Mane', emoji: '🌿', color: 'var(--accent-mane)', bg: 'var(--accent-mane-bg)' },
  { id: 'myriem', label: 'Myriem', emoji: '🌸', color: 'var(--accent-myriem)', bg: 'var(--accent-myriem-bg)' },
]

export function ProfileSelect() {
  const { setProfile } = useApp()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">💸 Comptes</h1>
        <p style={{ color: 'var(--muted)' }} className="text-sm">
          Mane & Myriem — Qui es-tu ?
        </p>
      </div>

      <div className="flex gap-4">
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => setProfile(p.id)}
            className="flex flex-col items-center gap-3 px-10 py-8 rounded-2xl transition-all hover:scale-105 active:scale-95"
            style={{
              background: p.bg,
              border: `1px solid ${p.color}33`,
            }}
          >
            <span className="text-4xl">{p.emoji}</span>
            <span className="font-semibold text-lg" style={{ color: p.color }}>
              {p.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
