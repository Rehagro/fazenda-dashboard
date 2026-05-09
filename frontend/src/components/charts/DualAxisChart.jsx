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
 * Gráfico dual-axis: eixo Y esquerdo e direito com escalas independentes.
 * seriesLeft  — [{ label, color, values[] }]         → escala esquerda (sólido)
 * seriesRight — [{ label, color, values[], dashed? }] → escala direita (tracejado)
 * dates       — string[] YYYY-MM-DD
 */
export default function DualAxisChart({
  dates = [],
  seriesLeft = [],
  seriesRight = [],
  height = 300,
  formatLeft  = v => v.toFixed(1).replace('.', ','),
  formatRight = v => v.toFixed(0) + '%',
  labelLeft   = '',
  labelRight  = '',
  pad = { top: 24, right: 62, bottom: 46, left: 52 },
}) {
  const [containerRef, svgWidth] = useContainerWidth()
  const [hoverIdx, setHoverIdx] = useState(null)
  // ref para que handleMouseMove leia valores atualizados sem precisar de deps
  const chartRef = useRef({ padLeft: pad.left, stepX: 1, len: 1 })

  // todos os hooks ANTES de qualquer return condicional
  const handleMouseMove = useCallback(e => {
    const svg = e.currentTarget.closest('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const { padLeft, stepX, len } = chartRef.current
    setHoverIdx(Math.max(0, Math.min(len - 1, Math.round((e.clientX - rect.left - padLeft) / stepX))))
  }, [])

  if (!dates.length) return <div ref={containerRef} style={{ height }} />

  const innerW = svgWidth - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const len    = dates.length
  const stepX  = innerW / Math.max(len - 1, 1)
  const xPos   = i => pad.left + i * stepX

  // atualiza ref com valores computados para uso no handler
  chartRef.current = { padLeft: pad.left, stepX, len }

  function scaleFor(list) {
    const vals = list.flatMap(s => (s.values || []).filter(v => v != null && !isNaN(v)))
    if (!vals.length) return null
    const lo = Math.min(...vals), hi = Math.max(...vals)
    const rng = hi - lo || 1
    const { ticks, yMin, yMax, step } = niceScale(lo - rng * 0.06, hi + rng * 0.06)
    const yRange = yMax - yMin
    return {
      y: v => pad.top + innerH - ((v - yMin) / yRange) * innerH,
      ticks,
      step,
    }
  }

  const scaleL = scaleFor(seriesLeft)
  const scaleR = scaleFor(seriesRight)

  function buildPath(s, scale) {
    if (!scale) return null
    let d = ''
    ;(s.values || []).forEach((v, i) => {
      if (v == null || isNaN(v)) return
      const pt = `${xPos(i).toFixed(1)},${scale.y(v).toFixed(1)}`
      const prev = (s.values || [])[i - 1]
      d += (prev != null && !isNaN(prev)) ? ` L ${pt}` : ` M ${pt}`
    })
    return d || null
  }

  // X-axis labels: max 8
  const maxL = Math.min(8, len)
  const lblStep = len <= maxL ? 1 : Math.floor((len - 1) / (maxL - 1))
  const xLabelIdxs = new Set([0, len - 1])
  for (let i = lblStep; i < len - 1; i += lblStep) xLabelIdxs.add(i)

  const hx = hoverIdx != null ? xPos(hoverIdx) : 0
  const tooltipRight = svgWidth > 0 && hx > svgWidth * 0.55

  const hoverValsL = hoverIdx != null
    ? seriesLeft.map(s => ({ label: s.label, color: s.color, v: (s.values || [])[hoverIdx], fmt: formatLeft })).filter(x => x.v != null && !isNaN(x.v))
    : []
  const hoverValsR = hoverIdx != null
    ? seriesRight.map(s => ({ label: s.label, color: s.color, v: (s.values || [])[hoverIdx], fmt: formatRight })).filter(x => x.v != null && !isNaN(x.v))
    : []
  const hoverVals = [...hoverValsL, ...hoverValsR]

  const tooltipW = hoverVals.length
    ? Math.max(90, ...hoverVals.map(x => x.label.length * 6 + String(x.fmt(x.v)).length * 7 + 30))
    : 90
  const tooltipH = hoverVals.length * 17 + 10
  const tooltipBx = tooltipRight ? hx - tooltipW - 10 : hx + 10
  const tooltipBy = pad.top + 6

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg
        width={svgWidth} height={height}
        style={{ display: 'block', overflow: 'visible', cursor: 'crosshair' }}
      >
        {/* Grade + eixo Y esquerdo */}
        {scaleL && scaleL.ticks.map((v, i) => (
          <g key={i}>
            <line
              x1={pad.left} y1={scaleL.y(v)}
              x2={svgWidth - pad.right} y2={scaleL.y(v)}
              stroke="rgba(0,0,0,0.07)" strokeDasharray="3 5"
            />
            <text
              x={pad.left - 7} y={scaleL.y(v) + 4}
              fontSize="11" fill="#64748b"
              textAnchor="end" fontFamily="inherit"
            >
              {fmtTick(v, scaleL.step)}
            </text>
          </g>
        ))}

        {/* Eixo Y direito */}
        {scaleR && scaleR.ticks.map((v, i) => (
          <text
            key={i}
            x={svgWidth - pad.right + 7} y={scaleR.y(v) + 4}
            fontSize="11" fill="#d97706"
            textAnchor="start" fontFamily="inherit"
          >
            {fmtTick(v, scaleR.step)}
          </text>
        ))}

        {/* Bordas dos eixos */}
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + innerH} stroke="rgba(0,0,0,0.1)" />
        <line x1={pad.left} y1={pad.top + innerH} x2={svgWidth - pad.right} y2={pad.top + innerH} stroke="rgba(0,0,0,0.08)" />
        <line x1={svgWidth - pad.right} y1={pad.top} x2={svgWidth - pad.right} y2={pad.top + innerH} stroke="rgba(217,119,6,0.25)" />

        {/* Rótulos dos eixos (opcionais) */}
        {labelLeft && (
          <text
            x={-(pad.top + innerH / 2)} y={12}
            fontSize="9.5" fill="rgba(0,0,0,0.4)" textAnchor="middle" fontFamily="inherit"
            transform="rotate(-90)"
          >
            {labelLeft}
          </text>
        )}
        {labelRight && (
          <text
            x={pad.top + innerH / 2} y={-(svgWidth - 10)}
            fontSize="9.5" fill="#d97706" textAnchor="middle" fontFamily="inherit"
            transform="rotate(90)"
          >
            {labelRight}
          </text>
        )}

        {/* Eixo X — datas DD/mês */}
        {[...xLabelIdxs].map(i => {
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

        {/* Linhas — eixo esquerdo */}
        {seriesLeft.map(s => {
          const d = buildPath(s, scaleL)
          if (!d) return null
          return (
            <path
              key={s.label} d={d}
              stroke={s.color} strokeWidth={2.2}
              fill="none" strokeLinecap="round" strokeLinejoin="round"
            />
          )
        })}

        {/* Linhas — eixo direito (tracejadas) */}
        {seriesRight.map(s => {
          const d = buildPath(s, scaleR)
          if (!d) return null
          return (
            <path
              key={s.label} d={d}
              stroke={s.color} strokeWidth={2.2}
              fill="none" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={s.dashed !== false ? '5 3' : ''}
            />
          )
        })}

        {/* Pontos permanentes nos dados (até 20 datas) */}
        {len <= 20 && scaleL && seriesLeft.map(s =>
          (s.values || []).map((v, i) => {
            if (v == null || isNaN(v)) return null
            return <circle key={`L-${s.label}-${i}`} cx={xPos(i)} cy={scaleL.y(v)} r={2.5} fill={s.color} stroke="#fff" strokeWidth={1.5} opacity={0.9} />
          })
        )}
        {len <= 20 && scaleR && seriesRight.map(s =>
          (s.values || []).map((v, i) => {
            if (v == null || isNaN(v)) return null
            return <circle key={`R-${s.label}-${i}`} cx={xPos(i)} cy={scaleR.y(v)} r={2.5} fill={s.color} stroke="#fff" strokeWidth={1.5} opacity={0.9} />
          })
        )}

        {/* Hover */}
        {hoverIdx != null && (
          <>
            <line
              x1={hx} y1={pad.top} x2={hx} y2={pad.top + innerH}
              stroke="#1a1f1a" strokeWidth={1} strokeDasharray="2 2" opacity={0.18}
            />
            {seriesLeft.map(s => {
              const v = (s.values || [])[hoverIdx]
              if (v == null || isNaN(v) || !scaleL) return null
              return <circle key={s.label} cx={hx} cy={scaleL.y(v)} r={4} fill={s.color} stroke="#fff" strokeWidth={1.5} />
            })}
            {seriesRight.map(s => {
              const v = (s.values || [])[hoverIdx]
              if (v == null || isNaN(v) || !scaleR) return null
              return <circle key={s.label} cx={hx} cy={scaleR.y(v)} r={4} fill={s.color} stroke="#fff" strokeWidth={1.5} />
            })}
            {/* Data no eixo */}
            {dates[hoverIdx] && (
              <g>
                <rect x={hx - 27} y={pad.top + innerH + 2} width={54} height={15} rx={3} fill="#1a1f1a" opacity={0.7} />
                <text x={hx} y={pad.top + innerH + 13} fontSize="9" fill="#fff" textAnchor="middle" fontFamily="inherit">
                  {fmtDateLabel(dates[hoverIdx])}
                </text>
              </g>
            )}
            {/* Painel de valores */}
            {hoverVals.length > 0 && (
              <g>
                <rect x={tooltipBx} y={tooltipBy} width={tooltipW} height={tooltipH} rx={5} fill="#1a1f1a" opacity={0.85} />
                {hoverVals.map((x, i) => (
                  <g key={x.label}>
                    <circle cx={tooltipBx + 10} cy={tooltipBy + 12 + i * 17} r={3.5} fill={x.color} />
                    <text x={tooltipBx + 20} y={tooltipBy + 16 + i * 17} fontSize="10" fill="#fff" fontFamily="inherit">
                      {x.label}: {x.fmt(x.v)}
                    </text>
                  </g>
                ))}
              </g>
            )}
          </>
        )}

        {/* Área de hover */}
        <rect
          x={pad.left} y={pad.top} width={innerW} height={innerH}
          fill="transparent"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
        />
      </svg>
    </div>
  )
}
