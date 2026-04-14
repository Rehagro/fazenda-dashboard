import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { LOTE_COLORS, ALL_LOTES } from './chartUtils'

export default function ForageChart({ batchSummary, loading }) {
  if (loading || !batchSummary?.length) {
    return (
      <div className="card">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800">Composição da Dieta — % Forragem</h3>
        </div>
        <div className="h-[260px] bg-gray-50 rounded-lg animate-pulse" />
      </div>
    )
  }

  const chartData = batchSummary.map(r => ({
    lote: r.lote,
    'Forragem %':     Number(r.avg_forragem).toFixed(1),
    'Concentrado %':  (100 - Number(r.avg_forragem)).toFixed(1),
  }))

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">Composição da Dieta — % Forragem vs Concentrado</h3>
        <p className="text-xs text-gray-400 mt-0.5">Média ponderada do período selecionado</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="lote" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            tickFormatter={v => `${v}%`}
            width={40}
          />
          <Tooltip formatter={(v, name) => [`${Number(v).toFixed(1)}%`, name]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Forragem %" stackId="a" fill="#4ade80" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Concentrado %" stackId="a" fill="#fbbf24" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
