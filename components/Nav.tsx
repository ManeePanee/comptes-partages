'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { ProfileBadge } from './ProfileBadge'

const links = [
  { href: '/', label: 'Dépenses' },
  { href: '/revenus', label: 'Revenus' },
  { href: '/bilan', label: 'Bilan' },
]

export function Nav() {
  const pathname = usePathname()
  const { profile } = useApp()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-[var(--brown-700)] mr-4">
            💸 comptes
          </span>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: pathname === l.href ? 'var(--olive-50)' : 'transparent',
                color: pathname === l.href ? 'var(--olive-600)' : 'var(--brown-500)',
                fontWeight: pathname === l.href ? 600 : 400,
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        {profile && <ProfileBadge />}
      </div>
    </nav>
  )
}
