'use client'

import { useState } from 'react'
import { deleteExpense, updateExpenseLabels } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { CATEGORY_COLORS, type Expense } from '@/types'

interface Props {
  expense: Expense
}

const PERSON_COLOR = {
  mane: 'var(--accent-mane)',
  myriem: 'var(--accent-myriem)',
}

export function ExpenseRow({ expense }: Props) {
  const { refresh } = useApp()
  const [editingLabels, setEditingLabels] = useState(false)
  const [labelsInput, setLabelsInput] = useState(expense.labels?.join(', ') ?? '')
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Supprimer cette dépense ?')) return
    setDeleting(true)
    try {
      await deleteExpense(expense.id)
      await refresh()
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveLabels = async () => {
    const labels = labelsInput.split(',').map(l => l.trim()).filter(Boolean)
    await updateExpenseLabels(expense.id, labels)
    await refresh()
    setEditingLabels(false)
  }

  const color = CATEGORY_COLORS[expense.category]

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group"
      style={{ background: 'var(--card)' }}
    >
      {/* Indicateur catégorie */}
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color }}
        title={expense.category}
      />

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{expense.description}</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-md"
            style={{ background: `${color}22`, color }}
          >
            {expense.category}
          </span>
          {expense.labels?.map(l => (
            <span
              key={l}
              className="text-xs px-1.5 py-0.5 rounded-md"
              style={{ background: 'var(--border)', color: 'var(--muted)' }}
            >
              {l}
            </span>
          ))}
        </div>
        {editingLabels && (
          <div className="flex gap-2 mt-1.5">
            <input
              value={labelsInput}
              onChange={e => setLabelsInput(e.target.value)}
              className="text-xs rounded px-2 py-1 flex-1 outline-none"
              style={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveLabels(); if (e.key === 'Escape') setEditingLabels(false) }}
              autoFocus
            />
            <button onClick={handleSaveLabels} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent-mane)', color: '#0f0f13' }}>
              OK
            </button>
          </div>
        )}
      </div>

      {/* Montant + qui */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{
            background: expense.paid_by === 'mane' ? 'var(--accent-mane-bg)' : 'var(--accent-myriem-bg)',
            color: PERSON_COLOR[expense.paid_by],
          }}
        >
          {expense.paid_by === 'mane' ? 'Mane' : 'Myriem'}
        </span>
        <span className="text-sm font-semibold">{expense.amount.toFixed(2)} €</span>

        {/* Actions (visibles au hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={() => setEditingLabels(e => !e)}
            className="p-1.5 rounded-lg text-xs transition-colors"
            style={{ color: 'var(--muted)' }}
            title="Labels"
          >
            🏷
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-xs transition-colors"
            style={{ color: '#ef4444' }}
            title="Supprimer"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
