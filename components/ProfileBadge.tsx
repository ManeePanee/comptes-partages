'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import type { Person } from '@/types'

const PERSON_LABEL: Record<Person, string> = {
  mane: 'Mane',
  myriem: 'Myriem',
}

const PERSON_COLOR: Record<Person, string> = {
  mane: 'var(--accent-mane)',
  myriem: 'var(--accent-myriem)',
}

export function ProfileBadge() {
  const { profile, setProfile } = useApp()
  const [open, setOpen] = useState(false)

  if (!profile) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
        style={{
          background: profile === 'mane' ? 'var(--accent-mane-bg)' : 'var(--accent-myriem-bg)',
          color: PERSON_COLOR[profile],
          border: `1px solid ${PERSON_COLOR[profile]}33`,
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: PERSON_COLOR[profile] }}
        />
        {PERSON_LABEL[profile]}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-40 rounded-xl overflow-hidden shadow-lg"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {(['mane', 'myriem'] as Person[]).map(p => (
            <button
              key={p}
              onClick={() => { setProfile(p); setOpen(false) }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
              style={{ color: profile === p ? PERSON_COLOR[p] : 'var(--foreground)' }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: PERSON_COLOR[p] }}
              />
              {PERSON_LABEL[p]}
              {profile === p && <span className="ml-auto text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
