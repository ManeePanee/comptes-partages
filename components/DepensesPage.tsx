'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { MonthAccordion } from './MonthAccordion'

export function DepensesPage() {
  const { expenses, incomes, settlements, loading } = useApp()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // Années disponibles (celles qui ont des dépenses + l'année courante)
  const years = useMemo(() => {
    const set = new Set<number>([currentYear])
    expenses.forEach(e => set.add(e.year))
    return Array.from(set).sort((a, b) => b - a)
  }, [expenses, currentYear])

  // Mois à afficher : tous les mois de l'année sélectionnée de décembre à janvier
  // + le mois courant en premier si c'est l'année courante
  const months = useMemo(() => {
    const result: number[] = []
    const maxMonth = selectedYear === currentYear ? currentMonth : 12
    for (let m = maxMonth; m >= 1; m--) {
      result.push(m)
    }
    return result
  }, [selectedYear, currentYear, currentMonth])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-sm" style={{ color: 'var(--muted)' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Dépenses</h1>
        <div className="flex gap-2">
          {years.map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                background: selectedYear === y ? 'var(--card-hover)' : 'transparent',
                color: selectedYear === y ? 'var(--foreground)' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {months.map(month => {
          const monthExpenses = expenses.filter(e => e.year === selectedYear && e.month === month)
          const income = incomes.find(i => i.year === selectedYear && i.month === month) ?? null
          const settlement = settlements.find(s => s.year === selectedYear && s.month === month) ?? null
          return (
            <MonthAccordion
              key={`${selectedYear}-${month}`}
              year={selectedYear}
              month={month}
              expenses={monthExpenses}
              income={income}
              settlement={settlement}
              defaultOpen={selectedYear === currentYear && month === currentMonth}
            />
          )
        })}
      </div>
    </div>
  )
}
