'use client'

import { useState } from 'react'
import { deleteExpense } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { CATEGORY_COLORS, type Expense } from '@/types'
import { EditExpenseModal } from './EditExpenseModal'

interface Props { expense: Expense }

const PERSON_COLOR: Record<string, string> = { mane: 'var(--orange)', myriem: 'var(--blue)' }
const SPLIT_LABEL: Record<string, string | null> = { proportional: null, equal: '50/50', full: 'Remb.' }

export function ExpenseRow({ expense }: Props) {
  const { refresh } = useApp()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Supprimer cette dépense ?')) return
    setDeleting(true)
    try { await deleteExpense(expense.id); await refresh() }
    finally { setDeleting(false) }
  }

  const catColor = CATEGORY_COLORS[expense.category]
  const splitLabel = SPLIT_LABEL[expense.split_type ?? 'proportional']

  return (
    <>
      <div
        className="flex items-center gap-3 px-3 py-2.5 group transition-colors"
        style={{
          borderRadius: 'var(--radius-field)',
          background: 'rgba(255,255,255,.25)',
          border: '1px solid var(--line)',
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: catColor }}
          title={expense.category}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>
              {expense.description}
            </span>
            <span
              className="text-xs px-2 py-0.5"
              style={{
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--line)',
                color: 'var(--ink-2)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '.03em',
                textTransform: 'uppercase',
                fontSize: '10px',
              }}
            >
              {expense.category}
            </span>
            {splitLabel && (
              <span
                className="text-xs px-2 py-0.5"
                style={{
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink-2)',
                  fontSize: '11px',
                }}
              >
                {splitLabel}
              </span>
            )}
            {expense.labels?.map(l => (
              <span
                key={l}
                className="text-xs px-2 py-0.5"
                style={{ borderRadius: 'var(--radius-pill)', border: '1px solid var(--line)', color: 'var(--ink-2)', fontSize: '11px' }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-2)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: PERSON_COLOR[expense.paid_by] }} />
            {expense.paid_by === 'mane' ? 'Mane' : 'Myriem'}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
            {expense.amount.toFixed(2)} €
          </span>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-xs transition-colors"
              style={{ color: 'var(--ink-2)' }}
              title="Modifier"
            >
              ✎
            </button>
            <button
              onClick={handleDelete} disabled={deleting}
              className="p-1.5 rounded-lg text-xs transition-colors"
              style={{ color: 'var(--ink-2)' }}
              title="Supprimer"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {editing && <EditExpenseModal expense={expense} onClose={() => setEditing(false)} />}
    </>
  )
}
