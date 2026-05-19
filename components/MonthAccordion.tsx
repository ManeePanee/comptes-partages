'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { MONTH_NAMES, computeMonthBalance, type Expense, type Income, type Settlement } from '@/types'
import { ExpenseRow } from './ExpenseRow'
import { CategoryPieChart } from './CategoryPieChart'
import { AddExpenseModal } from './AddExpenseModal'
import { settleMonth, unsettleMonth } from '@/lib/api'

interface Props {
  year: number
  month: number
  expenses: Expense[]
  income: Income | null
  settlement: Settlement | null
  defaultOpen?: boolean
}

export function MonthAccordion({ year, month, expenses, income, settlement, defaultOpen = false }: Props) {
  const { refresh } = useApp()
  const [open, setOpen] = useState(defaultOpen)
  const [showAdd, setShowAdd] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [settling, setSettling] = useState(false)

  const balance = computeMonthBalance(expenses, income)
  const total = balance.total
  const isSettled = !!settlement

  const handleSettle = async () => {
    if (!balance.debtor || !balance.creditor) return
    setSettling(true)
    try {
      if (isSettled) {
        await unsettleMonth(year, month)
      } else {
        await settleMonth(year, month, balance.debt_amount, balance.debtor, balance.creditor)
      }
      await refresh()
    } finally {
      setSettling(false)
    }
  }

  const PERSON_COLOR_MAP = {
    mane: 'var(--accent-mane)',
    myriem: 'var(--accent-myriem)',
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: isSettled ? 'var(--background)' : 'var(--card)' }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] text-left"
      >
        <span
          className="text-sm font-medium"
          style={{ color: isSettled ? 'var(--muted)' : 'var(--foreground)' }}
        >
          {MONTH_NAMES[month - 1]} {year}
        </span>

        {isSettled && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: '#10b98122', color: '#10b981' }}
          >
            soldé ✓
          </span>
        )}

        <div className="ml-auto flex items-center gap-4">
          {expenses.length > 0 && (
            <>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {expenses.length} dépense{expenses.length > 1 ? 's' : ''}
              </span>
              <span className="text-sm font-semibold">{total.toFixed(2)} €</span>
            </>
          )}
          {expenses.length === 0 && (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Aucune dépense</span>
          )}
          <span
            className="text-xs transition-transform"
            style={{ color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 pb-5">
          {/* Résumé des parts */}
          {expenses.length > 0 && (
            <div
              className="flex items-center gap-3 mb-4 p-3 rounded-xl"
              style={{ background: 'var(--background)' }}
            >
              <div className="flex-1 text-xs" style={{ color: 'var(--muted)' }}>
                <div className="flex justify-between mb-1">
                  <span style={{ color: 'var(--accent-mane)' }}>Mane a avancé</span>
                  <span>{balance.mane_paid.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--accent-myriem)' }}>Myriem a avancé</span>
                  <span>{balance.myriem_paid.toFixed(2)} €</span>
                </div>
              </div>
              <div className="w-px h-8" style={{ background: 'var(--border)' }} />
              <div className="flex-1 text-xs" style={{ color: 'var(--muted)' }}>
                <div className="flex justify-between mb-1">
                  <span>Part Mane ({(balance.mane_share * 100).toFixed(0)}%)</span>
                  <span>{balance.mane_due.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span>Part Myriem ({(balance.myriem_share * 100).toFixed(0)}%)</span>
                  <span>{balance.myriem_due.toFixed(2)} €</span>
                </div>
              </div>
              <div className="w-px h-8" style={{ background: 'var(--border)' }} />
              <div className="text-xs text-right">
                {balance.debtor && balance.creditor ? (
                  <>
                    <div style={{ color: 'var(--muted)' }}>
                      <span style={{ color: PERSON_COLOR_MAP[balance.debtor] }}>
                        {balance.debtor === 'mane' ? 'Mane' : 'Myriem'}
                      </span>
                      {' doit '}
                    </div>
                    <div className="font-bold text-base" style={{ color: PERSON_COLOR_MAP[balance.creditor] }}>
                      {balance.debt_amount.toFixed(2)} €
                    </div>
                    <div style={{ color: 'var(--muted)' }}>
                      {' à '}
                      <span style={{ color: PERSON_COLOR_MAP[balance.creditor] }}>
                        {balance.creditor === 'mane' ? 'Mane' : 'Myriem'}
                      </span>
                    </div>
                  </>
                ) : (
                  <span style={{ color: '#10b981' }}>Égalité ✓</span>
                )}
              </div>
            </div>
          )}

          {/* Liste des dépenses */}
          <div className="flex flex-col gap-1.5 mb-4">
            {expenses.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>
                Aucune dépense ce mois-ci
              </p>
            ) : (
              expenses.map(e => <ExpenseRow key={e.id} expense={e} />)
            )}
          </div>

          {/* Graphique */}
          {expenses.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowChart(c => !c)}
                className="text-xs mb-3 transition-colors"
                style={{ color: 'var(--muted)' }}
              >
                {showChart ? '▲ Masquer le graphique' : '▼ Voir le graphique par catégorie'}
              </button>
              {showChart && (
                <div
                  className="p-4 rounded-xl"
                  style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
                >
                  <CategoryPieChart expenses={expenses} />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(true)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: 'var(--accent-mane-bg)',
                color: 'var(--accent-mane)',
                border: '1px solid var(--accent-mane)33',
              }}
            >
              + Ajouter une dépense
            </button>

            {expenses.length > 0 && balance.debtor && (
              <button
                onClick={handleSettle}
                disabled={settling}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: isSettled ? '#10b98122' : '#10b98133',
                  color: '#10b981',
                  border: '1px solid #10b98144',
                  opacity: settling ? 0.6 : 1,
                }}
              >
                {settling ? '...' : isSettled ? '↩ Annuler solde' : '✓ Marquer soldé'}
              </button>
            )}
          </div>
        </div>
      )}

      {showAdd && (
        <AddExpenseModal year={year} month={month} onClose={() => setShowAdd(false)} />
      )}
    </div>
  )
}
