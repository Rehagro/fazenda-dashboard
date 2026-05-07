import { useRef, useState, useEffect } from 'react'

function useContainerWidth(fallback = 560) {
  const ref = useRef(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    if (!ref.current) return
    const obs = new ResizeObserver(e => setWidth(Math.floor(e[0].contentRect.width)))
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, width]
}

function fmtDateShort(str) {
  if (!str) return ''
  const parts = str.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`
  return str
}

/**
 * Gráfico de linha com dois eixos Y independentes.
 * seriesLeft  — array de { label, color, values[] }  → escala esquerda
 * seriesRight — array de { label, color, values[], dashed? } → escala direita
 * dates       — array de strings YYYY-MM-DD (eixo X compartilhado)
 */
export default function DualAxisChart({
  dates = [],
  seriesLeft = [],
  seriesRight = [],
  height = 300,
  formatLeft  = v => v.toFixed(1),
  formatRight = v => v.toFixed(0) + '%',
  padding = { top: 16, right: 58, bottom: 44, left: 50 },
}) {
  const [containerRef, svgWidth] = useContainerWidth()

  if (!dates.length) return <div ref={containerRef} style={{ width: '100%', height }} />

  const innerW = svgWidth - padding.left - padding.right
  const innerH = height  - padding.top  - padding.bottom
  const len    = dates.length
  const stepX  = innerW / Math.max(len - 1, 1)
  const xPos   = i => padding.left + i * stepX

  function scaleFor(seriesList) {
    const allVals = seriesList.flatMap(s => (s.values || []).filter(v => v != null && !isNaN(v)))
    if (!allVals.length) return null
    const lo = Math.min(...allVals)
    const hi = Math.max(...allVals)
    const rng = hi - lo || 1
    const pad = rng * 0.15
    const yMin = lo - pad, yMax = hi + pad, yRange = yMax - yMin
    return {
      yMin, yMax, yRange,
      y: v => padding.top + innerH - ((v - yMin) / yRange) * innerH,
      ticks: Array.from({ length: 5 }, (_, i) => yMin + (yRange * i / 4)),
    }
  }

  const scaleL = scaleFor(seriesLeft)
  const scaleR = scaleFor(seriesRight)

  function renderLine(s, scale) {
    if (!scale) return null
    let d = ''
    ;(s.values || []).forEach((v, i) => {
      if (v == null || isNaN(v)) return
      const pt = `${xPos(i).toFixed(1)},${scale.y(v).toFixed(1)}`
      d += d === '' || (s.values[i - 1] == null || isNaN(s.values[i - 1])) ? `M ${pt}` : ` L ${pt}`
    })
    if (!d) return null
    return (
      <path
        key={s.label}
        d={d}
        stroke={s.color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={s.dashed ? '5 3' : ''}
      />
    )
  }

  // X-axis: mostrar no máximo 8 labels, distribuídos
  const maxLabels = Math.min(8, len)
  const step = Math.ceil(len / maxLabels)
  const xLabels = dates.reduce((acc, d, i) => {
    if (i === 0 || i === len - 1 || i % step === 0) acc.push({ i, label: fmtDateShort(d) })
    return acc
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg width={svgWidth} height={height} style={{ display: 'block', overflow: 'visible' }}>
        {/* Grid lines */}
        {scaleL && scaleL.ticks.map((v, i) => (
          <line
            key={i}
            x1={padding.left} y1={scaleL.y(v)}
            x2={svgWidth - padding.right} y2={scaleL.y(v)}
            stroke="rgba(0,0,0,0.06)" strokeDasharray="3 4"
          />
        ))}

        {/* Left Y-axis ticks */}
        {scaleL && scaleL.ticks.map((v, i) => (
          <text
            key={i}
            x={padding.left - 8} y={scaleL.y(v) + 4}
            fontSize="10" fill="#6b7568" textAnchor="end" fontFamily="inherit"
          >
            {formatLeft(v)}
          </text>
        ))}

        {/* Right Y-axis ticks */}
        {scaleR && scaleR.ticks.map((v, i) => (
          <text
            key={i}
            x={svgWidth - padding.right + 8} y={scaleR.y(v) + 4}
            fontSize="10" fill="#d97706" textAnchor="start" fontFamily="inherit"
          >
            {formatRight(v)}
          </text>
        ))}

        {/* X-axis date labels */}
        {xLabels.map(({ i, label }) => (
          <text
            key={i}
            x={xPos(i)} y={height - padding.bottom + 16}
            fontSize="10" fill="#9ca299" textAnchor="middle" fontFamily="inherit"
          >
            {label}
          </text>
        ))}

        {/* Axis lines */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="rgba(0,0,0,0.1)" />
        <line x1={svgWidth - padding.right} y1={padding.top} x2={svgWidth - padding.right} y2={padding.top + innerH} stroke="rgba(210,151,6,0.3)" />
        <line x1={padding.left} y1={padding.top + innerH} x2={svgWidth - padding.right} y2={padding.top + innerH} stroke="rgba(0,0,0,0.08)" />

        {/* Data lines — left scale */}
        {seriesLeft.map(s => renderLine(s, scaleL))}

        {/* Data lines — right scale */}
        {seriesRight.map(s => renderLine(s, scaleR))}
      </svg>
    </div>
  )
}
