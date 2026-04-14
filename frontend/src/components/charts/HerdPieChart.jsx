import React from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { LOTE_COLORS } from './chartUtils'

export default function HerdPieChart({ batchSummary, loading }) {
  if (loading || !batchSummary?.length) {
    return (
      <div className="card">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800">Composição do Rebanho</h3>
        </div>
        <div className="h-[260px] bg-gray-50 rounded-lg animate-pulse" />
      </div>
    )
  }

  const chartData = batchSummary.map(r => ({
    name:  r.lote,
    value: Math.round(Number(r.avg_vacas)),
  }))

  const total = chartData.reduce((s, r) => s + r.value, 0)

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">Composição do Rebanho</h3>
        <p className="text-xs text-gray-400 mt-0.5">Vacas em lactação por lote (média do período)</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map(entry => (
              <Cell key={entry.name} fill={LOTE_COLORS[entry.name] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip formatter={(v, name) => [`${v} vacas`, name]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-center text-sm text-gray-500 -mt-2">Total: <span className="font-bold text-gray-800">{total}</span> vacas</p>
    </div>
  )
}
