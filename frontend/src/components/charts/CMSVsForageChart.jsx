import React from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  getLoteColor, REBANHO_COLOR,
  pivotWithHerd, weightedHerdByDate,
  fmtDate, tooltipFmt,
} from './chartUtils'

export default function CMSVsForageChart({ data, activeLotes }) {
  const lotes = activeLotes || []

  // Pivot CMS/vaca por lote + rebanho (CMS total / num_vacas)
  const pivoted = pivotWithHerd(
    data,
    'consumo_ms_vaca',
    'consumo_ms_total',
    'num_vacas',
  )

  // % Forragem ponderada do rebanho por data
  const forrHerd = weightedHerdByDate(data, 'percentual_forragem', 'num_vacas')

  const chartData = pivoted.map(row => ({
    ...row,
    '% Forragem Rebanho': forrHerd[row.date] != null
      ? Number(Number(forrHerd[row.date]).toFixed(1))
      : undefined,
  }))

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">CMS vs % Forragem na Dieta</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Eixo esq.: kg MS/vaca/dia — Eixo dir.: % forragem (rebanho ponderado)
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 40, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
          />
          <YAxis
            yAxisId="cms"
            orientation="left"
            domain={['auto', 'auto']}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            tickFormatter={v => v.toFixed(0)}
            width={36}
            label={{ value: 'kg MS/vaca', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8', dx: -2 }}
          />
          <YAxis
            yAxisId="forr"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            tickFormatter={v => `${v}%`}
            width={42}
            label={{ value: '% Forragem', angle: 90, position: 'insideRight', fontSize: 10, fill: '#94a3b8', dx: 14 }}
          />
          <Tooltip formatter={tooltipFmt} labelFormatter={fmtDate} />
          <Legend wrapperStyle={{ fontSize: 12 }} />

          {/* Linha Rebanho (CMS) */}
          <Line
            yAxisId="cms"
            type="monotone"
            dataKey="Rebanho"
            name="CMS/Vaca Rebanho"
            stroke={REBANHO_COLOR}
            strokeWidth={3}
            dot={false}
            strokeDasharray="6 3"
          />

          {/* Linhas por lote (CMS) */}
          {lotes.map((lote, i) => (
            <Line
              key={lote}
              yAxisId="cms"
              type="monotone"
              dataKey={lote}
              stroke={getLoteColor(lote, i)}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}

          {/* % Forragem Rebanho */}
          <Line
            yAxisId="forr"
            type="monotone"
            dataKey="% Forragem Rebanho"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 2"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
