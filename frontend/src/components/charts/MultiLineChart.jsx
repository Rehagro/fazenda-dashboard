import { useRef, useState, useEffect, useCallback } from 'react'

function useContainerWidth(fallback = 560) {
  const ref = useRef(null)
  const [w, setW] = useState(fallback)
  useEffect(() => {
    if (!ref.current) return
    const obs = new ResizeObserver(e => setW(Math.floor(e[0].contentRect.width)))
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, w]
}

const MONTHS_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
function fmtDateLabel(str) {
  if (!str) return ''
  const p = str.split('-')
  return p.length === 3 ? `${p[2]}/${MONTHS_PT[Number(p[1]) - 1]}` : str
}

function niceScale(lo, hi, n = 5) {
  if (lo === hi) { lo -= 1; hi += 1 }
  const rawStep = (hi - lo) / (n - 1)
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const niceStep = [1, 2, 2.5, 5, 10].map(f => f * mag).find(s => s >= rawStep) || mag
  const niceMin = Math.floor(lo / niceStep) * niceStep
  const ticks = Array.from({ length: n }, (_, i) =>
    parseFloat((niceMin + i * niceStep).toFixed(10))
  )
  return { ticks, yMin: ticks[0], yMax: ticks[ticks.length - 1], step: niceStep }
}

function fmtTick(v, step) {
  return v.toFixed(step >= 1 ? 0 : 1).replace('.', ',')
}

/**
 * series   — [{ label, color, values[], thick?, dashed?, dimmed? }]
 * dates    — string[] YYYY-MM-DD (aligned with values index)
 * refLines — [{ value, color, label?, dashed? }]
 */
export default function MultiLineChart({
  series = [],
  dates = [],
  height = 240,
  formatY = v => Number(v).toFixed(1).replace('.', ','),
  refLines = [],
}) {
  const [containerRef, svgWidth] = useContainerWidth()
  const [hoverIdx, setHoverIdx] = useState(null)
  // ref para que handleMouseMove leia valores atualizados sem precisar de deps
  const chartRef = useRef({ padLeft: 46, stepX: 1, len: 1 })

  // todos os hooks ANTES de qualquer return condicional
  const handleMouseMove = useCallback(e => {
    const svg = e.currentTarget.closest('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const { padLeft, stepX, len } = chartRef.current
    const i = Math.round((e.clientX - rect.left - padLeft) / stepX)
    setHoverIdx(Math.max(0, Math.min(len - 1, i)))
  }, [])

  if (!series.length) return <div ref={containerRef} />

  const showDates = dates.length > 0
  const hasRef = refLines.length > 0
  const pad = {
    top: 20,
    right: hasRef ? 78 : 20,
    bottom: showDates ? 46 : 28,
    left: 46,
  }

  const innerW = svgWidth - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const allVals = series.flatMap(s => (s.values || []).filter(v => v != null && !isNaN(v)))
  const refVals = refLines.map(r => r.value).filter(v => v != null)
  if (!allVals.length) return <div ref={containerRef} style={{ height }} />

  const lo = Math.min(...allVals, ...refVals)
  const hi = Math.max(...allVals, ...refVals)
  const rng = hi - lo || 1
  const { ticks, yMin, yMax, step: niceStep } = niceScale(lo - rng * 0.06, hi + rng * 0.06)
  const yRange = yMax - yMin

  const len = Math.max(...series.map(s => (s.values || []).length), dates.length, 1)
  const stepX = innerW / Math.max(len - 1, 1)
  const xPos = i => pad.left + i * stepX
  const yPos = v => pad.top + innerH - ((v - yMin) / yRange) * innerH

  // atualiza ref com valores computados para uso no handler
  chartRef.current = { padLeft: pad.left, stepX, len }

  // X-axis: máx 8 labels distribuídos
  const maxL = Math.min(8, len)
  const lblStep = len <= maxL ? 1 : Math.floor((len - 1) / (maxL - 1))
  const xLabelIdxs = new Set()
  xLabelIdxs.add(0)
  xLabelIdxs.add(len - 1)
  for (let i = lblStep; i < len - 1; i += lblStep) xLabelIdxs.add(i)

  // Tooltip position: evitar sair da tela
  const tooltipX = hoverIdx != null ? xPos(hoverIdx) : 0
  const tooltipRight = svgWidth > 0 && tooltipX > svgWidth * 0.55

  const hoverVals = hoverIdx != null
    ? series
        .map(s => ({ label: s.label, color: s.color, v: (s.values || [])[hoverIdx] }))
        .filter(x => x.v != null && !isNaN(x.v))
    : []

  // Largura dinâmica do tooltip
  const tooltipW = hoverVals.length
    ? Math.max(80, ...hoverVals.map(x => x.label.length * 6 + String(formatY(x.v)).length * 7 + 30))
    : 80
  const tooltipH = hoverVals.length * 17 + 10
  const tooltipBx = tooltipRight ? tooltipX - tooltipW - 10 : tooltipX + 10
  const tooltipBy = pad.top + 6

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg
        width={svgWidth} height={height}
        style={{ display: 'block', overflow: 'visible', cursor: 'crosshair' }}
      >
        {/* Grade horizontal */}
        {ticks.map((v, i) => (
          <g key={i}>
            <line
              x1={pad.left} y1={yPos(v)}
              x2={svgWidth - pad.right} y2={yPos(v)}
              stroke="rgba(0,0,0,0.07)" strokeDasharray="3 5"
            />
            <text
              x={pad.left - 7} y={yPos(v) + 4}
              fontSize="11" fill="#64748b"
              textAnchor="end" fontFamily="inherit"
            >
              {fmtTick(v, niceStep)}
            </text>
          </g>
        ))}

        {/* Eixo X — datas DD/mês */}
        {showDates && [...xLabelIdxs].map(i => {
          const d = dates[i]
          if (!d) return null
          return (
            <text
              key={i}
              x={xPos(i)} y={height - pad.bottom + 18}
              fontSize="10.5" fill="#64748b"
              textAnchor="middle" fontFamily="inherit"
            >
              {fmtDateLabel(d)}
            </text>
          )
        })}

        {/* Linhas dos lotes */}
        {series.map(s => {
          const vals = s.values || []
          let d = ''
          vals.forEach((v, i) => {
            if (v == null || isNaN(v)) return
            const pt = `${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`
            const prevOk = i > 0 && vals[i - 1] != null && !isNaN(vals[i - 1])
            d += prevOk ? ` L ${pt}` : ` M ${pt}`
          })
          if (!d) return null
          return (
            <path
              key={s.label}
              d={d}
              stroke={s.color}
              strokeWidth={s.thick ? 2.8 : 2.2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={s.dashed ? '4 3' : ''}
              opacity={s.dimmed ? 0.25 : 1}
            />
          )
        })}

        {/* Pontos permanentes nos dados (até 20 datas) */}
        {len <= 20 && series.map(s =>
          (s.values || []).map((v, i) => {
            if (v == null || isNaN(v) || s.dimmed) return null
            return (
              <circle
                key={`${s.label}-${i}`}
                cx={xPos(i)} cy={yPos(v)}
                r={2.5} fill={s.color} stroke="#fff" strokeWidth={1.5}
                opacity={0.9}
              />
            )
          })
        )}

        {/* Linhas de referência (metas) */}
        {refLines.map((r, i) => (
          <g key={i}>
            <line
              x1={pad.left} y1={yPos(r.value)}
              x2={svgWidth - pad.right} y2={yPos(r.value)}
              stroke={r.color || '#94a3b8'} strokeWidth={1.4}
              strokeDasharray={r.dashed !== false ? '5 3' : ''}
              opacity={0.85}
            />
            {r.label && (
              <text
                x={svgWidth - pad.right + 5} y={yPos(r.value) + 4}
                fontSize="9" fill={r.color || '#94a3b8'} fontFamily="inherit"
              >
                {r.label}
              </text>
            )}
          </g>
        ))}

        {/* Hover: cursor + dots + tooltip */}
        {hoverIdx != null && (
          <>
            {/* Linha vertical */}
            <line
              x1={xPos(hoverIdx)} y1={pad.top}
              x2={xPos(hoverIdx)} y2={pad.top + innerH}
              stroke="#1a1f1a" strokeWidth={1} strokeDasharray="2 2" opacity={0.18}
            />
            {/* Pontos nos lotes */}
            {series.map(s => {
              const v = (s.values || [])[hoverIdx]
              if (v == null || isNaN(v)) return null
              return (
                <circle
                  key={s.label}
                  cx={xPos(hoverIdx)} cy={yPos(v)}
                  r={4} fill={s.color} stroke="#fff" strokeWidth={1.5}
                />
              )
            })}
            {/* Data no fundo */}
            {dates[hoverIdx] && (
              <g>
                <rect
                  x={xPos(hoverIdx) - 26} y={pad.top + innerH + 2}
                  width={52} height={15} rx={3}
                  fill="#1a1f1a" opacity={0.7}
                />
                <text
                  x={xPos(hoverIdx)} y={pad.top + innerH + 13}
                  fontSize="9" fill="#fff" textAnchor="middle" fontFamily="inherit"
                >
                  {fmtDateLabel(dates[hoverIdx])}
                </text>
              </g>
            )}
            {/* Painel de valores */}
            {hoverVals.length > 0 && (
              <g>
                <rect
                  x={tooltipBx} y={tooltipBy}
                  width={tooltipW} height={tooltipH}
                  rx={5} fill="#1a1f1a" opacity={0.85}
                />
                {hoverVals.map((x, i) => (
                  <g key={x.label}>
                    <circle cx={tooltipBx + 10} cy={tooltipBy + 12 + i * 17} r={3.5} fill={x.color} />
                    <text
                      x={tooltipBx + 20} y={tooltipBy + 16 + i * 17}
                      fontSize="10" fill="#fff" fontFamily="inherit"
                    >
                      {x.label}: {formatY(x.v)}
                    </text>
                  </g>
                ))}
              </g>
            )}
          </>
        )}

        {/* Área invisível para capturar hover */}
        <rect
          x={pad.left} y={pad.top}
          width={innerW} height={innerH}
          fill="transparent"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
        />
      </svg>
    </div>
  )
}
