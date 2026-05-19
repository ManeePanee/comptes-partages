'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { MONTH_NAMES, computeMonthBalance, type Expense, type Income, type Settlement } from '@/types'
import { ExpenseRow } from './ExpenseRow'
import { CategoryPieChart } from './CategoryPieChart'
import { AddExpenseModal } from './AddExpenseModal'
import { settleMonth, unsettleMonth } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface Props {
  year: number
  month: number
  expenses: Expense[]
  income: Income | null
  settlement: Settlement | null
  defaultOpen?: boolean
}

const PERSON_COLOR = { mane: 'var(--olive-600)', myriem: 'var(--red-500)' }

export function MonthAccordion({ year, month, expenses, income, settlement, defaultOpen = false }: Props) {
  const { refresh } = useApp()
  const [open, setOpen] = useState(defaultOpen)
  const [showAdd, setShowAdd] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [settling, setSettling] = useState(false)

  const balance = computeMonthBalance(expenses, income)
  const isSettled = !!settlement

  const handleSettle = async () => {
    if (!balance.debtor || !balance.creditor) return
    setSettling(true)
    try {
      if (isSettled) await unsettleMonth(year, month)
      else await settleMonth(year, month, balance.debt_amount, balance.debtor, balance.creditor)
      await refresh()
    } finally { setSettling(false) }
  }

  return (
    <div className="rounded-2xl overflow-hidden border bg-white transition-colors"
      style={{ borderColor: isSettled ? 'var(--brown-100)' : 'var(--brown-200)' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--brown-50)] transition-colors text-left"
      >
        <span className="text-sm font-semibold text-[var(--brown-900)]">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        {isSettled && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--olive-50)] text-[var(--olive-600)] border border-[var(--olive-200)]">
            soldé ✓
          </span>
        )}
        <div className="ml-auto flex items-center gap-4">
          {expenses.length > 0 ? (
            <>
              <span className="text-xs text-[var(--brown-400)]">{expenses.length} dépense{expenses.length > 1 ? 's' : ''}</span>
              <span className="text-sm font-bold text-[var(--brown-900)]">{balance.total.toFixed(2)} €</span>
            </>
          ) : (
            <span className="text-xs text-[var(--brown-300)]">Aucune dépense</span>
          )}
          <span className="text-xs text-[var(--brown-400)] transition-transform inline-block" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5">
          {/* Résumé */}
          {expenses.length > 0 && (
            <div className="flex items-stretch gap-3 mb-4 p-4 rounded-xl bg-[var(--brown-50)] border border-[var(--brown-100)]">
              <div className="flex-1 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--olive-600)' }}>Mane a avancé</span>
                  <span className="font-medium text-[var(--brown-900)]">{balance.mane_paid.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--red-500)' }}>Myriem a avancé</span>
                  <span className="font-medium text-[var(--brown-900)]">{balance.myriem_paid.toFixed(2)} €</span>
                </div>
              </div>

              <div className="w-px bg-[var(--brown-200)]" />

              <div className="flex-1 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[var(--brown-500)]">Part Mane ({(balance.mane_share * 100).toFixed(0)}%)</span>
                  <span className="font-medium text-[var(--brown-900)]">{balance.mane_due.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--brown-500)]">Part Myriem ({(balance.myriem_share * 100).toFixed(0)}%)</span>
                  <span className="font-medium text-[var(--brown-900)]">{balance.myriem_due.toFixed(2)} €</span>
                </div>
              </div>

              <div className="w-px bg-[var(--brown-200)]" />

              <div className="text-xs text-right flex flex-col justify-center">
                {balance.debtor && balance.creditor ? (
                  <>
                    <span className="text-[var(--brown-500)]">
                      <span style={{ color: PERSON_COLOR[balance.debtor] }}>{balance.debtor === 'mane' ? 'Mane' : 'Myriem'}</span>
                      {' doit '}
                    </span>
                    <span className="font-bold text-lg text-[var(--brown-900)]">{balance.debt_amount.toFixed(2)} €</span>
                    <span className="text-[var(--brown-500)]">
                      {' à '}
                      <span style={{ color: PERSON_COLOR[balance.creditor] }}>{balance.creditor === 'mane' ? 'Mane' : 'Myriem'}</span>
                    </span>
                  </>
                ) : (
                  <span className="text-[var(--olive-600)] font-medium">Égalité ✓</span>
                )}
              </div>
            </div>
          )}

          {/* Liste groupée par personne */}
          <div className="flex flex-col gap-3 mb-4">
            {expenses.length === 0 ? (
              <p className="text-sm text-center py-6 text-[var(--brown-400)]">Aucune dépense ce mois-ci</p>
            ) : (
              (['mane', 'myriem'] as const).map(person => {
                const personExpenses = expenses.filter(e => e.paid_by === person)
                if (personExpenses.length === 0) return null
                const personTotal = personExpenses.reduce((s, e) => s + e.amount, 0)
                const color = person === 'mane' ? 'var(--olive-600)' : 'var(--red-500)'
                const bg = person === 'mane' ? 'var(--olive-50)' : 'var(--red-50)'
                const border = person === 'mane' ? 'var(--olive-200)' : 'var(--red-200)'
                return (
                  <div key={person} className="rounded-xl overflow-hidden border" style={{ borderColor: border }}>
                    <div className="flex items-center justify-between px-3 py-2" style={{ background: bg }}>
                      <span className="text-xs font-semibold" style={{ color }}>
                        {person === 'mane' ? '🌿 Mane' : '🌸 Myriem'}
                      </span>
                      <span className="text-xs font-semibold" style={{ color }}>
                        {personTotal.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 p-1.5">
                      {personExpenses.map(e => <ExpenseRow key={e.id} expense={e} />)}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Graphique */}
          {expenses.length > 0 && (
            <div className="mb-4">
              <button onClick={() => setShowChart(c => !c)} className="text-xs text-[var(--brown-400)] hover:text-[var(--brown-600)] mb-3 transition-colors">
                {showChart ? '▲ Masquer le graphique' : '▼ Voir par catégorie'}
              </button>
              {showChart && (
                <div className="p-4 rounded-xl bg-[var(--brown-50)] border border-[var(--brown-100)]">
                  <CategoryPieChart expenses={expenses} />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdd(true)}
              className="flex-1 border-[var(--olive-200)] text-[var(--olive-600)] hover:bg-[var(--olive-50)]"
            >
              + Ajouter une dépense
            </Button>
            {expenses.length > 0 && balance.debtor && (
              <Button
                onClick={handleSettle} disabled={settling} variant="outline"
                className="px-4"
                style={{
                  borderColor: isSettled ? 'var(--olive-200)' : 'var(--brown-200)',
                  color: isSettled ? 'var(--olive-600)' : 'var(--brown-500)',
                }}
              >
                {settling ? '...' : isSettled ? '↩ Annuler' : '✓ Soldé'}
              </Button>
            )}
          </div>
        </div>
      )}

      {showAdd && <AddExpenseModal year={year} month={month} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
