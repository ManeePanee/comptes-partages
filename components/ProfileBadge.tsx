'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import type { Person } from '@/types'

const LABEL: Record<Person, string> = { mane: 'Mane', myriem: 'Myriem' }
const COLOR: Record<Person, string> = {
  mane:   'var(--orange)',
  myriem: 'var(--blue)',
}

export function ProfileBadge() {
  const { profile, setProfile } = useApp()
  const [open, setOpen] = useState(false)
  if (!profile) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 transition-opacity hover:opacity-80"
        style={{
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-pill)',
          padding: '5px 12px 5px 10px',
          background: 'transparent',
          color: 'var(--ink)',
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLOR[profile] }} />
        {LABEL[profile]}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-36 overflow-hidden"
          style={{
            borderRadius: 'var(--radius-field)',
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            boxShadow: '0 8px 24px -8px rgba(22,20,15,.2)',
          }}
        >
          {(['mane', 'myriem'] as Person[]).map(p => (
            <button
              key={p}
              onClick={() => { setProfile(p); setOpen(false) }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--paper-2)]"
              style={{ color: 'var(--ink)' }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLOR[p] }} />
              {LABEL[p]}
              {profile === p && <span className="ml-auto text-xs" style={{ color: 'var(--ink-2)' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
