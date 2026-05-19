'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { updateExpense } from '@/lib/api'
import { CATEGORIES, SPLIT_TYPES, type Category, type Person, type SplitType, type Expense } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  expense: Expense
  onClose: () => void
}

const PERSON_COLOR: Record<Person, string> = { mane: 'var(--olive-600)', myriem: 'var(--red-500)' }
const PERSON_BG: Record<Person, string> = { mane: 'var(--olive-50)', myriem: 'var(--red-50)' }
const PERSON_BORDER: Record<Person, string> = { mane: 'var(--olive-200)', myriem: 'var(--red-200)' }

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
        description,
        amount: parseFloat(amount),
        category,
        paid_by: paidBy,
        split_type: splitType,
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-[var(--brown-900)]">Modifier la dépense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-[var(--brown-500)] mb-1.5 block">Description</label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              required autoFocus
              className="border-[var(--brown-200)]"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-[var(--brown-500)] mb-1.5 block">Montant (€)</label>
              <Input
                type="number" value={amount}
                onChange={e => setAmount(e.target.value)}
                step="0.01" min="0" required
                className="border-[var(--brown-200)]"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-[var(--brown-500)] mb-1.5 block">Catégorie</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="h-8 w-full rounded-lg border border-[var(--brown-200)] bg-white text-[var(--brown-900)] px-2.5 pr-8 text-sm outline-none appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ac8b7c' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--brown-500)] mb-1.5 block">Payé par</label>
            <div className="flex gap-2">
              {(['mane', 'myriem'] as Person[]).map(p => (
                <button
                  key={p} type="button" onClick={() => setPaidBy(p)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all border"
                  style={{
                    background: paidBy === p ? PERSON_BG[p] : 'transparent',
                    borderColor: paidBy === p ? PERSON_BORDER[p] : 'var(--brown-200)',
                    color: paidBy === p ? PERSON_COLOR[p] : 'var(--brown-500)',
                  }}
                >
                  {p === 'mane' ? 'Mane' : 'Myriem'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--brown-500)] mb-1.5 block">Partage</label>
            <div className="flex flex-col gap-1.5">
              {SPLIT_TYPES.map(st => (
                <button
                  key={st.value} type="button"
                  onClick={() => setSplitType(st.value as SplitType)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border text-left"
                  style={{
                    background: splitType === st.value ? 'var(--olive-50)' : 'transparent',
                    borderColor: splitType === st.value ? 'var(--olive-200)' : 'var(--brown-200)',
                    color: splitType === st.value ? 'var(--olive-700)' : 'var(--brown-700)',
                  }}
                >
                  <span className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={{ borderColor: splitType === st.value ? 'var(--olive-600)' : 'var(--brown-300)' }}>
                    {splitType === st.value && <span className="w-1.5 h-1.5 rounded-full bg-[var(--olive-600)]" />}
                  </span>
                  <div>
                    <div className="font-medium">{st.label}</div>
                    <div className="text-xs text-[var(--brown-400)]">{st.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--brown-500)] mb-1.5 block">
              Labels <span className="text-[var(--brown-300)]">(séparés par des virgules)</span>
            </label>
            <Input
              value={labels} onChange={e => setLabels(e.target.value)}
              placeholder="ex: urgent, partagé"
              className="border-[var(--brown-200)]"
            />
          </div>

          <div className="flex gap-3 mt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-[var(--brown-200)] text-[var(--brown-500)]">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-[var(--olive-600)] hover:bg-[var(--olive-700)] text-white">
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
