import KPICard from '../ui/KPICard'
import Card from '../ui/Card'
import SectionHeader from '../ui/SectionHeader'
import HBarChart from '../charts/HBarChart'
import ScatterChart from '../charts/ScatterChart'
import { fmt } from '../../utils/format'

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
                <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#3a4438', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
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
                <td style={{ padding: '11px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.avg_vacas}</td>
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
  const { colors, batch, rows, k } = ctx

  const scatterPoints = batch.map(b => {
    const lr = rows.filter(r => r.lote === b.lote)
    const realAvg = lr.length ? lr.reduce((s, r) => s + r.ms_vaca, 0) / lr.length : 0
    const prevAvg = lr.length ? lr.reduce((s, r) => s + (r.ms_vaca_previsto || r.ms_vaca), 0) / lr.length : 0
    return { x: prevAvg, y: realAvg, label: b.lote, color: colors[b.lote] || '#888' }
  })

  return (
    <>
      <SectionHeader A={A} eyebrow="Dieta & CMS" title="Consumo de matéria seca e forragem" subtitle="Comparar previsto vs real, ranking de forragem e % MS" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KPICard A={A} kpi={{ icon: 'flask',  label: 'CMS/vaca',       value: fmt(k.ms_vaca_rebanho, 1),     unit: 'kg MS/vaca', color: A.primary,  sub: 'ponderado' }} />
        <KPICard A={A} kpi={{ icon: 'leaf',   label: '% Forragem',     value: fmt(k.avg_forragem, 1),        unit: '%',          color: '#16a34a', sub: '50–60% saudável' }} />
        <KPICard A={A} kpi={{ icon: 'wheat',  label: '% MS forragem',  value: fmt(k.avg_pct_ms_forragem, 1), unit: '%',          color: '#65a30d', sub: 'matéria seca' }} />
        <KPICard A={A} kpi={{ icon: 'layers', label: '% MS dieta',     value: fmt(k.avg_pct_ms_dieta, 1),   unit: '%',          color: '#d97706', sub: 'matéria seca' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card A={A} eyebrow="Consistência" title="CMS previsto vs real" subtitle="linha pontilhada = previsto = real">
          <ScatterChart points={scatterPoints} height={240} xLabel="CMS previsto (kg)" yLabel="CMS real (kg)" />
        </Card>
        <Card A={A} eyebrow="Ranking" title="% Forragem por lote">
          <HBarChart
            items={[...batch].sort((a, b) => b.avg_forragem - a.avg_forragem).map(b => ({ label: b.lote, value: b.avg_forragem, color: colors[b.lote] || '#888' }))}
            max={65}
            formatVal={v => `${v.toFixed(1)}%`}
          />
        </Card>
      </div>

      <BatchTableFull batch={batch} colors={colors} A={A} />
    </>
  )
}
