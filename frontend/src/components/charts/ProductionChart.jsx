import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  getLoteColor, REBANHO_COLOR,
  pivotWithHerd, fmtDate, tooltipFmt,
} from './chartUtils'

export default function ProductionChart({ data, activeLotes }) {
  const lotes   = activeLotes || []
  const pivoted = pivotWithHerd(
    data,
    'leite_por_vaca',
    'producao_leite_total',
    'num_vacas',
  )

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">Produção por Vaca ao longo do tempo</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          kg leite / vaca / dia — por lote e média ponderada do rebanho
        </p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={pivoted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            tickFormatter={v => v.toFixed(0)}
            width={36}
          />
          <Tooltip formatter={tooltipFmt} labelFormatter={fmtDate} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {/* Linha Rebanho em destaque */}
          <Line
            key="Rebanho"
            type="monotone"
            dataKey="Rebanho"
            stroke={REBANHO_COLOR}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5 }}
            strokeDasharray="6 3"
          />
          {/* Linhas por lote */}
          {lotes.map((lote, i) => (
            <Line
              key={lote}
              type="monotone"
              dataKey={lote}
              stroke={getLoteColor(lote, i)}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
