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

  const PERSON_COLOR: Record<string, string> = { mane: 'var(--orange)', myriem: 'var(--blue)' }

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
    return (
      <div className="flex items-center justify-center h-40">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>Chargement…</span>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 400, color: 'var(--ink)' }}>Bilan</h1>
          {pendingTotal > 0.01 && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--ink-2)', marginTop: '4px' }}>
              En attente : <span style={{ color: 'var(--alert)', fontWeight: 600 }}>{pendingTotal.toFixed(2)} €</span>
            </p>
          )}
        </div>
        <div className="flex gap-1.5">
          {years.map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={selectedYear === y ? 'g-chip g-chip--active' : 'g-chip'}
              aria-pressed={selectedYear === y}
            >{y}</button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden mb-6" style={{ borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', background: 'rgba(255,255,255,.45)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)', background: 'rgba(22,20,15,.04)' }}>
              <th className="text-left px-5 py-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)', fontWeight: 400 }}>Mois</th>
              <th className="text-right px-5 py-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--orange)', fontWeight: 400 }}>Mane avancé</th>
              <th className="text-right px-5 py-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--blue)', fontWeight: 400 }}>Myriem avancé</th>
              <th className="text-right px-5 py-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)', fontWeight: 400 }}>Total</th>
              <th className="text-center px-5 py-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)', fontWeight: 400 }}>Remboursement dû</th>
              <th className="text-center px-5 py-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)', fontWeight: 400 }}>Statut</th>
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
                <tr key={month} style={{
                  borderBottom: '1px solid var(--line)',
                  background: isSettled ? 'rgba(22,20,15,.03)' : 'transparent',
                  opacity: isSettled ? 0.75 : 1,
                }}>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--ink)', fontWeight: 500 }}>{MONTH_NAMES[month - 1]}</td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: 'var(--orange)', fontVariantNumeric: 'tabular-nums' }}>
                    {monthExpenses.length > 0 ? `${balance.mane_paid.toFixed(2)} €` : <span style={{ color: 'var(--ink-2)', opacity: .4 }}>—</span>}
                  </td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: 'var(--blue)', fontVariantNumeric: 'tabular-nums' }}>
                    {monthExpenses.length > 0 ? `${balance.myriem_paid.toFixed(2)} €` : <span style={{ color: 'var(--ink-2)', opacity: .4 }}>—</span>}
                  </td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: 'var(--ink)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                    {monthExpenses.length > 0 ? `${balance.total.toFixed(2)} €` : <span style={{ color: 'var(--ink-2)', opacity: .4 }}>—</span>}
                  </td>
                  <td className="px-5 py-3 text-center text-sm">
                    {balance.debtor && balance.creditor ? (
                      <span>
                        <span style={{ color: PERSON_COLOR[balance.debtor] }}>{balance.debtor === 'mane' ? 'Mane' : 'Myriem'}</span>
                        <span style={{ color: 'var(--ink-2)' }}>{' → '}</span>
                        <span style={{ color: PERSON_COLOR[balance.creditor] }}>{balance.creditor === 'mane' ? 'Mane' : 'Myriem'}</span>
                        <span style={{ color: 'var(--ink)', fontWeight: 600, marginLeft: '8px', fontVariantNumeric: 'tabular-nums' }}>{balance.debt_amount.toFixed(2)} €</span>
                      </span>
                    ) : monthExpenses.length > 0 ? (
                      <span style={{ color: 'var(--orange)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.04em', textTransform: 'uppercase' }}>Égalité</span>
                    ) : <span style={{ color: 'var(--ink-2)', opacity: .4 }}>—</span>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {monthExpenses.length > 0 && balance.debtor ? (
                      <button
                        onClick={() => handleToggleSettle(selectedYear, month)}
                        disabled={settling === key}
                        style={{
                          borderRadius: 'var(--radius-pill)',
                          border: '1px solid var(--line)',
                          background: isSettled ? 'rgba(22,20,15,.08)' : 'transparent',
                          color: isSettled ? 'var(--ink)' : 'var(--ink-2)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          letterSpacing: '.06em',
                          textTransform: 'uppercase',
                          padding: '5px 11px',
                          cursor: 'pointer',
                        }}
                      >
                        {settling === key ? '…' : isSettled ? '✓ Soldé' : 'En attente'}
                      </button>
                    ) : <span style={{ color: 'var(--ink-2)', opacity: .4, fontSize: '12px' }}>—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {expenses.filter(e => e.year === selectedYear).length > 0 && (
        <div className="p-5 mb-6" style={{ borderRadius: 'var(--radius-card)', background: 'rgba(255,255,255,.45)', border: '1px solid var(--line)' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>
              Dépenses par catégorie
            </h2>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={chartMonth}
                onChange={e => setChartMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="g-select"
                style={{ padding: '5px 32px 5px 10px', fontSize: '12px' }}
              >
                <option value="all">Tous les mois</option>
                {months.map(m => (
                  <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>
                ))}
              </select>

              <div className="g-seg">
                {(['all', 'mane', 'myriem'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setChartPerson(p)}
                    aria-pressed={chartPerson === p}
                    style={{
                      color: chartPerson !== p
                        ? p === 'mane' ? 'var(--orange)' : p === 'myriem' ? 'var(--blue)' : 'var(--ink-2)'
                        : undefined,
                      fontSize: '12px',
                      padding: '5px 12px',
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
          const accent = person === 'mane' ? 'var(--orange)' : 'var(--blue)'
          const accentBg = person === 'mane' ? 'rgba(255,90,31,.07)' : 'rgba(36,64,216,.07)'
          const accentLine = person === 'mane' ? 'rgba(255,90,31,.2)' : 'rgba(36,64,216,.18)'

          return (
            <div key={person} className="p-5" style={{ borderRadius: 'var(--radius-card)', background: accentBg, border: `1px solid ${accentLine}` }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 400, color: accent, marginBottom: '14px' }}>
                {person === 'mane' ? 'Mane' : 'Myriem'} — {selectedYear}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--ink-2)' }}>Total avancé</span>
                  <span style={{ color: 'var(--ink)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{totalPaid.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--ink-2)' }}>Total dû (parts)</span>
                  <span style={{ color: 'var(--ink)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{totalDue.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${accentLine}` }}>
                  <span style={{ color: 'var(--ink-2)' }}>Balance</span>
                  <span style={{ color: diff >= 0 ? 'var(--orange)' : 'var(--blue)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
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
