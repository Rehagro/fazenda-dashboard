import Card from '../ui/Card'
import SectionHeader from '../ui/SectionHeader'
import MultiLineChart from '../charts/MultiLineChart'
import { fmt, fmtInt, monthName } from '../../utils/format'

export default function MonthlyTab({ ctx, A }) {
  const { lotes, colors, monthly } = ctx

  const months = [...new Set(monthly.map(m => m.mes))].sort()
  const mNames = months.map(m => monthName(m))

  const efSeries    = lotes.map(l => ({ label: l, color: colors[l] || '#888', values: months.map(m => monthly.find(r => r.lote === l && r.mes === m)?.eficiencia_pond ?? 0) }))
  const leiteSeries = lotes.map(l => ({ label: l, color: colors[l] || '#888', values: months.map(m => monthly.find(r => r.lote === l && r.mes === m)?.leite_vaca_pond ?? 0) }))
  const cmsSeries   = lotes.map(l => ({ label: l, color: colors[l] || '#888', values: months.map(m => monthly.find(r => r.lote === l && r.mes === m)?.ms_vaca_pond ?? 0) }))

  const Legend = ({ series }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 8, borderTop: `1px dashed ${A.primaryLight}`, marginTop: 4 }}>
      {series.map(s => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: '#3a4438' }}>
          <span style={{ width: 12, height: 3, background: s.color, borderRadius: 2 }} />
          {s.label}
        </div>
      ))}
    </div>
  )

  const MonthAxis = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#9ca299', fontWeight: 600, marginTop: -18, padding: '0 36px 6px' }}>
      {mNames.map(n => <span key={n}>{n}</span>)}
    </div>
  )

  return (
    <>
      <SectionHeader A={A} eyebrow="Histórico" title="Evolução mensal" subtitle={`${mNames[0] || ''}–${mNames[mNames.length - 1] || ''} · ${months.length} meses · ${lotes.length} lotes`} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card A={A} eyebrow="Mensal · kg leite / kg MS" title="Eficiência alimentar">
          <MultiLineChart series={efSeries} height={220} formatY={v => v.toFixed(2)} />
          <MonthAxis />
          <Legend series={efSeries} />
        </Card>
        <Card A={A} eyebrow="Mensal · kg/vaca/dia" title="Leite por vaca">
          <MultiLineChart series={leiteSeries} height={220} formatY={v => v.toFixed(0)} />
          <MonthAxis />
          <Legend series={leiteSeries} />
        </Card>
      </div>

      <Card A={A} eyebrow="Mensal · kg MS/vaca/dia" title="CMS por vaca">
        <MultiLineChart series={cmsSeries} height={240} formatY={v => v.toFixed(1)} />
        <MonthAxis />
        <Legend series={cmsSeries} />
      </Card>

      <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', border: `1px solid ${A.primaryLight}` }}>
        <div style={{ padding: '14px 22px', borderBottom: `1px solid ${A.primaryLight}` }}>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Tabela mensal por lote</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: A.bg }}>
                {['Mês', 'Lote', 'Vacas', 'Leite/vaca', 'CMS/vaca', 'Eficiência', '% Forragem'].map((h, i) => (
                  <th key={i} style={{ textAlign: i <= 1 ? 'left' : 'right', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#3a4438', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...monthly].sort((a, b) => a.mes.localeCompare(b.mes) || a.lote.localeCompare(b.lote)).map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${A.primaryLight}` }}>
                  <td style={{ padding: '9px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>{monthName(r.mes)}/{r.mes?.slice(2, 4)}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: colors[r.lote] || '#888' }} />
                      {r.lote}
                    </span>
                  </td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtInt(r.avg_vacas)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{fmt(r.leite_vaca_pond, 1)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.ms_vaca_pond, 1)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{(r.eficiencia_pond || 0).toFixed(3)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.avg_forragem, 1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
