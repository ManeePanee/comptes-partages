'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { addExpense } from '@/lib/api'
import { CATEGORIES, type Category, type Person } from '@/types'

interface Props {
  year: number
  month: number
  onClose: () => void
}

const PERSON_COLOR: Record<Person, string> = {
  mane: 'var(--accent-mane)',
  myriem: 'var(--accent-myriem)',
}

// Auto-détection de catégorie par mots-clés
function guessCategory(description: string): Category {
  const d = description.toLowerCase()
  if (/loyer|électr|gaz|internet|eau|charges|assurance|maison|appartement|ikea|leroy/.test(d)) return 'Maison'
  if (/voyage|vacances|hôtel|hotel|airbnb|avion|train|location|camping/.test(d)) return 'Vacances'
  if (/monoprix|carrefour|lidl|aldi|leclerc|supermarché|courses|marché|franprix|picard|biocoop/.test(d)) return 'Courses'
  if (/restaurant|resto|pizza|sushi|burger|brasserie|bistro|traiteur|déjeuner|dîner/.test(d)) return 'Restau'
  if (/bar|bière|café|cocktail|apéro|boisson/.test(d)) return 'Bar'
  if (/cinéma|musée|expo|concert|théâtre|spectacle|livre|librairie|spotify|netflix|disney/.test(d)) return 'Culture'
  if (/métro|bus|uber|taxi|essence|parking|vélib|train|ratp|sncf/.test(d)) return 'Transport'
  if (/pharmacie|médecin|dentiste|docteur|santé|médicament|opticien/.test(d)) return 'Santé'
  return 'Autre'
}

export function AddExpenseModal({ year, month, onClose }: Props) {
  const { profile, refresh } = useApp()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('Autre')
  const [paidBy, setPaidBy] = useState<Person>(profile ?? 'mane')
  const [labels, setLabels] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoCategory, setAutoCategory] = useState(true)

  const handleDescChange = (v: string) => {
    setDescription(v)
    if (autoCategory && v.length > 2) {
      setCategory(guessCategory(v))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description) return
    setLoading(true)
    try {
      await addExpense({
        year,
        month,
        amount: parseFloat(amount),
        description,
        category,
        paid_by: paidBy,
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-semibold mb-5">Nouvelle dépense</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--muted)' }}>
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => handleDescChange(e.target.value)}
              placeholder="ex: Monoprix courses semaine"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
              style={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
              required
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--muted)' }}>
                Montant (€)
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
                required
              />
            </div>

            <div className="flex-1">
              <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                Catégorie
                <button
                  type="button"
                  onClick={() => setAutoCategory(a => !a)}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: autoCategory ? 'var(--accent-mane-bg)' : 'transparent',
                    color: autoCategory ? 'var(--accent-mane)' : 'var(--muted)',
                    border: '1px solid var(--border)',
                  }}
                  title="Auto-détection"
                >
                  auto
                </button>
              </label>
              <select
                value={category}
                onChange={e => { setCategory(e.target.value as Category); setAutoCategory(false) }}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--muted)' }}>
              Payé par
            </label>
            <div className="flex gap-2">
              {(['mane', 'myriem'] as Person[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPaidBy(p)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: paidBy === p ? (p === 'mane' ? 'var(--accent-mane-bg)' : 'var(--accent-myriem-bg)') : 'var(--background)',
                    border: `1px solid ${paidBy === p ? PERSON_COLOR[p] : 'var(--border)'}`,
                    color: paidBy === p ? PERSON_COLOR[p] : 'var(--muted)',
                  }}
                >
                  {p === 'mane' ? 'Mane' : 'Myriem'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--muted)' }}>
              Labels <span style={{ color: 'var(--border)' }}>(séparés par des virgules, optionnel)</span>
            </label>
            <input
              type="text"
              value={labels}
              onChange={e => setLabels(e.target.value)}
              placeholder="ex: urgent, partagé"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-opacity"
              style={{
                background: 'var(--accent-mane)',
                color: '#0f0f13',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
