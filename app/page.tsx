'use client'

import { useApp } from '@/context/AppContext'
import { ProfileSelect } from '@/components/ProfileSelect'
import { DepensesPage } from '@/components/DepensesPage'

export default function Home() {
  const { profile } = useApp()

  if (!profile) return <ProfileSelect />
  return <DepensesPage />
}
