'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { addExpense } from '@/lib/api'
import { CATEGORIES, SPLIT_TYPES, type Category, type Person, type SplitType } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  year: number
  month: number
  onClose: () => void
}

function guessCategory(description: string): Category {
  const d = description.toLowerCase()
  if (/loyer|électr|gaz|internet|eau|charges|assurance|maison|appartement|ikea|leroy/.test(d)) return 'Maison'
  if (/voyage|vacances|hôtel|hotel|airbnb|avion|train sncf|location|camping/.test(d)) return 'Vacances'
  if (/monoprix|carrefour|lidl|aldi|leclerc|supermarché|courses|marché|franprix|picard|biocoop/.test(d)) return 'Courses'
  if (/restaurant|resto|pizza|sushi|burger|brasserie|bistro|traiteur|déjeuner|dîner/.test(d)) return 'Restau'
  if (/bar|bière|café|cocktail|apéro|boisson/.test(d)) return 'Bar'
  if (/cinéma|musée|expo|concert|théâtre|spectacle|livre|librairie|spotify|netflix|disney/.test(d)) return 'Culture'
  if (/métro|bus|uber|taxi|essence|parking|vélib|ratp/.test(d)) return 'Transport'
  if (/pharmacie|médecin|dentiste|docteur|santé|médicament|opticien/.test(d)) return 'Santé'
  if (/vêtement|habit|robe|pantalon|chaussure|zara|h&m|pull|manteau|sac/.test(d)) return 'Vêtements'
  return 'Autre'
}

const PERSON_COLOR: Record<Person, string> = {
  mane: 'var(--olive-600)',
  myriem: 'var(--red-500)',
}
const PERSON_BG: Record<Person, string> = {
  mane: 'var(--olive-50)',
  myriem: 'var(--red-50)',
}
const PERSON_BORDER: Record<Person, string> = {
  mane: 'var(--olive-200)',
  myriem: 'var(--red-200)',
}

export function AddExpenseModal({ year, month, onClose }: Props) {
  const { profile, refresh } = useApp()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('Autre')
  const [paidBy, setPaidBy] = useState<Person>(profile ?? 'mane')
  const [splitType, setSplitType] = useState<SplitType>('proportional')
  const [labels, setLabels] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoCategory, setAutoCategory] = useState(true)

  const handleDescChange = (v: string) => {
    setDescription(v)
    if (autoCategory && v.length > 2) setCategory(guessCategory(v))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description) return
    setLoading(true)
    try {
      await addExpense({
        year, month,
        amount: parseFloat(amount),
        description, category,
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
          <DialogTitle className="text-[var(--brown-900)]">Nouvelle dépense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Description */}
          <div>
            <label className="text-xs font-medium text-[var(--brown-500)] mb-1.5 block">Description</label>
            <Input
              value={description}
              onChange={e => handleDescChange(e.target.value)}
              placeholder="ex: Monoprix courses semaine"
              required autoFocus
              className="border-[var(--brown-200)]"
            />
          </div>

          {/* Montant + Catégorie */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-[var(--brown-500)] mb-1.5 block">Montant (€)</label>
              <Input
                type="number" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00" step="0.01" min="0" required
                className="border-[var(--brown-200)]"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-[var(--brown-500)] mb-1.5 flex items-center gap-1.5">
                Catégorie
                <button
                  type="button"
                  onClick={() => setAutoCategory(a => !a)}
                  className="text-xs px-1.5 py-0.5 rounded border transition-colors"
                  style={{
                    background: autoCategory ? 'var(--olive-50)' : 'transparent',
                    color: autoCategory ? 'var(--olive-600)' : 'var(--brown-400)',
                    borderColor: autoCategory ? 'var(--olive-200)' : 'var(--brown-200)',
                  }}
                >auto</button>
              </label>
              <select
                value={category}
                onChange={e => { setCategory(e.target.value as Category); setAutoCategory(false) }}
                className="w-full rounded-lg px-3 py-2 text-sm border border-[var(--brown-200)] bg-white text-[var(--brown-900)] outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Payé par */}
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

          {/* Type de partage */}
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

          {/* Labels */}
          <div>
            <label className="text-xs font-medium text-[var(--brown-500)] mb-1.5 block">
              Labels <span className="text-[var(--brown-300)]">(séparés par des virgules, optionnel)</span>
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
              {loading ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
