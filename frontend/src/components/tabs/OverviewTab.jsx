import KPICard from '../ui/KPICard'
import Card from '../ui/Card'
import PeriodToggle from '../ui/PeriodToggle'
import Icon from '../ui/Icon'
import MultiLineChart from '../charts/MultiLineChart'
import HBarChart from '../charts/HBarChart'
import DonutChart from '../charts/DonutChart'
import { fmt, fmtInt } from '../../utils/format'

function BatchTableFull({ batch, colors, A }) {
  const effBg = (v) => v >= 1.5 ? '#dcf3e0' : v >= 1.3 ? '#fef3d4' : '#fde8e8'
  const effColor = (v) => v >= 1.5 ? '#1f6b30' : v >= 1.3 ? '#8a5a00' : '#a83232'
  return (
    <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', border: `1px solid ${A.primaryLight}` }}>
      <div style={{ padding: '16px 22px', borderBottom: `1px solid ${A.primaryLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Análise ponderada por lote</div>
          <div style={{ fontSize: 12, color: '#6b7568', marginTop: 2 }}>Médias do período · {batch.length} lotes</div>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: A.bg }}>
              {['Lote', 'Vacas', 'Leite/vaca', 'CMS/vaca', 'Eficiência', '% Forragem', '% MS dieta'].map((h, i) => (
                <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#3a4438', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batch.map(row => (
              <tr key={row.lote} style={{ borderTop: `1px solid ${A.primaryLight}` }}>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: (colors[row.lote] || '#888') + '22', color: colors[row.lote] || '#888', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 10 }}>
                      {row.lote.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </span>
                    <span style={{ fontWeight: 700 }}>{row.lote}</span>
                  </div>
                </td>
                <td style={{ padding: '11px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#3a4438' }}>{fmtInt(row.avg_vacas)}</td>
                <td style={{ padding: '11px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{fmt(row.leite_vaca_pond, 1)}</td>
                <td style={{ padding: '11px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(row.ms_vaca_pond, 1)}</td>
                <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 12, padding: '3px 9px', borderRadius: 6, background: effBg(row.eficiencia_pond), color: effColor(row.eficiencia_pond) }}>
                    {(row.eficiencia_pond || 0).toFixed(3)}
                  </span>
                </td>
                <td style={{ padding: '11px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(row.avg_forragem, 1)}%</td>
                <td style={{ padding: '11px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(row.avg_pct_ms_dieta, 1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function OverviewTab({ ctx, A }) {
  const { lotes, colors, k, batch, rows, rebanhoEf, efTrend } = ctx

  const efSeries = lotes.map(l => ({
    label: l,
    color: colors[l],
    values: rows.filter(r => r.lote === l).map(r => r.eficiencia_alimentar),
  }))

  const kpis = [
    { icon: 'flask',  label: 'CMS por vaca',      value: fmt(k.ms_vaca_rebanho, 1),     unit: 'kg MS/vaca/dia', color: A.primary,  spark: rebanhoEf, sub: 'ponderado · rebanho' },
    { icon: 'leaf',   label: 'Forragem na dieta',  value: fmt(k.avg_forragem, 1),         unit: '%',             color: '#16a34a',  sub: 'meta: 50–60%' },
    { icon: 'wheat',  label: '% MS forragem',      value: fmt(k.avg_pct_ms_forragem, 1), unit: '%',             color: '#65a30d',  sub: 'matéria seca' },
    { icon: 'layers', label: '% MS dieta total',   value: fmt(k.avg_pct_ms_dieta, 1),    unit: '%',             color: '#d97706',  trendVal: efTrend, spark: rebanhoEf },
  ]

  return (
    <>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: A.primaryDark, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
          Visão geral
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
          Como está a dieta dos lotes?
        </h1>
        <div style={{ fontSize: 13.5, color: '#6b7568', marginTop: 4 }}>
          Eficiência média {fmt(k.eficiencia_ponderada, 3)} · forragem {fmt(k.avg_forragem, 1)}% · CMS rebanho {fmt(k.ms_vaca_rebanho, 1)} kg
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {kpis.map((kpi, i) => <KPICard key={i} kpi={kpi} A={A} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <Card A={A} eyebrow="Eficiência por lote" title="kg leite por kg MS · últimos 30 dias" right={<PeriodToggle A={A} />}>
          <MultiLineChart series={efSeries} height={240} formatY={v => v.toFixed(2)} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${A.primaryLight}` }}>
            {efSeries.map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#3a4438' }}>
                <span style={{ width: 14, height: 3, background: s.color, borderRadius: 2 }} />
                {s.label}
              </div>
            ))}
          </div>
        </Card>

        <Card A={A} eyebrow="Ranking" title="% Forragem por lote">
          <HBarChart
            items={[...batch].sort((a, b) => b.avg_forragem - a.avg_forragem).map(b => ({
              label: b.lote, value: b.avg_forragem, color: colors[b.lote],
            }))}
            max={65}
            formatVal={v => `${v.toFixed(1)}%`}
          />
          <div style={{ marginTop: 14, padding: 10, background: A.bg, borderRadius: 10, fontSize: 11.5, color: '#3a4438', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="info" size={14} style={{ color: '#6b7568', flexShrink: 0, marginTop: 1 }} />
            <span>Médias <strong>ponderadas</strong> pelo nº de vacas no período.</span>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16 }}>
        <BatchTableFull batch={batch} colors={colors} A={A} />

        {/* Composição rebanho */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '20px 22px', border: `1px solid ${A.primaryLight}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#6b7568', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>Composição</div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Rebanho por lote</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <DonutChart items={batch.map(b => ({ value: b.avg_vacas || 0, color: colors[b.lote] || '#888' }))} size={156} thickness={26} />
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5 }}>{fmtInt(k.total_vacas)}</div>
                  <div style={{ fontSize: 10.5, color: '#6b7568', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>vacas</div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {batch.map(b => (
                <div key={b.lote} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: colors[b.lote] || '#888', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 600, color: '#3a4438' }}>{b.lote}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{b.avg_vacas}</span>
                  <span style={{ color: '#9ca299', fontSize: 10.5 }}>({k.total_vacas ? ((b.avg_vacas / k.total_vacas) * 100).toFixed(0) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
