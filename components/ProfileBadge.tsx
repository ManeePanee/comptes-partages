'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import type { Person } from '@/types'

const LABEL: Record<Person, string> = { mane: 'Mane', myriem: 'Myriem' }
const COLOR: Record<Person, string> = {
  mane: 'var(--olive-600)',
  myriem: 'var(--red-500)',
}
const BG: Record<Person, string> = {
  mane: 'var(--olive-50)',
  myriem: 'var(--red-50)',
}
const BORDER: Record<Person, string> = {
  mane: 'var(--olive-200)',
  myriem: 'var(--red-200)',
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
          background: BG[profile],
          color: COLOR[profile],
          border: `1px solid ${BORDER[profile]}`,
        }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: COLOR[profile] }} />
        {LABEL[profile]}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl overflow-hidden shadow-lg bg-white border border-[var(--border)]">
          {(['mane', 'myriem'] as Person[]).map(p => (
            <button
              key={p}
              onClick={() => { setProfile(p); setOpen(false) }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--brown-50)] transition-colors"
              style={{ color: profile === p ? COLOR[p] : 'var(--brown-700)' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: COLOR[p] }} />
              {LABEL[p]}
              {profile === p && <span className="ml-auto text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
