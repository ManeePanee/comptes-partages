'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { MonthAccordion } from './MonthAccordion'

export function DepensesPage() {
  const { expenses, incomes, settlements, loading } = useApp()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const years = useMemo(() => {
    const set = new Set<number>([currentYear])
    expenses.forEach(e => set.add(e.year))
    return Array.from(set).sort((a, b) => b - a)
  }, [expenses, currentYear])

  const months = useMemo(() => {
    const result: number[] = []
    const maxMonth = selectedYear === currentYear ? currentMonth : 12
    for (let m = maxMonth; m >= 1; m--) result.push(m)
    return result
  }, [selectedYear, currentYear, currentMonth])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>
          Chargement…
        </span>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 400, color: 'var(--ink)' }}>
          Dépenses
        </h1>
        <div className="flex gap-1.5">
          {years.map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={selectedYear === y ? 'g-chip g-chip--active' : 'g-chip'}
              aria-pressed={selectedYear === y}
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
