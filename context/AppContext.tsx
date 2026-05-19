'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { Person, Expense, Income, Settlement } from '@/types'
import { getAllExpenses, getAllIncomes, getAllSettlements } from '@/lib/api'

interface AppContextValue {
  profile: Person | null
  setProfile: (p: Person) => void
  expenses: Expense[]
  incomes: Income[]
  settlements: Settlement[]
  loading: boolean
  refresh: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Person | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('comptes_profile') as Person | null
    if (saved) setProfileState(saved)
  }, [])

  const setProfile = (p: Person) => {
    localStorage.setItem('comptes_profile', p)
    setProfileState(p)
  }

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [exp, inc, set] = await Promise.all([
        getAllExpenses(),
        getAllIncomes(),
        getAllSettlements(),
      ])
      setExpenses(exp)
      setIncomes(inc)
      setSettlements(set)
    } catch (e) {
      console.error('Error fetching data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <AppContext.Provider value={{ profile, setProfile, expenses, incomes, settlements, loading, refresh }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
