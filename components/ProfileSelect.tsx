'use client'

import { useApp } from '@/context/AppContext'
import type { Person } from '@/types'

const profiles: { id: Person; label: string; desc: string }[] = [
  { id: 'mane',   label: 'Mane',   desc: 'Chaud' },
  { id: 'myriem', label: 'Myriem', desc: 'Froid' },
]

const PERSON_COLOR: Record<Person, string> = {
  mane:   'var(--orange)',
  myriem: 'var(--blue)',
}
const PERSON_BG: Record<Person, string> = {
  mane:   'rgba(255,90,31,.1)',
  myriem: 'rgba(36,64,216,.1)',
}

export function ProfileSelect() {
  const { setProfile } = useApp()

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] gap-10 overflow-hidden">
      {/* Orbes */}
      <div className="g-orbs">
        <div
          className="g-orb g-orb--warm g-orb--drift"
          style={{ width: '70vw', aspectRatio: '1', top: '-20%', right: '-20%' }}
        />
        <div
          className="g-orb g-orb--cool"
          style={{ width: '55vw', aspectRatio: '1', bottom: '-15%', left: '-15%' }}
        />
      </div>
      {/* Grain sur les orbes */}
      <div className="g-grain" />

      {/* Contenu */}
      <div className="relative z-10 text-center">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(52px, 10vw, 80px)', lineHeight: 0.9, color: 'var(--ink)', marginBottom: '8px' }}>
          Comptes
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>
          Mane &amp; Myriem — Qui es-tu ?
        </p>
      </div>

      <div className="relative z-10 flex gap-3">
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => setProfile(p.id)}
            className="flex flex-col items-center gap-2 px-10 py-7 transition-all hover:scale-105 active:scale-95"
            style={{
              borderRadius: 'var(--radius-card)',
              background: PERSON_BG[p.id],
              border: `1px solid ${PERSON_COLOR[p.id]}33`,
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: p.id === 'myriem' ? 'var(--blue)' : 'var(--ink)' }}>
              {p.label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>
              {p.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
