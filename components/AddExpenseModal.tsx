'use client'

import { useRef, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { addExpense } from '@/lib/api'
import { CATEGORIES, SPLIT_TYPES, type Category, type Person, type SplitType } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { learnFromExpense, smartGuessCategory } from '@/lib/categoryRules'

interface Props {
  year: number
  month: number
  onClose: () => void
}

function hardcodedGuessCategory(description: string): Category {
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

function guessCategory(description: string): Category {
  return smartGuessCategory(description) ?? hardcodedGuessCategory(description)
}

const PERSON_COLOR: Record<Person, string> = { mane: 'var(--orange)', myriem: 'var(--blue)' }

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
  const [lastAdded, setLastAdded] = useState<string | null>(null)
  const descRef = useRef<HTMLInputElement>(null)

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
      learnFromExpense(description, category)
      await refresh()
      setLastAdded(description)
      setDescription('')
      setAmount('')
      setCategory('Autre')
      setLabels('')
      setAutoCategory(true)
      setTimeout(() => descRef.current?.focus(), 50)
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
            Nouvelle dépense
          </DialogTitle>
        </DialogHeader>

        {lastAdded && (
          <div className="flex items-center gap-2 px-3 py-2" style={{ borderRadius: 'var(--radius-field)', background: 'rgba(22,20,15,.05)', border: '1px solid var(--line)' }}>
            <span style={{ color: 'var(--ink-2)', fontSize: '12px' }}>✓</span>
            <span className="flex-1 truncate text-sm" style={{ color: 'var(--ink)' }}>{lastAdded}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>ajoutée</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="g-field">
            <label>Description</label>
            <input
              ref={descRef}
              value={description}
              onChange={e => handleDescChange(e.target.value)}
              placeholder="ex: Monoprix courses semaine"
              required autoFocus
              style={fieldStyle}
            />
          </div>

          <div className="flex gap-3">
            <div className="g-field flex-1">
              <label>Montant (€)</label>
              <input
                type="number" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00" step="0.01" min="0" required
                style={fieldStyle}
              />
            </div>
            <div className="g-field flex-1">
              <label className="flex items-center gap-1.5">
                Catégorie
                <button
                  type="button"
                  onClick={() => setAutoCategory(a => !a)}
                  style={{
                    padding: '1px 7px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--line)',
                    background: autoCategory ? 'rgba(22,20,15,.08)' : 'transparent',
                    color: autoCategory ? 'var(--ink)' : 'var(--ink-2)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >auto</button>
              </label>
              <select
                value={category}
                onChange={e => { setCategory(e.target.value as Category); setAutoCategory(false) }}
                className="g-select"
                style={{ width: '100%' }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="g-field" style={{ display: 'block', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-2)' }}>Payé par</span>
            </label>
            <div className="g-seg">
              {(['mane', 'myriem'] as Person[]).map(p => (
                <button
                  key={p} type="button"
                  onClick={() => setPaidBy(p)}
                  aria-pressed={paidBy === p}
                  style={{ color: paidBy === p ? undefined : PERSON_COLOR[p] }}
                >
                  {p === 'mane' ? 'Mane' : 'Myriem'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--ink-2)', display: 'block', marginBottom: '6px' }}>Partage</label>
            <div className="flex flex-col gap-1.5">
              {SPLIT_TYPES.map(st => (
                <button
                  key={st.value} type="button"
                  onClick={() => setSplitType(st.value as SplitType)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors"
                  style={{
                    borderRadius: 'var(--radius-field)',
                    border: '1px solid var(--line)',
                    background: splitType === st.value ? 'rgba(22,20,15,.06)' : 'transparent',
                    color: 'var(--ink)',
                  }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={{ borderColor: splitType === st.value ? 'var(--ink)' : 'var(--ink-2)' }}
                  >
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
            <label>Labels <span style={{ color: 'var(--ink-2)', fontWeight: 400 }}>(séparés par des virgules, optionnel)</span></label>
            <input
              value={labels} onChange={e => setLabels(e.target.value)}
              placeholder="ex: urgent, partagé"
              style={fieldStyle}
            />
          </div>

          <div className="flex gap-3 mt-1">
            <button type="button" onClick={onClose} className="flex-1 g-btn g-btn--ghost" style={{ fontSize: '14px' }}>
              Fermer
            </button>
            <button type="submit" disabled={loading} className="flex-1 g-btn" style={{ fontSize: '14px' }}>
              {loading ? '…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
