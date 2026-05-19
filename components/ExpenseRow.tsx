'use client'

import { useState } from 'react'
import { deleteExpense, updateExpenseLabels } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { CATEGORY_COLORS, type Expense } from '@/types'

interface Props { expense: Expense }

const PERSON_COLOR = { mane: 'var(--olive-600)', myriem: 'var(--red-500)' }
const PERSON_BG = { mane: 'var(--olive-50)', myriem: 'var(--red-50)' }
const SPLIT_LABEL = { proportional: null, equal: '50/50', full: 'Remb.' }

export function ExpenseRow({ expense }: Props) {
  const { refresh } = useApp()
  const [editingLabels, setEditingLabels] = useState(false)
  const [labelsInput, setLabelsInput] = useState(expense.labels?.join(', ') ?? '')
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Supprimer cette dépense ?')) return
    setDeleting(true)
    try { await deleteExpense(expense.id); await refresh() }
    finally { setDeleting(false) }
  }

  const handleSaveLabels = async () => {
    await updateExpenseLabels(expense.id, labelsInput.split(',').map(l => l.trim()).filter(Boolean))
    await refresh()
    setEditingLabels(false)
  }

  const catColor = CATEGORY_COLORS[expense.category]
  const splitLabel = SPLIT_LABEL[expense.split_type ?? 'proportional']

  return (
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
            <span key={l} className="text-xs px-1.5 py-0.5 rounded-md bg-[var(--brown-200)] text-[var(--brown-600)]">
              {l}
            </span>
          ))}
        </div>
        {editingLabels && (
          <div className="flex gap-2 mt-1.5">
            <input
              value={labelsInput} onChange={e => setLabelsInput(e.target.value)}
              className="text-xs rounded px-2 py-1 flex-1 outline-none border border-[var(--brown-200)] bg-white"
              onKeyDown={e => { if (e.key === 'Enter') handleSaveLabels(); if (e.key === 'Escape') setEditingLabels(false) }}
              autoFocus
            />
            <button onClick={handleSaveLabels} className="text-xs px-2 py-1 rounded bg-[var(--olive-600)] text-white">OK</button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: PERSON_BG[expense.paid_by], color: PERSON_COLOR[expense.paid_by] }}>
          {expense.paid_by === 'mane' ? 'Mane' : 'Myriem'}
        </span>
        <span className="text-sm font-semibold text-[var(--brown-900)]">{expense.amount.toFixed(2)} €</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button onClick={() => setEditingLabels(e => !e)} className="p-1 rounded text-[var(--brown-400)] hover:text-[var(--brown-600)] text-xs" title="Labels">🏷</button>
          <button onClick={handleDelete} disabled={deleting} className="p-1 rounded text-[var(--red-400)] hover:text-[var(--red-600)] text-xs" title="Supprimer">✕</button>
        </div>
      </div>
    </div>
  )
}
