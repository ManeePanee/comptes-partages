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
    <nav
      style={{
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-sm mr-4" style={{ color: 'var(--muted)' }}>
            💸 comptes
          </span>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                background: pathname === l.href ? 'var(--card-hover)' : 'transparent',
                color: pathname === l.href ? 'var(--foreground)' : 'var(--muted)',
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
