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

function fmtDateLabel(str) {
  if (!str) return ''
  const p = str.split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0].slice(2)}` : str
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
  formatY = v => Number(v).toFixed(1),
  refLines = [],
}) {
  const [containerRef, svgWidth] = useContainerWidth()
  const [hoverIdx, setHoverIdx] = useState(null)

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
  const ypad = rng * 0.12
  const yMin = lo - ypad, yMax = hi + ypad, yRange = yMax - yMin

  const len = Math.max(...series.map(s => (s.values || []).length), dates.length, 1)
  const stepX = innerW / Math.max(len - 1, 1)
  const xPos = i => pad.left + i * stepX
  const yPos = v => pad.top + innerH - ((v - yMin) / yRange) * innerH
  const ticks = Array.from({ length: 5 }, (_, i) => yMin + (yRange * i / 4))

  // X-axis: máx 8 labels distribuídos
  const maxL = Math.min(8, len)
  const lblStep = len <= maxL ? 1 : Math.floor((len - 1) / (maxL - 1))
  const xLabelIdxs = new Set()
  xLabelIdxs.add(0)
  xLabelIdxs.add(len - 1)
  for (let i = lblStep; i < len - 1; i += lblStep) xLabelIdxs.add(i)

  const handleMouseMove = useCallback(e => {
    const svg = e.currentTarget.closest('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mx = e.clientX - rect.left - pad.left
    const i = Math.round(mx / stepX)
    setHoverIdx(Math.max(0, Math.min(len - 1, i)))
  }, [pad.left, stepX, len])

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
              stroke="rgba(0,0,0,0.05)" strokeDasharray="2 4"
            />
            <text
              x={pad.left - 7} y={yPos(v) + 4}
              fontSize="10" fill="rgba(0,0,0,0.38)"
              textAnchor="end" fontFamily="inherit"
            >
              {formatY(v)}
            </text>
          </g>
        ))}

        {/* Eixo X — datas DD/MM/AA */}
        {showDates && [...xLabelIdxs].map(i => {
          const d = dates[i]
          if (!d) return null
          return (
            <text
              key={i}
              x={xPos(i)} y={height - pad.bottom + 18}
              fontSize="9.5" fill="#9ca299"
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
              strokeWidth={s.thick ? 2.6 : 1.8}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={s.dashed ? '4 3' : ''}
              opacity={s.dimmed ? 0.25 : 1}
            />
          )
        })}

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
