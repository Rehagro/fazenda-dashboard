export default function ScatterChart({ points, height = 240, width = 480, xLabel = '', yLabel = '' }) {
  const pad = 36
  const innerW = width - pad * 2, innerH = height - pad * 2
  if (!points || !points.length) return null
  const xs = points.map(p => p.x), ys = points.map(p => p.y)
  const xMin = Math.min(...xs) * 0.95, xMax = Math.max(...xs) * 1.05
  const yMin = Math.min(...ys) * 0.95, yMax = Math.max(...ys) * 1.05
  const sx = (v) => pad + ((v - xMin) / (xMax - xMin)) * innerW
  const sy = (v) => pad + innerH - ((v - yMin) / (yMax - yMin)) * innerH
  const lineMin = Math.max(xMin, yMin), lineMax = Math.min(xMax, yMax)
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(0,0,0,0.12)" />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="rgba(0,0,0,0.12)" />
      <line x1={sx(lineMin)} y1={sy(lineMin)} x2={sx(lineMax)} y2={sy(lineMax)} stroke="rgba(0,0,0,0.2)" strokeDasharray="4 4" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r="8" fill={p.color} fillOpacity="0.25" />
          <circle cx={sx(p.x)} cy={sy(p.y)} r="5" fill={p.color} />
          <text x={sx(p.x) + 8} y={sy(p.y) - 8} fontSize="10" fontWeight="600" fill="#374151">{p.label}</text>
        </g>
      ))}
      <text x={width / 2} y={height - 6} fontSize="10" fill="rgba(0,0,0,0.4)" textAnchor="middle">{xLabel}</text>
      <text x={10} y={height / 2} fontSize="10" fill="rgba(0,0,0,0.4)" transform={`rotate(-90, 10, ${height / 2})`} textAnchor="middle">{yLabel}</text>
    </svg>
  )
}
