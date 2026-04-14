import React from 'react'
import { getLoteColor } from './charts/chartUtils'

function EffBadge({ val }) {
  if (val == null || isNaN(val)) return <span className="text-gray-400">—</span>
  if (val >= 1.5) return <span className="badge bg-emerald-100 text-emerald-700">{val.toFixed(3)}</span>
  if (val >= 1.3) return <span className="badge bg-amber-100 text-amber-700">{val.toFixed(3)}</span>
  return <span className="badge bg-red-100 text-red-700">{val.toFixed(3)}</span>
}

const fmtN = (v, d = 1) => v != null ? Number(v).toFixed(d) : '—'

export default function BatchTable({ data, loading }) {
  if (loading) {
    return (
      <div className="card animate-pulse space-y-2">
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded" />
        ))}
      </div>
    )
  }

  if (!data?.length) return null

  return (
    <div className="card overflow-hidden p-0">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Análise Ponderada por Lote</h3>
        <p className="text-xs text-gray-400 mt-0.5">Médias ponderadas pelo período selecionado</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left font-semibold text-gray-600 px-5 py-3">Lote</th>
              <th className="text-right font-semibold text-gray-600 px-4 py-3">Vacas</th>
              <th className="text-right font-semibold text-gray-600 px-4 py-3">Leite/Vaca kg</th>
              <th className="text-right font-semibold text-gray-600 px-4 py-3">CMS/Vaca kg</th>
              <th className="text-right font-semibold text-gray-600 px-4 py-3">Eficiência</th>
              <th className="text-right font-semibold text-gray-600 px-4 py-3">% Forragem</th>
              <th className="text-right font-semibold text-gray-600 px-4 py-3">%MS Forragem</th>
              <th className="text-right font-semibold text-gray-600 px-5 py-3">%MS Dieta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row, i) => {
              const color = getLoteColor(row.lote, i)
              return (
                <tr key={row.lote} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-semibold text-gray-800">{row.lote}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmtN(row.avg_vacas, 0)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmtN(row.leite_vaca_pond, 1)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmtN(row.ms_vaca_pond, 1)}</td>
                  <td className="px-4 py-3 text-right">
                    <EffBadge val={Number(row.eficiencia_pond)} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmtN(row.avg_forragem, 1)}%</td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {row.avg_pct_ms_forragem != null ? `${fmtN(row.avg_pct_ms_forragem, 1)}%` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {row.avg_pct_ms_dieta != null ? `${fmtN(row.avg_pct_ms_dieta, 1)}%` : '—'}
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
