import KPICard from '../ui/KPICard'
import Card from '../ui/Card'
import SectionHeader from '../ui/SectionHeader'
import HBarChart from '../charts/HBarChart'
import MultiLineChart from '../charts/MultiLineChart'
import { fmt, fmtInt } from '../../utils/format'

function BatchTableFull({ batch, colors, A }) {
  const effBg = (v) => v >= 1.5 ? '#dcf3e0' : v >= 1.3 ? '#fef3d4' : '#fde8e8'
  const effColor = (v) => v >= 1.5 ? '#1f6b30' : v >= 1.3 ? '#8a5a00' : '#a83232'
  return (
    <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', border: `1px solid ${A.primaryLight}` }}>
      <div style={{ padding: '14px 22px', borderBottom: `1px solid ${A.primaryLight}` }}>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Análise ponderada por lote</div>
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
                <td style={{ padding: '11px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtInt(row.avg_vacas)}</td>
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

export default function DietTab({ ctx, A }) {
  const { lotes, colors, batch, rows, k } = ctx

  // Série temporal de CMS/vaca por lote
  const cmsSeries = lotes.map(l => ({
    label: l,
    color: colors[l],
    values: rows.filter(r => r.lote === l).map(r => r.ms_vaca),
  }))

  // Série temporal de eficiência por lote
  const efSeries = lotes.map(l => ({
    label: l,
    color: colors[l],
    values: rows.filter(r => r.lote === l).map(r => r.eficiencia),
  }))

  const Legend = ({ series }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${A.primaryLight}` }}>
      {series.map(s => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#3a4438' }}>
          <span style={{ width: 14, height: 3, background: s.color, borderRadius: 2 }} />
          {s.label}
        </div>
      ))}
    </div>
  )

  return (
    <>
      <SectionHeader A={A} eyebrow="Dieta & CMS" title="Consumo de matéria seca e forragem" subtitle="Evolução diária, ranking e composição da dieta por lote" />

      {/* 4 KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KPICard A={A} kpi={{ icon: 'flask',  label: 'CMS/vaca',      value: fmt(k.ms_vaca_rebanho, 1),     unit: 'kg MS/vaca', color: A.primary,  sub: 'ponderado' }} />
        <KPICard A={A} kpi={{ icon: 'leaf',   label: '% Forragem',    value: fmt(k.avg_forragem, 1),        unit: '%',          color: '#16a34a', sub: '50–60% saudável' }} />
        <KPICard A={A} kpi={{ icon: 'wheat',  label: '% MS forragem', value: fmt(k.avg_pct_ms_forragem, 1), unit: '%',          color: '#65a30d', sub: 'matéria seca' }} />
        <KPICard A={A} kpi={{ icon: 'layers', label: '% MS dieta',    value: fmt(k.avg_pct_ms_dieta, 1),   unit: '%',          color: '#d97706', sub: 'matéria seca' }} />
      </div>

      {/* Gráfico grande — CMS/vaca por lote ao longo do tempo */}
      <Card A={A} eyebrow="Evolução diária por lote" title="CMS por vaca · kg MS/vaca/dia">
        <MultiLineChart series={cmsSeries} height={300} formatY={v => v.toFixed(1)} />
        <Legend series={cmsSeries} />
      </Card>

      {/* Eficiência + % Forragem lado a lado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Card A={A} eyebrow="Eficiência alimentar" title="kg leite / kg MS · evolução por lote">
          <MultiLineChart series={efSeries} height={220} formatY={v => v.toFixed(2)} />
          <Legend series={efSeries} />
        </Card>

        <Card A={A} eyebrow="Ranking" title="% Forragem por lote">
          <HBarChart
            items={[...batch].sort((a, b) => b.avg_forragem - a.avg_forragem).map(b => ({
              label: b.lote, value: b.avg_forragem, color: colors[b.lote],
            }))}
            max={70}
            formatVal={v => `${v.toFixed(1)}%`}
          />
          <div style={{ marginTop: 12, padding: 10, background: A.bg, borderRadius: 10, fontSize: 11.5, color: '#3a4438' }}>
            Meta saudável: <strong>50–60%</strong> forragem na dieta
          </div>
        </Card>
      </div>

      <BatchTableFull batch={batch} colors={colors} A={A} />
    </>
  )
}
