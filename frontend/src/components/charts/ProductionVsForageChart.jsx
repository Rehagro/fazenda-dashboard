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

export default function ProductionVsForageChart({ data, activeLotes }) {
  const lotes = activeLotes || []

  // Pivot leite/vaca por lote + rebanho
  const pivoted = pivotWithHerd(
    data,
    'leite_por_vaca',
    'producao_leite_total',
    'num_vacas',
  )

  // % Forragem ponderada do rebanho por data
  const forrHerd = weightedHerdByDate(data, 'percentual_forragem', 'num_vacas')

  // Injeta % Forragem Rebanho nos dados pivotados
  const chartData = pivoted.map(row => ({
    ...row,
    '% Forragem Rebanho': forrHerd[row.date] != null
      ? Number(Number(forrHerd[row.date]).toFixed(1))
      : undefined,
  }))

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">Produção vs % Forragem na Dieta</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Eixo esq.: kg leite/vaca/dia — Eixo dir.: % forragem (rebanho ponderado)
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
          {/* Eixo esquerdo: produção */}
          <YAxis
            yAxisId="prod"
            orientation="left"
            domain={['auto', 'auto']}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            tickFormatter={v => v.toFixed(0)}
            width={36}
            label={{ value: 'kg leite/vaca', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8', dx: -2 }}
          />
          {/* Eixo direito: % forragem */}
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

          {/* Linha Rebanho (produção) */}
          <Line
            yAxisId="prod"
            type="monotone"
            dataKey="Rebanho"
            name="Leite/Vaca Rebanho"
            stroke={REBANHO_COLOR}
            strokeWidth={3}
            dot={false}
            strokeDasharray="6 3"
          />

          {/* Linhas por lote (produção) */}
          {lotes.map((lote, i) => (
            <Line
              key={lote}
              yAxisId="prod"
              type="monotone"
              dataKey={lote}
              stroke={getLoteColor(lote, i)}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}

          {/* % Forragem Rebanho (eixo direito) */}
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
