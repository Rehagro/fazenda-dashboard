/**
 * Gráfico de linha com dois eixos Y independentes.
 * seriesLeft  — array de { label, color, values[], dashed? }  → escala esquerda
 * seriesRight — array de { label, color, values[], dashed? }  → escala direita
 * dates       — array de strings (eixo X compartilhado)
 */
export default function DualAxisChart({
  dates = [],
  seriesLeft = [],
  seriesRight = [],
  height = 280,
  width = 560,
  formatLeft  = v => v.toFixed(1),
  formatRight = v => v.toFixed(1),
  padding = { top: 16, right: 52, bottom: 28, left: 44 },
}) {
  if (!dates.length) return null

  const innerW = width  - padding.left - padding.right
  const innerH = height - padding.top  - padding.bottom
  const len    = dates.length
  const stepX  = innerW / Math.max(len - 1, 1)

  const xPos = i => padding.left + i * stepX

  function scaleFor(seriesList) {
    const allVals = seriesList.flatMap(s => s.values.filter(v => v != null && !isNaN(v)))
    if (!allVals.length) return null
    const lo = Math.min(...allVals)
    const hi = Math.max(...allVals)
    const rng = hi - lo || 1
    const pad = rng * 0.12
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
    const pts = s.values
      .map((v, i) => {
        if (v == null || isNaN(v)) return null
        return `${xPos(i).toFixed(1)},${scale.y(v).toFixed(1)}`
      })
    // Build path segments (skip nulls)
    let d = ''
    pts.forEach((pt, i) => {
      if (!pt) return
      const prev = pts[i - 1]
      d += prev ? ` L ${pt}` : ` M ${pt}`
    })
    if (!d) return null
    return (
      <path
        key={s.label}
        d={d}
        stroke={s.color}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={s.dashed ? '4 3' : ''}
        opacity={s.dimmed ? 0.3 : 1}
      />
    )
  }

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      {/* Grid + left axis ticks */}
      {scaleL && scaleL.ticks.map((v, i) => (
        <g key={i}>
          <line
            x1={padding.left} y1={scaleL.y(v)}
            x2={width - padding.right} y2={scaleL.y(v)}
            stroke="rgba(0,0,0,0.05)" strokeDasharray="2 3"
          />
          <text
            x={padding.left - 6} y={scaleL.y(v) + 3}
            fontSize="10" fill="rgba(0,0,0,0.38)" textAnchor="end" fontFamily="inherit"
          >
            {formatLeft(v)}
          </text>
        </g>
      ))}

      {/* Right axis ticks */}
      {scaleR && scaleR.ticks.map((v, i) => (
        <text
          key={i}
          x={width - padding.right + 6} y={scaleR.y(v) + 3}
          fontSize="10" fill="rgba(0,0,0,0.38)" textAnchor="start" fontFamily="inherit"
        >
          {formatRight(v)}
        </text>
      ))}

      {/* Lines — left scale */}
      {seriesLeft.map(s => renderLine(s, scaleL))}

      {/* Lines — right scale */}
      {seriesRight.map(s => renderLine(s, scaleR))}
    </svg>
  )
}
