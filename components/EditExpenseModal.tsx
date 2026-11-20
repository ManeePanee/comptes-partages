'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { updateExpense } from '@/lib/api'
import { CATEGORIES, SPLIT_TYPES, type Category, type Person, type SplitType, type Expense } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Props {
  expense: Expense
  onClose: () => void
}

const PERSON_COLOR: Record<Person, string> = { mane: 'var(--orange)', myriem: 'var(--blue)' }

export function EditExpenseModal({ expense, onClose }: Props) {
  const { refresh } = useApp()
  const [description, setDescription] = useState(expense.description)
  const [amount, setAmount] = useState(String(expense.amount))
  const [category, setCategory] = useState<Category>(expense.category)
  const [paidBy, setPaidBy] = useState<Person>(expense.paid_by)
  const [splitType, setSplitType] = useState<SplitType>(expense.split_type ?? 'proportional')
  const [labels, setLabels] = useState(expense.labels?.join(', ') ?? '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description) return
    setLoading(true)
    try {
      await updateExpense(expense.id, {
        description, amount: parseFloat(amount), category,
        paid_by: paidBy, split_type: splitType,
        labels: labels ? labels.split(',').map(l => l.trim()).filter(Boolean) : [],
      })
      await refresh()
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fieldStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 'var(--radius-field)',
    border: '1px solid var(--line)',
    background: 'rgba(255,255,255,.35)',
    color: 'var(--ink)',
    font: 'inherit',
    fontSize: '14px',
    outline: 'none',
  } as const

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius-card)' }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 400, color: 'var(--ink)' }}>
            Modifier la dépense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="g-field">
            <label>Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} required autoFocus style={fieldStyle} />
          </div>

          <div className="flex gap-3">
            <div className="g-field flex-1">
              <label>Montant (€)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} step="0.01" min="0" required style={fieldStyle} />
            </div>
            <div className="g-field flex-1">
              <label>Catégorie</label>
              <select value={category} onChange={e => setCategory(e.target.value as Category)} className="g-select" style={{ width: '100%' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--ink-2)', display: 'block', marginBottom: '6px' }}>Payé par</label>
            <div className="g-seg">
              {(['mane', 'myriem'] as Person[]).map(p => (
                <button key={p} type="button" onClick={() => setPaidBy(p)} aria-pressed={paidBy === p}
                  style={{ color: paidBy === p ? undefined : PERSON_COLOR[p] }}>
                  {p === 'mane' ? 'Mane' : 'Myriem'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--ink-2)', display: 'block', marginBottom: '6px' }}>Partage</label>
            <div className="flex flex-col gap-1.5">
              {SPLIT_TYPES.map(st => (
                <button key={st.value} type="button" onClick={() => setSplitType(st.value as SplitType)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors"
                  style={{
                    borderRadius: 'var(--radius-field)',
                    border: '1px solid var(--line)',
                    background: splitType === st.value ? 'rgba(22,20,15,.06)' : 'transparent',
                    color: 'var(--ink)',
                  }}
                >
                  <span className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={{ borderColor: splitType === st.value ? 'var(--ink)' : 'var(--ink-2)' }}>
                    {splitType === st.value && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ink)' }} />}
                  </span>
                  <div>
                    <div className="font-medium">{st.label}</div>
                    <div className="text-xs" style={{ color: 'var(--ink-2)' }}>{st.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="g-field">
            <label>Labels <span style={{ color: 'var(--ink-2)', fontWeight: 400 }}>(séparés par des virgules)</span></label>
            <input value={labels} onChange={e => setLabels(e.target.value)} placeholder="ex: urgent, partagé" style={fieldStyle} />
          </div>

          <div className="flex gap-3 mt-1">
            <button type="button" onClick={onClose} className="flex-1 g-btn g-btn--ghost" style={{ fontSize: '14px' }}>Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 g-btn" style={{ fontSize: '14px' }}>
              {loading ? '…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
