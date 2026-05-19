'use client'

import { useState } from 'react'
import { deleteExpense } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { CATEGORY_COLORS, type Expense } from '@/types'
import { EditExpenseModal } from './EditExpenseModal'

interface Props { expense: Expense }

const PERSON_COLOR = { mane: 'var(--olive-600)', myriem: 'var(--red-500)' }
const PERSON_BG = { mane: 'var(--olive-50)', myriem: 'var(--red-50)' }
const SPLIT_LABEL = { proportional: null, equal: '50/50', full: 'Remb.' }

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
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--brown-50)] border border-[var(--brown-100)] group hover:border-[var(--brown-200)] transition-colors">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: catColor }} title={expense.category} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-[var(--brown-900)] truncate">{expense.description}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: `${catColor}18`, color: catColor }}>
              {expense.category}
            </span>
            {splitLabel && (
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-[var(--brown-100)] text-[var(--brown-500)]">
                {splitLabel}
              </span>
            )}
            {expense.labels?.map(l => (
              <span key={l} className="text-xs px-1.5 py-0.5 rounded-md bg-[var(--brown-200)] text-[var(--brown-600)]">{l}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ background: PERSON_BG[expense.paid_by], color: PERSON_COLOR[expense.paid_by] }}>
            {expense.paid_by === 'mane' ? 'Mane' : 'Myriem'}
          </span>
          <span className="text-sm font-semibold text-[var(--brown-900)]">{expense.amount.toFixed(2)} €</span>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-xs text-[var(--brown-400)] hover:text-[var(--olive-600)] transition-colors"
              title="Modifier"
            >
              ✎
            </button>
            <button
              onClick={handleDelete} disabled={deleting}
              className="p-1.5 rounded-lg text-xs text-[var(--brown-300)] hover:text-[var(--red-500)] transition-colors"
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
