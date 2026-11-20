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
    <nav className="sticky top-0 z-50" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)' }}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontStyle: 'italic', color: 'var(--ink)' }}>
            Comptes
          </span>
          <div className="g-tabs">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                data-active={pathname === l.href ? 'true' : 'false'}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        {profile && <ProfileBadge />}
      </div>
    </nav>
  )
}
