export default function MultiLineChart({
  series, height = 240,
  padding = { top: 16, right: 16, bottom: 28, left: 36 },
  formatY = (v) => v,
  width = 560,
}) {
  if (!series || !series.length) return null
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const allVals = series.flatMap(s => s.values)
  const min = Math.min(...allVals)
  const max = Math.max(...allVals)
  const range = max - min || 1
  const pad = range * 0.1
  const yMin = min - pad, yMax = max + pad, yRange = yMax - yMin
  const len = series[0].values.length
  const stepX = innerW / Math.max(len - 1, 1)
  const x = (i) => padding.left + i * stepX
  const y = (v) => padding.top + innerH - ((v - yMin) / yRange) * innerH
  const ticks = Array.from({ length: 5 }, (_, i) => yMin + (yRange * i / 4))
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={padding.left} y1={y(v)} x2={width - padding.right} y2={y(v)} stroke="rgba(0,0,0,0.05)" strokeDasharray="2 3" />
          <text x={padding.left - 6} y={y(v) + 3} fontSize="10" fill="rgba(0,0,0,0.35)" textAnchor="end" fontFamily="inherit">{formatY(v)}</text>
        </g>
      ))}
      {series.map((s) => {
        const d = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
        return (
          <path key={s.label} d={d} stroke={s.color} strokeWidth={s.thick ? 2.6 : 1.8}
            fill="none" strokeLinecap="round" strokeLinejoin="round"
            opacity={s.dimmed ? 0.25 : 1} strokeDasharray={s.dashed ? '4 3' : ''} />
        )
      })}
    </svg>
  )
}
