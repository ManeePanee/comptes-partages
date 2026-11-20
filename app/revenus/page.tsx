'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { upsertIncome, deleteIncome } from '@/lib/api'
import { MONTH_NAMES, computeShares } from '@/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Un mois est verrouillé si son dernier jour date de plus de 30 jours
function isMonthLocked(year: number, month: number): boolean {
  const lastDay = new Date(year, month, 0) // dernier jour du mois
  const diffDays = (Date.now() - lastDay.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > 30
}

export default function RevenusPage() {
  const { incomes, loading, refresh } = useApp()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [editingMonth, setEditingMonth] = useState<number | null>(null)
  const [maneInput, setManeInput] = useState('')
  const [myriemInput, setMyriemInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState<number | null>(null)

  const years = useMemo(() => {
    const set = new Set<number>([currentYear])
    incomes.forEach(i => set.add(i.year))
    return Array.from(set).sort((a, b) => b - a)
  }, [incomes, currentYear])

  const yearIncomes = useMemo(() => incomes.filter(i => i.year === selectedYear), [incomes, selectedYear])
  const months = Array.from({ length: selectedYear === currentYear ? currentMonth : 12 }, (_, i) => i + 1).reverse()

  const openEdit = (month: number) => {
    const inc = yearIncomes.find(i => i.month === month)
    setManeInput(inc ? String(inc.mane_income) : '')
    setMyriemInput(inc ? String(inc.myriem_income) : '')
    setEditingMonth(month)
  }

  const handleSave = async () => {
    if (editingMonth === null) return
    setSaving(true)
    try {
      await upsertIncome(selectedYear, editingMonth, parseFloat(maneInput) || 0, parseFloat(myriemInput) || 0)
      await refresh()
      setEditingMonth(null)
    } finally { setSaving(false) }
  }

  const handleReset = async (month: number) => {
    if (!confirm(`Remettre les revenus de ${MONTH_NAMES[month - 1]} aux valeurs par défaut (62% / 38%) ?`)) return
    setResetting(month)
    try {
      await deleteIncome(selectedYear, month)
      await refresh()
    } finally { setResetting(null) }
  }

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const inc = yearIncomes.find(i => i.month === m)
      return {
        name: MONTH_NAMES[i].slice(0, 3),
        mane: inc?.mane_income ?? null,
        myriem: inc?.myriem_income ?? null,
        total: inc ? inc.mane_income + inc.myriem_income : null,
      }
    }).filter(d => d.mane !== null || d.myriem !== null)
  }, [yearIncomes])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>Chargement…</span>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 400, color: 'var(--ink)' }}>Revenus</h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--ink-2)', marginTop: '4px' }}>
            Verrouillé après 30 jours
          </p>
        </div>
        <div className="flex gap-1.5">
          {years.map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={selectedYear === y ? 'g-chip g-chip--active' : 'g-chip'}
              aria-pressed={selectedYear === y}
            >{y}</button>
          ))}
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="p-5 mb-6" style={{ borderRadius: 'var(--radius-card)', background: 'rgba(255,255,255,.45)', border: '1px solid var(--line)' }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)', marginBottom: '16px' }}>
            Évolution {selectedYear}
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,20,15,.08)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5e584d' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#5e584d' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
              <Tooltip
                contentStyle={{ background: '#ece8e1', border: '1px solid rgba(22,20,15,.12)', borderRadius: '12px', fontSize: '12px' }}
                formatter={(v) => [`${Number(v).toFixed(0)} €`]}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="mane" name="Mane" stroke="#ff5a1f" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="myriem" name="Myriem" stroke="#2440d8" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="total" name="Total" stroke="rgba(22,20,15,.35)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="overflow-hidden" style={{ borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', background: 'rgba(255,255,255,.45)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)', background: 'rgba(22,20,15,.04)' }}>
              <th className="text-left px-5 py-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)', fontWeight: 400 }}>Mois</th>
              <th className="text-right px-5 py-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--orange)', fontWeight: 400 }}>Mane</th>
              <th className="text-right px-5 py-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--blue)', fontWeight: 400 }}>Myriem</th>
              <th className="text-right px-5 py-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)', fontWeight: 400 }}>Total</th>
              <th className="text-right px-5 py-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)', fontWeight: 400 }}>Parts</th>
              <th className="px-5 py-3 w-36" />
            </tr>
          </thead>
          <tbody>
            {months.map(month => {
              const income = yearIncomes.find(i => i.month === month)
              const shares = computeShares(income ?? null)
              const isEditing = editingMonth === month
              const locked = isMonthLocked(selectedYear, month)
              const total = income ? income.mane_income + income.myriem_income : null

              return (
                <tr key={month} style={{
                  borderBottom: '1px solid var(--line)',
                  background: isEditing ? 'rgba(255,90,31,.05)' : locked ? 'rgba(22,20,15,.03)' : 'transparent',
                }}>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--ink)', fontWeight: 500 }}>
                    <span>{MONTH_NAMES[month - 1]}</span>
                    {locked && <span className="ml-2 text-xs" style={{ color: 'var(--ink-2)', opacity: .5 }}>🔒</span>}
                  </td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: 'var(--orange)', fontVariantNumeric: 'tabular-nums' }}>
                    {isEditing ? (
                      <Input type="number" value={maneInput} onChange={e => setManeInput(e.target.value)}
                        className="w-24 ml-auto text-right" placeholder="0" />
                    ) : income ? `${income.mane_income.toFixed(0)} €` : <span style={{ color: 'var(--ink-2)', opacity: .4 }}>—</span>}
                  </td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: 'var(--blue)', fontVariantNumeric: 'tabular-nums' }}>
                    {isEditing ? (
                      <Input type="number" value={myriemInput} onChange={e => setMyriemInput(e.target.value)}
                        className="w-24 ml-auto text-right" placeholder="0" />
                    ) : income ? `${income.myriem_income.toFixed(0)} €` : <span style={{ color: 'var(--ink-2)', opacity: .4 }}>—</span>}
                  </td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: 'var(--ink)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                    {total !== null ? `${total.toFixed(0)} €` : <span style={{ color: 'var(--ink-2)', opacity: .4 }}>—</span>}
                  </td>
                  <td className="px-5 py-3 text-right text-xs">
                    {income ? (
                      <span>
                        <span style={{ color: 'var(--orange)' }}>{(shares.mane * 100).toFixed(0)}%</span>
                        <span style={{ color: 'var(--ink-2)', opacity: .4 }}> / </span>
                        <span style={{ color: 'var(--blue)' }}>{(shares.myriem * 100).toFixed(0)}%</span>
                      </span>
                    ) : <span style={{ color: 'var(--ink-2)', opacity: .4 }}>62% / 38%</span>}
                  </td>
                  <td className="px-5 py-3">
                    {locked ? (
                      <span className="text-xs block text-right" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--ink-2)', opacity: .5 }}>Verrouillé</span>
                    ) : isEditing ? (
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setEditingMonth(null)} style={{ color: 'var(--ink-2)' }}>✕</Button>
                        <Button size="sm" onClick={handleSave} disabled={saving}
                          style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
                          {saving ? '…' : 'OK'}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(month)}
                          style={{ color: 'var(--ink-2)' }} title="Modifier">
                          ✎
                        </Button>
                        {income && (
                          <Button variant="ghost" size="sm"
                            onClick={() => handleReset(month)}
                            disabled={resetting === month}
                            style={{ color: 'var(--ink-2)', opacity: .5 }}
                            title="Remettre aux valeurs par défaut">
                            ↺
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
