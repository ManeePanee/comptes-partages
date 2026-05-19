'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { settleMonth, unsettleMonth } from '@/lib/api'
import { MONTH_NAMES, computeMonthBalance, computeShares, type Person } from '@/types'
import { Button } from '@/components/ui/button'
import { CategoryPieChart } from '@/components/CategoryPieChart'

export default function BilanPage() {
  const { expenses, incomes, settlements, loading, refresh } = useApp()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [settling, setSettling] = useState<string | null>(null)
  const [chartMonth, setChartMonth] = useState<number | 'all'>('all')
  const [chartPerson, setChartPerson] = useState<Person | 'all'>('all')

  const years = useMemo(() => {
    const set = new Set<number>([currentYear])
    expenses.forEach(e => set.add(e.year))
    return Array.from(set).sort((a, b) => b - a)
  }, [expenses, currentYear])

  const months = Array.from({ length: selectedYear === currentYear ? currentMonth : 12 }, (_, i) => i + 1).reverse()

  const PERSON_COLOR: Record<string, string> = { mane: 'var(--olive-600)', myriem: 'var(--red-500)' }

  const handleToggleSettle = async (year: number, month: number) => {
    const key = `${year}-${month}`
    const settlement = settlements.find(s => s.year === year && s.month === month)
    const monthExpenses = expenses.filter(e => e.year === year && e.month === month)
    const income = incomes.find(i => i.year === year && i.month === month) ?? null
    const balance = computeMonthBalance(monthExpenses, income)
    setSettling(key)
    try {
      if (settlement) await unsettleMonth(year, month)
      else if (balance.debtor && balance.creditor) await settleMonth(year, month, balance.debt_amount, balance.debtor, balance.creditor)
      await refresh()
    } finally { setSettling(null) }
  }

  const pendingTotal = useMemo(() => {
    return months.reduce((total, month) => {
      const monthExpenses = expenses.filter(e => e.year === selectedYear && e.month === month)
      const income = incomes.find(i => i.year === selectedYear && i.month === month) ?? null
      const settlement = settlements.find(s => s.year === selectedYear && s.month === month)
      if (settlement || monthExpenses.length === 0) return total
      const balance = computeMonthBalance(monthExpenses, income)
      return total + balance.debt_amount
    }, 0)
  }, [expenses, incomes, settlements, months, selectedYear])

  if (loading) {
    return <div className="flex items-center justify-center h-40 text-sm text-[var(--brown-400)]">Chargement...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--brown-900)]">Bilan</h1>
          {pendingTotal > 0.01 && (
            <p className="text-sm mt-1 text-[var(--brown-500)]">
              En attente : <span className="font-semibold text-[var(--red-500)]">{pendingTotal.toFixed(2)} €</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {years.map(y => (
            <button key={y} onClick={() => setSelectedYear(y)}
              className="px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                background: selectedYear === y ? 'var(--olive-50)' : 'white',
                color: selectedYear === y ? 'var(--olive-600)' : 'var(--brown-500)',
                borderColor: selectedYear === y ? 'var(--olive-200)' : 'var(--brown-200)',
                fontWeight: selectedYear === y ? 600 : 400,
              }}
            >{y}</button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-[var(--brown-200)] bg-white shadow-sm mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--brown-100)] bg-[var(--brown-50)]">
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--brown-500)]">Mois</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--olive-600)' }}>Mane avancé</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--red-500)' }}>Myriem avancé</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-[var(--brown-500)]">Total</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-[var(--brown-500)]">Remboursement dû</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-[var(--brown-500)]">Statut</th>
            </tr>
          </thead>
          <tbody>
            {months.map(month => {
              const monthExpenses = expenses.filter(e => e.year === selectedYear && e.month === month)
              const income = incomes.find(i => i.year === selectedYear && i.month === month) ?? null
              const settlement = settlements.find(s => s.year === selectedYear && s.month === month)
              const balance = computeMonthBalance(monthExpenses, income)
              const key = `${selectedYear}-${month}`
              const isSettled = !!settlement

              return (
                <tr key={month} className="border-b border-[var(--brown-100)] last:border-0"
                  style={{ background: isSettled ? 'var(--brown-50)' : 'white', opacity: isSettled ? 0.75 : 1 }}>
                  <td className="px-5 py-3 text-sm font-medium text-[var(--brown-900)]">{MONTH_NAMES[month - 1]}</td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: 'var(--olive-600)' }}>
                    {monthExpenses.length > 0 ? `${balance.mane_paid.toFixed(2)} €` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: 'var(--red-500)' }}>
                    {monthExpenses.length > 0 ? `${balance.myriem_paid.toFixed(2)} €` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-medium text-[var(--brown-900)]">
                    {monthExpenses.length > 0 ? `${balance.total.toFixed(2)} €` : '—'}
                  </td>
                  <td className="px-5 py-3 text-center text-sm">
                    {balance.debtor && balance.creditor ? (
                      <span>
                        <span style={{ color: PERSON_COLOR[balance.debtor] }}>{balance.debtor === 'mane' ? 'Mane' : 'Myriem'}</span>
                        {' → '}
                        <span style={{ color: PERSON_COLOR[balance.creditor] }}>{balance.creditor === 'mane' ? 'Mane' : 'Myriem'}</span>
                        <span className="font-semibold text-[var(--brown-900)] ml-2">{balance.debt_amount.toFixed(2)} €</span>
                      </span>
                    ) : monthExpenses.length > 0 ? (
                      <span className="text-[var(--olive-600)]">Égalité</span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {monthExpenses.length > 0 && balance.debtor ? (
                      <Button
                        variant="outline" size="sm"
                        onClick={() => handleToggleSettle(selectedYear, month)}
                        disabled={settling === key}
                        className="text-xs rounded-full"
                        style={{
                          borderColor: isSettled ? 'var(--olive-200)' : 'var(--brown-200)',
                          color: isSettled ? 'var(--olive-600)' : 'var(--brown-500)',
                          background: isSettled ? 'var(--olive-50)' : 'white',
                        }}
                      >
                        {settling === key ? '...' : isSettled ? '✓ Soldé' : 'En attente'}
                      </Button>
                    ) : <span className="text-[var(--brown-300)] text-xs">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Graphique par catégorie */}
      {expenses.filter(e => e.year === selectedYear).length > 0 && (
        <div className="rounded-2xl p-5 mb-6 bg-white border border-[var(--brown-200)] shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-sm font-semibold text-[var(--brown-900)]">Dépenses par catégorie</h2>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Dropdown mois */}
              <select
                value={chartMonth}
                onChange={e => setChartMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="text-xs rounded-lg px-2 py-1.5 border border-[var(--brown-200)] bg-white text-[var(--brown-700)] outline-none"
              >
                <option value="all">Tous les mois</option>
                {months.map(m => (
                  <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>
                ))}
              </select>

              {/* Segmented control personne */}
              <div className="flex rounded-lg border border-[var(--brown-200)] overflow-hidden">
                {(['all', 'mane', 'myriem'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setChartPerson(p)}
                    className="text-xs px-3 py-1.5 transition-colors"
                    style={{
                      background: chartPerson === p
                        ? p === 'mane' ? 'var(--olive-100)' : p === 'myriem' ? 'var(--red-50)' : 'var(--brown-100)'
                        : 'white',
                      color: chartPerson === p
                        ? p === 'mane' ? 'var(--olive-700)' : p === 'myriem' ? 'var(--red-600)' : 'var(--brown-800)'
                        : 'var(--brown-400)',
                      fontWeight: chartPerson === p ? 600 : 400,
                      borderRight: p !== 'myriem' ? '1px solid var(--brown-200)' : 'none',
                    }}
                  >
                    {p === 'all' ? 'Toutes' : p === 'mane' ? 'Mane' : 'Myriem'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <CategoryPieChart
            expenses={expenses.filter(e =>
              e.year === selectedYear &&
              (chartMonth === 'all' || e.month === chartMonth) &&
              (chartPerson === 'all' || e.paid_by === chartPerson)
            )}
            showFilter={false}
          />
        </div>
      )}

      {/* Récap annuel */}
      <div className="grid grid-cols-2 gap-4">
        {(['mane', 'myriem'] as const).map(person => {
          const totalPaid = expenses.filter(e => e.year === selectedYear && e.paid_by === person).reduce((s, e) => s + e.amount, 0)
          const totalDue = months.reduce((sum, month) => {
            const monthExpenses = expenses.filter(e => e.year === selectedYear && e.month === month)
            const income = incomes.find(i => i.year === selectedYear && i.month === month) ?? null
            const balance = computeMonthBalance(monthExpenses, income)
            return sum + (person === 'mane' ? balance.mane_due : balance.myriem_due)
          }, 0)
          const diff = totalPaid - totalDue

          return (
            <div key={person} className="rounded-2xl p-5 border shadow-sm"
              style={{
                background: person === 'mane' ? 'var(--olive-50)' : 'var(--red-50)',
                borderColor: person === 'mane' ? 'var(--olive-200)' : 'var(--red-200)',
              }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: PERSON_COLOR[person] }}>
                {person === 'mane' ? 'Mane' : 'Myriem'} — {selectedYear}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--brown-500)]">Total avancé</span>
                  <span className="font-medium text-[var(--brown-900)]">{totalPaid.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--brown-500)]">Total dû (parts)</span>
                  <span className="font-medium text-[var(--brown-900)]">{totalDue.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--brown-200)]">
                  <span className="text-[var(--brown-500)]">Balance</span>
                  <span className="font-bold" style={{ color: diff >= 0 ? 'var(--olive-600)' : 'var(--red-500)' }}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
