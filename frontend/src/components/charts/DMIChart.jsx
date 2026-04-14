import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { LOTE_COLORS, ALL_LOTES } from './chartUtils'

export default function DMIChart({ batchSummary, loading }) {
  if (loading || !batchSummary?.length) {
    return (
      <div className="card">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800">Consumo de MS por Vaca (CMS)</h3>
          <p className="text-xs text-gray-400 mt-0.5">kg MS / vaca / dia — ponderado do período</p>
        </div>
        <div className="h-[260px] bg-gray-50 rounded-lg animate-pulse" />
      </div>
    )
  }

  const chartData = batchSummary.map(r => ({
    lote: r.lote,
    'CMS kg/vaca': Number(r.ms_vaca_pond).toFixed(2),
  }))

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">Consumo de MS por Vaca (CMS)</h3>
        <p className="text-xs text-gray-400 mt-0.5">kg MS / vaca / dia — ponderado do período</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="lote" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
          <YAxis
            domain={[0, 'auto']}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            tickFormatter={v => `${v}`}
            width={36}
          />
          <Tooltip formatter={(v, name) => [`${Number(v).toFixed(2)} kg`, name]} />
          <Bar dataKey="CMS kg/vaca" radius={[6, 6, 0, 0]}>
            {chartData.map(entry => (
              <Cell key={entry.lote} fill={LOTE_COLORS[entry.lote] || '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
