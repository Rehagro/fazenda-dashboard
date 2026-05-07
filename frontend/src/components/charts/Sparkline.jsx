export default function Sparkline({ data, color = '#3F8B4F', width = 240, height = 32, strokeWidth = 2 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  const pts = data.map((v, i) => [i * stepX, height - 4 - ((v - min) / range) * (height - 8)])
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const fill = `${path} L ${width} ${height} L 0 ${height} Z`
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', width: '100%', height }} preserveAspectRatio="none">
      <path d={fill} fill={color} fillOpacity="0.12" />
      <path d={path} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3" fill={color} />
      <circle cx={lx} cy={ly} r="6" fill={color} fillOpacity="0.2" />
    </svg>
  )
}
