'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CATEGORY_COLORS, CATEGORIES, type Expense, type Person } from '@/types'

interface Props {
  expenses: Expense[]
}

export function CategoryPieChart({ expenses }: Props) {
  const [filter, setFilter] = useState<Person | 'all'>('all')

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.paid_by === filter)

  const data = CATEGORIES.map(cat => ({
    name: cat,
    value: filtered.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    color: CATEGORY_COLORS[cat],
  })).filter(d => d.value > 0)

  const total = filtered.reduce((s, e) => s + e.amount, 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40" style={{ color: 'var(--muted)' }}>
        <p className="text-sm">Aucune donnée</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['all', 'mane', 'myriem'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1 rounded-full transition-colors"
            style={{
              background: filter === f
                ? f === 'mane' ? 'var(--accent-mane-bg)' : f === 'myriem' ? 'var(--accent-myriem-bg)' : 'var(--card-hover)'
                : 'transparent',
              color: filter === f
                ? f === 'mane' ? 'var(--accent-mane)' : f === 'myriem' ? 'var(--accent-myriem)' : 'var(--foreground)'
                : 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            {f === 'all' ? 'Toutes' : f === 'mane' ? 'Mane' : 'Myriem'}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--foreground)',
            }}
            formatter={(v) => [`${Number(v).toFixed(2)} €`, '']}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-1 mt-2">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span style={{ color: 'var(--muted)' }}>{d.name}</span>
            <span className="ml-auto font-medium">{((d.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
