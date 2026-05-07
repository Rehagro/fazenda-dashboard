import { useMemo, useState } from 'react'
import KPICard from '../ui/KPICard'
import Card from '../ui/Card'
import SectionHeader from '../ui/SectionHeader'
import HBarChart from '../charts/HBarChart'
import MultiLineChart from '../charts/MultiLineChart'
import DualAxisChart from '../charts/DualAxisChart'
import Icon from '../ui/Icon'
import { fmt, fmtInt } from '../../utils/format'
import { pivotByDate } from '../charts/chartUtils'

function Legend({ series }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px dashed #d4e8d4' }}>
      {series.map(s => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#3a4438' }}>
          <span style={{ width: 14, height: 3, background: s.dashed ? 'none' : s.color, borderRadius: 2, borderTop: s.dashed ? `2px dashed ${s.color}` : 'none' }} />
          {s.label} {s.axisLabel && <span style={{ fontSize: 10, color: '#9ca299', fontWeight: 500 }}>({s.axisLabel})</span>}
        </div>
      ))}
    </div>
  )
}

function BatchTable({ batch, colors, A, metaSobraMap }) {
  const effBg    = v => v >= 1.5 ? '#dcf3e0' : v >= 1.3 ? '#fef3d4' : '#fde8e8'
  const effColor = v => v >= 1.5 ? '#1f6b30' : v >= 1.3 ? '#8a5a00' : '#a83232'
  const sobraBg  = (v, meta) => {
    if (v == null) return 'transparent'
    if (meta == null) return '#f3f4f6'
    return v <= meta ? '#dcf3e0' : '#fde8e8'
  }
  const sobraColor = (v, meta) => {
    if (v == null || meta == null) return '#6b7568'
    return v <= meta ? '#1f6b30' : '#a83232'
  }

  return (
    <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', border: `1px solid ${A.primaryLight}` }}>
      <div style={{ padding: '14px 22px', borderBottom: `1px solid ${A.primaryLight}` }}>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Análise ponderada por lote</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: A.bg }}>
              {['Lote', 'Vacas', 'Leite/vaca', 'CMS/vaca', 'Eficiência', '% Forragem', '% Sobra', 'Meta Sobra'].map((h, i) => (
                <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#3a4438', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batch.map(row => {
              const meta = metaSobraMap?.[row.lote]
              return (
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
                    {row.eficiencia_pond != null ? (
                      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 12, padding: '3px 9px', borderRadius: 6, background: effBg(row.eficiencia_pond), color: effColor(row.eficiencia_pond) }}>
                        {row.eficiencia_pond.toFixed(3)}
                      </span>
                    ) : <span style={{ color: '#9ca299' }}>—</span>}
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(row.avg_forragem, 1)}%</td>
                  <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                    {row.avg_pct_sobra != null ? (
                      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 12, padding: '3px 9px', borderRadius: 6, background: sobraBg(row.avg_pct_sobra, meta), color: sobraColor(row.avg_pct_sobra, meta) }}>
                        {row.avg_pct_sobra.toFixed(1)}%
                      </span>
                    ) : <span style={{ color: '#9ca299' }}>—</span>}
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', color: '#6b7568', fontVariantNumeric: 'tabular-nums' }}>
                    {meta != null ? `${meta}%` : '—'}
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

export default function DietTab({ ctx, A }) {
  const { lotes, colors, batch, rows, k, metaSobra, filters } = ctx
  const [dualLote, setDualLote] = useState(null)  // lote selecionado para dual-axis

  const fazenda = filters?.fazenda || ''

  // Meta de sobra por lote (para a fazenda atual)
  const metaSobraMap = useMemo(() => {
    const m = {}
    for (const ms of (metaSobra || [])) {
      if (ms.fazenda === fazenda) m[ms.lote] = ms.meta_pct
    }
    return m
  }, [metaSobra, fazenda])

  // Lote selecionado para gráfico dual-axis (default = primeiro lote)
  const selectedLote = dualLote || (lotes.length ? lotes[0] : null)

  // Séries por lote ordenadas por data
  const byLote = useMemo(() => {
    const m = {}
    for (const r of rows) {
      if (!m[r.lote]) m[r.lote] = []
      m[r.lote].push(r)
    }
    for (const l of Object.keys(m)) {
      m[l].sort((a, b) => a.data_registro.localeCompare(b.data_registro))
    }
    return m
  }, [rows])

  // Master dates array — all unique dates across all lotes
  const allDates = useMemo(
    () => [...new Set(rows.map(r => r.data_registro))].sort(),
    [rows]
  )

  // Datas comuns para dual-axis do lote selecionado
  const dualDates = useMemo(() => {
    if (!selectedLote || !byLote[selectedLote]) return []
    return byLote[selectedLote].map(r => r.data_registro)
  }, [selectedLote, byLote])

  // CMS/vaca por lote — aligned to allDates
  const cmsSeries = useMemo(() => lotes.map(l => {
    const dataMap = {}
    rows.filter(r => r.lote === l).forEach(r => { dataMap[r.data_registro] = r.consumo_ms_vaca })
    return { label: l, color: colors[l], values: allDates.map(d => dataMap[d] ?? null) }
  }), [lotes, rows, colors, allDates])

  // Eficiência por lote — aligned to allDates
  const efSeries = useMemo(() => lotes.map(l => {
    const dataMap = {}
    rows.filter(r => r.lote === l).forEach(r => { dataMap[r.data_registro] = r.eficiencia_alimentar })
    return { label: l, color: colors[l], values: allDates.map(d => dataMap[d] ?? null) }
  }), [lotes, rows, colors, allDates])

  // % Sobra por lote (com refLines de meta) — aligned to allDates
  const sobraSeries = useMemo(() => lotes
    .filter(l => byLote[l]?.some(r => r.pct_sobra != null))
    .map(l => {
      const dataMap = {}
      ;(byLote[l] || []).forEach(r => { dataMap[r.data_registro] = r.pct_sobra })
      return { label: l, color: colors[l], values: allDates.map(d => dataMap[d] ?? null) }
    }), [lotes, byLote, colors, allDates])

  const sobraRefLines = Object.entries(metaSobraMap).map(([lote, meta]) => ({
    value: meta,
    color: colors[lote] || '#94a3b8',
    label: `meta ${lote.split(' ')[0]}`,
    dashed: true,
  }))

  // Dual-axis: % forragem (right) + CMS/vaca (left) para lote selecionado
  const dualCmsLeft = selectedLote && byLote[selectedLote] ? [{
    label: `CMS/vaca — ${selectedLote}`,
    color: colors[selectedLote] || '#16a34a',
    values: byLote[selectedLote].map(r => r.consumo_ms_vaca),
  }] : []

  const dualForrRight = selectedLote && byLote[selectedLote] ? [{
    label: `% Forragem — ${selectedLote}`,
    color: '#d97706',
    values: byLote[selectedLote].map(r => r.percentual_forragem),
    dashed: true,
  }] : []

  // Dual-axis: % forragem (right) + Leite/vaca (left) para lote selecionado
  const dualLeiteLeft = selectedLote && byLote[selectedLote] ? [{
    label: `Leite/vaca — ${selectedLote}`,
    color: colors[selectedLote] || '#16a34a',
    values: byLote[selectedLote].map(r => r.leite_por_vaca),
  }] : []

  const hasSobra   = sobraSeries.length > 0
  const hasDual    = dualDates.length > 0 && dualCmsLeft.length > 0

  return (
    <>
      <SectionHeader A={A} eyebrow="Dieta & CMS" title="Consumo de matéria seca e forragem" subtitle="Evolução diária, ranking e análise por lote" />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KPICard A={A} kpi={{ icon: 'flask',  label: 'CMS/vaca',      value: fmt(k.ms_vaca_rebanho, 1),     unit: 'kg MS/vaca', color: A.primary,  sub: 'ponderado' }} />
        <KPICard A={A} kpi={{ icon: 'leaf',   label: '% Forragem',    value: fmt(k.avg_forragem, 1),        unit: '%',          color: '#16a34a', sub: '50–60% saudável' }} />
        <KPICard A={A} kpi={{ icon: 'wheat',  label: '% MS forragem', value: fmt(k.avg_pct_ms_forragem, 1), unit: '%',          color: '#65a30d', sub: 'matéria seca' }} />
        <KPICard A={A} kpi={{ icon: 'layers', label: '% Sobra média',  value: fmt(k.avg_pct_sobra, 1),       unit: '%',          color: '#d97706', sub: 'última data' }} />
      </div>

      {/* CMS/vaca por lote */}
      <Card A={A} eyebrow="Evolução diária por lote" title="CMS por vaca · kg MS/vaca/dia">
        <MultiLineChart series={cmsSeries} dates={allDates} height={300} formatY={v => v.toFixed(1)} />
        <Legend series={cmsSeries} />
      </Card>

      {/* Eficiência + % Forragem */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Card A={A} eyebrow="Eficiência alimentar" title="kg leite / kg MS · evolução por lote">
          <MultiLineChart series={efSeries} dates={allDates} height={220} formatY={v => v.toFixed(2)} />
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

      {/* % Sobra vs Meta */}
      {hasSobra && (
        <Card A={A} eyebrow="Sobra da dieta" title="% sobra por lote vs meta">
          <MultiLineChart
            series={sobraSeries}
            dates={allDates}
            height={220}
            formatY={v => `${v.toFixed(1)}%`}
            refLines={sobraRefLines}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '1px dashed #d4e8d4', alignItems: 'center' }}>
            {sobraSeries.map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#3a4438' }}>
                <span style={{ width: 14, height: 3, background: s.color, borderRadius: 2 }} />
                {s.label}
              </div>
            ))}
            {sobraRefLines.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7568' }}>
                <span style={{ width: 14, height: 0, border: '1.5px dashed #94a3b8', borderRadius: 2 }} />
                Linhas tracejadas = metas (configure em Configurações)
              </div>
            )}
            {sobraRefLines.length === 0 && (
              <div style={{ fontSize: 11, color: '#9ca299', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="info" size={12} />
                Configure metas em <strong style={{ marginLeft: 3 }}>Configurações</strong>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Dual-axis: Forragem × CMS e Forragem × Leite */}
      {hasDual && (
        <>
          {/* Lote selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7568', textTransform: 'uppercase', letterSpacing: 1 }}>Análise de correlação · Lote:</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {lotes.map(l => (
                <button
                  key={l}
                  onClick={() => setDualLote(l)}
                  style={{
                    padding: '5px 12px', border: 'none', borderRadius: 7, cursor: 'pointer',
                    background: selectedLote === l ? colors[l] : '#f3f4f6',
                    color: selectedLote === l ? '#fff' : '#3a4438',
                    fontWeight: selectedLote === l ? 700 : 500,
                    fontSize: 12, fontFamily: 'inherit',
                    transition: 'background 0.12s',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Dual: % Forragem + CMS/vaca */}
            <Card A={A} eyebrow="Correlação forragem × consumo" title={`% Forragem e CMS/vaca — ${selectedLote}`}>
              <DualAxisChart
                dates={dualDates}
                seriesLeft={dualCmsLeft}
                seriesRight={dualForrRight}
                height={240}
                formatLeft={v => v.toFixed(1)}
                formatRight={v => `${v.toFixed(0)}%`}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 12, paddingTop: 12, borderTop: '1px dashed #d4e8d4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#3a4438' }}>
                  <span style={{ width: 14, height: 3, background: colors[selectedLote] || '#16a34a', borderRadius: 2 }} />
                  CMS/vaca (kg MS) — eixo esq.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#3a4438' }}>
                  <span style={{ width: 14, height: 0, border: '1.5px dashed #d97706' }} />
                  % Forragem — eixo dir.
                </div>
              </div>
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#fffbeb', borderRadius: 8, fontSize: 11.5, color: '#78350f', lineHeight: 1.5 }}>
                <Icon name="info" size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Observe se o aumento de forragem reduz ou aumenta o CMS ao longo do tempo.
              </div>
            </Card>

            {/* Dual: % Forragem + Leite/vaca */}
            <Card A={A} eyebrow="Correlação forragem × produção" title={`% Forragem e Leite/vaca — ${selectedLote}`}>
              <DualAxisChart
                dates={dualDates}
                seriesLeft={dualLeiteLeft}
                seriesRight={dualForrRight}
                height={240}
                formatLeft={v => v.toFixed(1)}
                formatRight={v => `${v.toFixed(0)}%`}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 12, paddingTop: 12, borderTop: '1px dashed #d4e8d4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#3a4438' }}>
                  <span style={{ width: 14, height: 3, background: colors[selectedLote] || '#16a34a', borderRadius: 2 }} />
                  Leite/vaca (kg) — eixo esq.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#3a4438' }}>
                  <span style={{ width: 14, height: 0, border: '1.5px dashed #d97706' }} />
                  % Forragem — eixo dir.
                </div>
              </div>
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#fffbeb', borderRadius: 8, fontSize: 11.5, color: '#78350f', lineHeight: 1.5 }}>
                <Icon name="info" size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Verifique se variações de forragem correlacionam com a produção de leite.
              </div>
            </Card>
          </div>
        </>
      )}

      <BatchTable batch={batch} colors={colors} A={A} metaSobraMap={metaSobraMap} />
    </>
  )
}
