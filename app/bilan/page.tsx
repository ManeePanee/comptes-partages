'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { settleMonth, unsettleMonth } from '@/lib/api'
import { MONTH_NAMES, computeMonthBalance, computeShares } from '@/types'

export default function BilanPage() {
  const { expenses, incomes, settlements, loading, refresh } = useApp()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [settling, setSettling] = useState<string | null>(null)

  const years = useMemo(() => {
    const set = new Set<number>([currentYear])
    expenses.forEach(e => set.add(e.year))
    return Array.from(set).sort((a, b) => b - a)
  }, [expenses, currentYear])

  const months = Array.from(
    { length: selectedYear === currentYear ? currentMonth : 12 },
    (_, i) => i + 1
  ).reverse()

  const PERSON_COLOR: Record<string, string> = {
    mane: 'var(--accent-mane)',
    myriem: 'var(--accent-myriem)',
  }

  const handleToggleSettle = async (year: number, month: number) => {
    const key = `${year}-${month}`
    const settlement = settlements.find(s => s.year === year && s.month === month)
    const monthExpenses = expenses.filter(e => e.year === year && e.month === month)
    const income = incomes.find(i => i.year === year && i.month === month) ?? null
    const balance = computeMonthBalance(monthExpenses, income)

    setSettling(key)
    try {
      if (settlement) {
        await unsettleMonth(year, month)
      } else if (balance.debtor && balance.creditor) {
        await settleMonth(year, month, balance.debt_amount, balance.debtor, balance.creditor)
      }
      await refresh()
    } finally {
      setSettling(null)
    }
  }

  // Total en attente de remboursement
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
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-sm" style={{ color: 'var(--muted)' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Bilan</h1>
          {pendingTotal > 0.01 && (
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Total en attente : <span className="font-semibold" style={{ color: '#ef4444' }}>{pendingTotal.toFixed(2)} €</span>
            </p>
          )}
        </div>
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

      {/* Tableau récapitulatif */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: 'var(--muted)' }}>Mois</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--accent-mane)' }}>Mane avancé</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--accent-myriem)' }}>Myriem avancé</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--muted)' }}>Total</th>
              <th className="text-center px-5 py-3 text-xs font-medium" style={{ color: 'var(--muted)' }}>Remboursement dû</th>
              <th className="text-center px-5 py-3 text-xs font-medium" style={{ color: 'var(--muted)' }}>Statut</th>
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
              const isSettling = settling === key

              return (
                <tr
                  key={month}
                  style={{
                    background: isSettled ? 'var(--background)' : 'var(--card)',
                    borderBottom: '1px solid var(--border)',
                    opacity: isSettled ? 0.7 : 1,
                  }}
                >
                  <td className="px-5 py-3 text-sm font-medium">{MONTH_NAMES[month - 1]}</td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: 'var(--accent-mane)' }}>
                    {monthExpenses.length > 0 ? `${balance.mane_paid.toFixed(2)} €` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: 'var(--accent-myriem)' }}>
                    {monthExpenses.length > 0 ? `${balance.myriem_paid.toFixed(2)} €` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-medium">
                    {monthExpenses.length > 0 ? `${balance.total.toFixed(2)} €` : '—'}
                  </td>
                  <td className="px-5 py-3 text-center text-sm">
                    {balance.debtor && balance.creditor ? (
                      <span>
                        <span style={{ color: PERSON_COLOR[balance.debtor] }}>
                          {balance.debtor === 'mane' ? 'Mane' : 'Myriem'}
                        </span>
                        {' → '}
                        <span style={{ color: PERSON_COLOR[balance.creditor] }}>
                          {balance.creditor === 'mane' ? 'Mane' : 'Myriem'}
                        </span>
                        <span className="font-semibold ml-2">{balance.debt_amount.toFixed(2)} €</span>
                      </span>
                    ) : (
                      monthExpenses.length > 0 ? <span style={{ color: '#10b981' }}>Égalité</span> : '—'
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {monthExpenses.length > 0 && balance.debtor ? (
                      <button
                        onClick={() => handleToggleSettle(selectedYear, month)}
                        disabled={!!isSettling}
                        className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                        style={{
                          background: isSettled ? '#10b98122' : '#ef444422',
                          color: isSettled ? '#10b981' : '#ef4444',
                          border: `1px solid ${isSettled ? '#10b98144' : '#ef444444'}`,
                          opacity: isSettling ? 0.5 : 1,
                        }}
                      >
                        {isSettling ? '...' : isSettled ? '✓ Soldé' : 'En attente'}
                      </button>
                    ) : (
                      <span style={{ color: 'var(--muted)' }} className="text-xs">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Récap annuel */}
      <div className="grid grid-cols-2 gap-4">
        {(['mane', 'myriem'] as const).map(person => {
          const totalPaid = expenses
            .filter(e => e.year === selectedYear && e.paid_by === person)
            .reduce((s, e) => s + e.amount, 0)
          const totalDue = months.reduce((sum, month) => {
            const monthExpenses = expenses.filter(e => e.year === selectedYear && e.month === month)
            const income = incomes.find(i => i.year === selectedYear && i.month === month) ?? null
            const balance = computeMonthBalance(monthExpenses, income)
            return sum + (person === 'mane' ? balance.mane_due : balance.myriem_due)
          }, 0)

          return (
            <div
              key={person}
              className="rounded-2xl p-5"
              style={{
                background: person === 'mane' ? 'var(--accent-mane-bg)' : 'var(--accent-myriem-bg)',
                border: `1px solid ${person === 'mane' ? 'var(--accent-mane)' : 'var(--accent-myriem)'}33`,
              }}
            >
              <h3 className="text-sm font-medium mb-3" style={{ color: PERSON_COLOR[person] }}>
                {person === 'mane' ? 'Mane' : 'Myriem'} — {selectedYear}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted)' }}>Total avancé</span>
                  <span className="font-medium">{totalPaid.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted)' }}>Total dû (parts)</span>
                  <span className="font-medium">{totalDue.toFixed(2)} €</span>
                </div>
                <div
                  className="flex justify-between pt-2"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <span style={{ color: 'var(--muted)' }}>Balance</span>
                  <span
                    className="font-bold"
                    style={{ color: totalPaid - totalDue >= 0 ? '#10b981' : '#ef4444' }}
                  >
                    {totalPaid - totalDue >= 0 ? '+' : ''}{(totalPaid - totalDue).toFixed(2)} €
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
