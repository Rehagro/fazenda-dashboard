import SectionHeader from '../ui/SectionHeader'
import Sparkline from '../charts/Sparkline'
import { fmt, fmtInt } from '../../utils/format'

function Mini({ label, val, unit }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: '#6b7568', fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: 17, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
        <span style={{ fontSize: 10, color: '#9ca299' }}>{unit}</span>
      </div>
    </div>
  )
}

export default function LotesTab({ ctx, A }) {
  const { lotes, colors, batch, rows } = ctx
  const effBg = (v) => v >= 1.5 ? '#dcf3e0' : v >= 1.3 ? '#fef3d4' : '#fde8e8'
  const effColor = (v) => v >= 1.5 ? '#1f6b30' : v >= 1.3 ? '#8a5a00' : '#a83232'

  return (
    <>
      <SectionHeader A={A} eyebrow="Comparar" title="Cards por lote" subtitle="Cada lote com indicadores principais e mini-gráfico de tendência" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {batch.map(b => {
          const c = colors[b.lote] || '#888'
          const lotRows = rows.filter(r => r.lote === b.lote)
          const leiteSpark = lotRows.map(r => r.leite_por_vaca)
          return (
            <div key={b.lote} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: `1px solid ${A.primaryLight}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: c + '22', color: c, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 12 }}>
                    {b.lote.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.2 }}>{b.lote}</div>
                    <div style={{ fontSize: 11.5, color: '#6b7568' }}>{fmtInt(b.avg_vacas)} vacas</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: effBg(b.eficiencia_pond), color: effColor(b.eficiencia_pond) }}>
                  {(b.eficiencia_pond || 0).toFixed(3)} ef
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <Mini label="Leite/vaca" val={fmt(b.leite_vaca_pond, 1)} unit="kg" />
                <Mini label="CMS/vaca"   val={fmt(b.ms_vaca_pond, 1)}   unit="kg" />
                <Mini label="% Forragem" val={fmt(b.avg_forragem, 1)}   unit="%" />
                <Mini label="% MS dieta" val={fmt(b.avg_pct_ms_dieta, 1)} unit="%" />
              </div>
              {leiteSpark.length > 1 && (
                <div style={{ paddingTop: 10, borderTop: `1px dashed ${A.primaryLight}` }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7568', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Leite/vaca · 30d</div>
                  <Sparkline data={leiteSpark} color={c} height={36} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
