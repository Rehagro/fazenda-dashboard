import React, { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import {
  getLoteColor, REBANHO_COLOR,
  pivotMonthlyWithHerd, fmtMonth, tooltipFmt,
} from './charts/chartUtils'

function MonthlyLineChart({ data, lotes, field, title, subtitle, unit, refValue }) {
  const pivoted = pivotMonthlyWithHerd(data, field)
  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={pivoted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} width={42}
            tickFormatter={v => Number(v).toFixed(field === 'eficiencia_pond' ? 2 : 1)} />
          <Tooltip formatter={tooltipFmt} labelFormatter={fmtMonth} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="Rebanho" stroke={REBANHO_COLOR} strokeWidth={3} dot={{ r: 4 }} strokeDasharray="6 3" />
          {lotes.map((lote, i) => (
            <Line key={lote} type="monotone" dataKey={lote}
              stroke={getLoteColor(lote, i)} strokeWidth={2} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function EffBadge({ val }) {
  if (val == null || isNaN(val)) return <span className="text-gray-400">—</span>
  if (val >= 1.5) return <span className="badge bg-emerald-100 text-emerald-700">{Number(val).toFixed(3)}</span>
  if (val >= 1.3) return <span className="badge bg-amber-100 text-amber-700">{Number(val).toFixed(3)}</span>
  return <span className="badge bg-red-100 text-red-700">{Number(val).toFixed(3)}</span>
}

const fmt = (v, d = 1) => v != null ? Number(v).toFixed(d) : '—'

function MonthlyTable({ data, lotes }) {
  // Compute rebanho row per month
  const months = [...new Set(data.map(r => r.mes))].sort()
  const byMonth = {}
  for (const row of data) {
    if (!byMonth[row.mes]) byMonth[row.mes] = []
    byMonth[row.mes].push(row)
  }

  // Herd aggregate per month
  const rebanhoRows = months.map(mes => {
    const rows = byMonth[mes] || []
    const totalVacas   = rows.reduce((s, r) => s + Number(r.avg_vacas || 0), 0)
    const wLeite       = rows.reduce((s, r) => s + Number(r.leite_vaca_pond || 0) * Number(r.avg_vacas || 0), 0)
    const wCMS         = rows.reduce((s, r) => s + Number(r.ms_vaca_pond   || 0) * Number(r.avg_vacas || 0), 0)
    const wForr        = rows.reduce((s, r) => s + Number(r.avg_forragem   || 0) * Number(r.avg_vacas || 0), 0)
    return {
      mes,
      leite: totalVacas > 0 ? wLeite / totalVacas : null,
      cms:   totalVacas > 0 ? wCMS   / totalVacas : null,
      forr:  totalVacas > 0 ? wForr  / totalVacas : null,
      efic:  (wLeite > 0 && wCMS > 0) ? wLeite / wCMS : null,
    }
  })

  return (
    <div className="card overflow-hidden p-0">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Resumo Mensal por Lote</h3>
        <p className="text-xs text-gray-400 mt-0.5">Médias ponderadas por mês</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left font-semibold text-gray-600 px-5 py-3">Mês</th>
              <th className="text-left font-semibold text-gray-600 px-4 py-3">Lote</th>
              <th className="text-right font-semibold text-gray-600 px-4 py-3">Leite/Vaca kg</th>
              <th className="text-right font-semibold text-gray-600 px-4 py-3">CMS/Vaca kg</th>
              <th className="text-right font-semibold text-gray-600 px-4 py-3">Eficiência</th>
              <th className="text-right font-semibold text-gray-600 px-5 py-3">% Forragem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {months.map(mes => {
              const rb  = rebanhoRows.find(r => r.mes === mes)
              const rows = (byMonth[mes] || []).sort((a, b) => a.lote.localeCompare(b.lote))
              return (
                <React.Fragment key={mes}>
                  {/* Rebanho row */}
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td className="px-5 py-2.5 font-semibold text-slate-700">{fmtMonth(mes)}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: REBANHO_COLOR }} />
                        <span className="font-semibold text-slate-700">Rebanho</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{fmt(rb?.leite, 1)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{fmt(rb?.cms, 1)}</td>
                    <td className="px-4 py-2.5 text-right"><EffBadge val={rb?.efic} /></td>
                    <td className="px-5 py-2.5 text-right font-semibold text-slate-700">{fmt(rb?.forr, 1)}%</td>
                  </tr>
                  {/* Per-lote rows */}
                  {rows.map((row, i) => (
                    <tr key={row.lote} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-2 text-gray-300"></td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: getLoteColor(row.lote, i) }} />
                          <span className="text-gray-700">{row.lote}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">{fmt(row.leite_vaca_pond, 1)}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{fmt(row.ms_vaca_pond, 1)}</td>
                      <td className="px-4 py-2 text-right"><EffBadge val={Number(row.eficiencia_pond)} /></td>
                      <td className="px-5 py-2 text-right text-gray-600">{fmt(row.avg_forragem, 1)}%</td>
                    </tr>
                  ))}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function MonthlyTab({ data, lotes, loading }) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[0, 1].map(i => (
            <div key={i} className="card"><div className="h-[260px] bg-gray-100 rounded-lg animate-pulse" /></div>
          ))}
        </div>
      </div>
    )
  }

  if (!data?.length) return (
    <div className="card text-center py-12 text-gray-400">
      Nenhum dado disponível para o período selecionado.
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MonthlyLineChart
          data={data} lotes={lotes}
          field="leite_vaca_pond"
          title="Produção por Vaca — Mensal"
          subtitle="kg leite / vaca / dia — média ponderada por mês"
        />
        <MonthlyLineChart
          data={data} lotes={lotes}
          field="eficiencia_pond"
          title="Eficiência Alimentar — Mensal"
          subtitle="kg leite / kg MS — média ponderada por mês"
        />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MonthlyLineChart
          data={data} lotes={lotes}
          field="ms_vaca_pond"
          title="CMS por Vaca — Mensal"
          subtitle="kg MS / vaca / dia — média ponderada por mês"
        />
        <MonthlyLineChart
          data={data} lotes={lotes}
          field="avg_forragem"
          title="% Forragem na Dieta — Mensal"
          subtitle="Média ponderada por mês"
        />
      </div>
      <MonthlyTable data={data} lotes={lotes} />
    </div>
  )
}
