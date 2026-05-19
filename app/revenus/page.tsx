'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { upsertIncome } from '@/lib/api'
import { MONTH_NAMES, computeShares } from '@/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function RevenusPage() {
  const { incomes, loading, refresh } = useApp()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [editingMonth, setEditingMonth] = useState<number | null>(null)
  const [maneInput, setManeInput] = useState('')
  const [myriemInput, setMyriemInput] = useState('')
  const [saving, setSaving] = useState(false)

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
    return <div className="flex items-center justify-center h-40 text-sm text-[var(--brown-400)]">Chargement...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[var(--brown-900)]">Revenus</h1>
        <div className="flex gap-2">
          {years.map(y => (
            <button key={y} onClick={() => setSelectedYear(y)}
              className="px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                background: selectedYear === y ? 'var(--olive-50)' : 'white',
                color: selectedYear === y ? 'var(--olive-600)' : 'var(--brown-500)',
                borderColor: selectedYear === y ? 'var(--olive-200)' : 'var(--brown-200)',
                fontWeight: selectedYear === y ? 600 : 400,
              }}
            >{y}</button>
          ))}
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="rounded-2xl p-5 mb-6 bg-white border border-[var(--brown-200)] shadow-sm">
          <h2 className="text-sm font-medium text-[var(--brown-500)] mb-4">Évolution des revenus {selectedYear}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--brown-100)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--brown-400)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--brown-400)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid var(--brown-200)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v) => [`${Number(v).toFixed(0)} €`]}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="mane" name="Mane" stroke="var(--olive-500)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="myriem" name="Myriem" stroke="var(--red-400)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="total" name="Total" stroke="var(--brown-300)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border border-[var(--brown-200)] bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--brown-100)] bg-[var(--brown-50)]">
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--brown-500)]">Mois</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--olive-600)' }}>Mane</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--red-500)' }}>Myriem</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-[var(--brown-500)]">Total</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-[var(--brown-500)]">Parts</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {months.map(month => {
              const income = yearIncomes.find(i => i.month === month)
              const shares = computeShares(income ?? null)
              const isEditing = editingMonth === month
              const total = income ? income.mane_income + income.myriem_income : null

              return (
                <tr key={month} className="border-b border-[var(--brown-100)] last:border-0"
                  style={{ background: isEditing ? 'var(--olive-50)' : 'white' }}>
                  <td className="px-5 py-3 text-sm font-medium text-[var(--brown-900)]">{MONTH_NAMES[month - 1]}</td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: 'var(--olive-600)' }}>
                    {isEditing ? (
                      <Input type="number" value={maneInput} onChange={e => setManeInput(e.target.value)}
                        className="w-24 text-right border-[var(--olive-200)]" placeholder="0" />
                    ) : income ? `${income.mane_income.toFixed(0)} €` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: 'var(--red-500)' }}>
                    {isEditing ? (
                      <Input type="number" value={myriemInput} onChange={e => setMyriemInput(e.target.value)}
                        className="w-24 text-right border-[var(--red-200)]" placeholder="0" />
                    ) : income ? `${income.myriem_income.toFixed(0)} €` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-medium text-[var(--brown-900)]">
                    {total !== null ? `${total.toFixed(0)} €` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-xs">
                    {income ? (
                      <span>
                        <span style={{ color: 'var(--olive-600)' }}>{(shares.mane * 100).toFixed(0)}%</span>
                        <span className="text-[var(--brown-300)]"> / </span>
                        <span style={{ color: 'var(--red-500)' }}>{(shares.myriem * 100).toFixed(0)}%</span>
                      </span>
                    ) : <span className="text-[var(--brown-300)]">62% / 38%</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {isEditing ? (
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setEditingMonth(null)} className="text-[var(--brown-400)]">✕</Button>
                        <Button size="sm" onClick={handleSave} disabled={saving} className="bg-[var(--olive-600)] hover:bg-[var(--olive-700)] text-white">
                          {saving ? '...' : 'OK'}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => openEdit(month)} className="text-[var(--brown-400)] hover:text-[var(--brown-700)]">✎</Button>
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
