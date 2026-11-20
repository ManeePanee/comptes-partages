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

const PERSON_COLOR: Record<string, string> = { mane: 'var(--orange)', myriem: 'var(--blue)' }
const PERSON_BG: Record<string, string> = { mane: 'rgba(255,90,31,.07)', myriem: 'rgba(36,64,216,.07)' }
const PERSON_BORDER: Record<string, string> = { mane: 'rgba(255,90,31,.22)', myriem: 'rgba(36,64,216,.18)' }

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
    <div
      className="overflow-hidden transition-all"
      style={{
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--line)',
        background: isSettled ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.45)',
        opacity: isSettled ? 0.8 : 1,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-black/[.03] transition-colors text-left"
      >
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--ink)', fontStyle: open ? 'italic' : 'normal' }}>
          {MONTH_NAMES[month - 1]} {year}
        </span>
        {isSettled && (
          <span
            className="text-xs px-2.5 py-0.5"
            style={{
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--line)',
              color: 'var(--ink-2)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              fontSize: '10px',
            }}
          >
            Soldé ✓
          </span>
        )}
        <div className="ml-auto flex items-center gap-4">
          {expenses.length > 0 ? (
            <>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>
                {expenses.length} dépense{expenses.length > 1 ? 's' : ''}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                {balance.total.toFixed(2)} €
              </span>
            </>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--ink-2)' }}>Aucune dépense</span>
          )}
          <span style={{ fontSize: '11px', color: 'var(--ink-2)', display: 'inline-block', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5">
          {/* Résumé balance */}
          {expenses.length > 0 && (
            <div
              className="flex items-stretch gap-3 mb-4 p-4"
              style={{ borderRadius: 'var(--radius-field)', background: 'rgba(255,255,255,.35)', border: '1px solid var(--line)' }}
            >
              <div className="flex-1 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--orange)' }}>Mane avancé</span>
                  <span className="font-medium" style={{ color: 'var(--ink)' }}>{balance.mane_paid.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--blue)' }}>Myriem avancé</span>
                  <span className="font-medium" style={{ color: 'var(--ink)' }}>{balance.myriem_paid.toFixed(2)} €</span>
                </div>
              </div>

              <div className="w-px" style={{ background: 'var(--line)' }} />

              <div className="flex-1 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--ink-2)' }}>Part Mane ({(balance.mane_share * 100).toFixed(0)}%)</span>
                  <span className="font-medium" style={{ color: 'var(--ink)' }}>{balance.mane_due.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--ink-2)' }}>Part Myriem ({(balance.myriem_share * 100).toFixed(0)}%)</span>
                  <span className="font-medium" style={{ color: 'var(--ink)' }}>{balance.myriem_due.toFixed(2)} €</span>
                </div>
              </div>

              <div className="w-px" style={{ background: 'var(--line)' }} />

              <div className="text-xs text-right flex flex-col justify-center">
                {balance.debtor && balance.creditor ? (
                  <>
                    <span style={{ color: 'var(--ink-2)', fontSize: '11px' }}>
                      <span style={{ color: PERSON_COLOR[balance.debtor] }}>{balance.debtor === 'mane' ? 'Mane' : 'Myriem'}</span>
                      {' doit '}
                    </span>
                    <span className="font-bold text-lg" style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                      {balance.debt_amount.toFixed(2)} €
                    </span>
                    <span style={{ color: 'var(--ink-2)', fontSize: '11px' }}>
                      {' à '}
                      <span style={{ color: PERSON_COLOR[balance.creditor] }}>{balance.creditor === 'mane' ? 'Mane' : 'Myriem'}</span>
                    </span>
                  </>
                ) : (
                  <span style={{ color: 'var(--ink-2)', fontSize: '11px' }}>Égalité ✓</span>
                )}
              </div>
            </div>
          )}

          {/* Liste groupée par personne */}
          <div className="flex flex-col gap-3 mb-4">
            {expenses.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--ink-2)' }}>Aucune dépense ce mois-ci</p>
            ) : (
              (['mane', 'myriem'] as const).map(person => {
                const personExpenses = expenses.filter(e => e.paid_by === person)
                if (personExpenses.length === 0) return null
                const personTotal = personExpenses.reduce((s, e) => s + e.amount, 0)
                return (
                  <div
                    key={person}
                    className="overflow-hidden"
                    style={{
                      borderRadius: 'var(--radius-field)',
                      border: `1px solid ${PERSON_BORDER[person]}`,
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-3 py-2"
                      style={{ background: PERSON_BG[person] }}
                    >
                      <span className="text-xs font-medium" style={{ color: PERSON_COLOR[person], fontVariantNumeric: 'tabular-nums' }}>
                        {person === 'mane' ? 'Mane' : 'Myriem'}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: 'var(--ink)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          letterSpacing: '.02em',
                        }}
                      >
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
              <button
                onClick={() => setShowChart(c => !c)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)', marginBottom: '10px' }}
                className="transition-colors hover:text-[var(--ink)]"
              >
                {showChart ? '▲ Masquer' : '▼ Par catégorie'}
              </button>
              {showChart && (
                <div className="p-4" style={{ borderRadius: 'var(--radius-field)', background: 'rgba(255,255,255,.35)', border: '1px solid var(--line)' }}>
                  <CategoryPieChart expenses={expenses} />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(true)}
              className="flex-1 g-btn--ghost g-btn text-sm"
              style={{ fontSize: '13px' }}
            >
              + Ajouter une dépense
            </button>
            {expenses.length > 0 && balance.debtor && (
              <button
                onClick={handleSettle}
                disabled={settling}
                className="g-btn--ghost g-btn px-5"
                style={{
                  fontSize: '13px',
                  color: isSettled ? 'var(--ink-2)' : 'var(--ink)',
                }}
              >
                {settling ? '…' : isSettled ? '↩ Annuler' : '✓ Soldé'}
              </button>
            )}
          </div>
        </div>
      )}

      {showAdd && <AddExpenseModal year={year} month={month} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
