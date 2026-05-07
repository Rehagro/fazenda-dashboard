import KPICard from '../ui/KPICard'
import Card from '../ui/Card'
import SectionHeader from '../ui/SectionHeader'
import MultiLineChart from '../charts/MultiLineChart'
import HBarChart from '../charts/HBarChart'
import { fmt, fmtInt } from '../../utils/format'

export default function ProductionTab({ ctx, A }) {
  const { lotes, colors, batch, rows, rebanhoLeite, leiteTrend, k } = ctx

  const series = lotes.map(l => ({ label: l, color: colors[l] || '#888', values: rows.filter(r => r.lote === l).map(r => r.leite_vaca) }))
  series.push({ label: 'Rebanho', color: '#1e3a5f', values: rebanhoLeite, thick: true, dashed: true })

  return (
    <>
      <SectionHeader A={A} eyebrow="Produção" title="Quanto cada lote produz" subtitle="Leite por vaca e produção total no período" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <KPICard A={A} kpi={{ icon: 'drop',  label: 'Produção total',    value: fmtInt(k.total_producao),     unit: 'kg/dia',      color: A.primary, spark: rebanhoLeite, trendVal: leiteTrend }} />
        <KPICard A={A} kpi={{ icon: 'milk',  label: 'Leite/vaca rebanho', value: fmt(k.leite_vaca_rebanho, 1), unit: 'kg/vaca/dia', color: '#0ea5e9', spark: rebanhoLeite, trendVal: leiteTrend }} />
        <KPICard A={A} kpi={{ icon: 'cow',   label: 'Vacas em lactação',  value: fmtInt(k.total_vacas),        unit: 'cabeças',     color: '#7c3aed', sub: `${lotes.length} lotes ativos` }} />
      </div>

      <Card A={A} eyebrow="Evolução por lote" title="Leite por vaca · 30 dias">
        <MultiLineChart series={series} height={280} formatY={v => v.toFixed(0)} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${A.primaryLight}` }}>
          {series.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#3a4438' }}>
              <span style={{ width: 14, height: 3, background: s.color, borderRadius: 2 }} />
              {s.label}
            </div>
          ))}
        </div>
      </Card>

      <Card A={A} eyebrow="Ranking" title="Ordenado por leite/vaca">
        <HBarChart
          items={[...batch].sort((a, b) => b.leite_vaca_pond - a.leite_vaca_pond).map(b => ({ label: b.lote, value: b.leite_vaca_pond, color: colors[b.lote] || '#888' }))}
          max={42}
          formatVal={v => `${v.toFixed(1)} kg`}
        />
      </Card>
    </>
  )
}
