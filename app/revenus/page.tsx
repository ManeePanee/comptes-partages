'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { upsertIncome } from '@/lib/api'
import { MONTH_NAMES, computeShares } from '@/types'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

export default function RevenusPage() {
  const { incomes, loading, refresh, profile } = useApp()
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

  const yearIncomes = useMemo(
    () => incomes.filter(i => i.year === selectedYear),
    [incomes, selectedYear]
  )

  const openEdit = (month: number) => {
    const income = yearIncomes.find(i => i.month === month)
    setManeInput(income ? String(income.mane_income) : '')
    setMyriemInput(income ? String(income.myriem_income) : '')
    setEditingMonth(month)
  }

  const handleSave = async () => {
    if (editingMonth === null) return
    setSaving(true)
    try {
      await upsertIncome(
        selectedYear,
        editingMonth,
        parseFloat(maneInput) || 0,
        parseFloat(myriemInput) || 0
      )
      await refresh()
      setEditingMonth(null)
    } finally {
      setSaving(false)
    }
  }

  // Données pour le graphique d'évolution
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
        <div className="text-sm" style={{ color: 'var(--muted)' }}>Chargement...</div>
      </div>
    )
  }

  const months = Array.from({ length: selectedYear === currentYear ? currentMonth : 12 }, (_, i) => i + 1).reverse()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Revenus</h1>
        <div className="flex gap-2">
          {years.map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                background: selectedYear === y ? 'var(--card-hover)' : 'transparent',
                color: selectedYear === y ? 'var(--foreground)' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Graphique évolution */}
      {chartData.length > 1 && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--muted)' }}>
            Évolution des revenus {selectedYear}
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
              <Tooltip
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--foreground)',
                }}
                formatter={(v) => [`${Number(v).toFixed(0)} €`]}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="mane" name="Mane" stroke="var(--accent-mane)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
              <Line type="monotone" dataKey="myriem" name="Myriem" stroke="var(--accent-myriem)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
              <Line type="monotone" dataKey="total" name="Total" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tableau des revenus */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: 'var(--muted)' }}>Mois</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--accent-mane)' }}>Mane</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--accent-myriem)' }}>Myriem</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--muted)' }}>Total</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--muted)' }}>Parts</th>
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
                <tr
                  key={month}
                  style={{
                    background: isEditing ? 'var(--card-hover)' : 'var(--card)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <td className="px-5 py-3 text-sm font-medium">{MONTH_NAMES[month - 1]}</td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: 'var(--accent-mane)' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={maneInput}
                        onChange={e => setManeInput(e.target.value)}
                        className="w-24 rounded px-2 py-1 text-right text-sm outline-none"
                        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--accent-mane)' }}
                        placeholder="0"
                      />
                    ) : (
                      income ? `${income.mane_income.toFixed(0)} €` : '—'
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: 'var(--accent-myriem)' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={myriemInput}
                        onChange={e => setMyriemInput(e.target.value)}
                        className="w-24 rounded px-2 py-1 text-right text-sm outline-none"
                        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--accent-myriem)' }}
                        placeholder="0"
                      />
                    ) : (
                      income ? `${income.myriem_income.toFixed(0)} €` : '—'
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-medium">
                    {total !== null ? `${total.toFixed(0)} €` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-xs" style={{ color: 'var(--muted)' }}>
                    {income ? (
                      <span>
                        <span style={{ color: 'var(--accent-mane)' }}>{(shares.mane * 100).toFixed(0)}%</span>
                        {' / '}
                        <span style={{ color: 'var(--accent-myriem)' }}>{(shares.myriem * 100).toFixed(0)}%</span>
                      </span>
                    ) : (
                      <span>62% / 38%</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {isEditing ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingMonth(null)}
                          className="text-xs px-2 py-1 rounded"
                          style={{ color: 'var(--muted)' }}
                        >
                          ✕
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="text-xs px-3 py-1 rounded font-medium"
                          style={{ background: 'var(--accent-mane)', color: '#0f0f13' }}
                        >
                          {saving ? '...' : 'OK'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openEdit(month)}
                        className="text-xs px-2 py-1 rounded transition-colors"
                        style={{ color: 'var(--muted)' }}
                      >
                        ✎
                      </button>
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
