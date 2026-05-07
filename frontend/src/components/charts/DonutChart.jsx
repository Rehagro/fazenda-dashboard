export default function DonutChart({ items, size = 156, thickness = 26 }) {
  const total = items.reduce((s, it) => s + it.value, 0) || 1
  const r = size / 2 - 2
  const innerR = r - thickness
  const cx = size / 2, cy = size / 2
  let acc = 0
  return (
    <svg width={size} height={size}>
      {items.map((it, i) => {
        const startAngle = (acc / total) * Math.PI * 2 - Math.PI / 2
        acc += it.value
        const endAngle = (acc / total) * Math.PI * 2 - Math.PI / 2
        const x1 = cx + Math.cos(startAngle) * r, y1 = cy + Math.sin(startAngle) * r
        const x2 = cx + Math.cos(endAngle) * r,   y2 = cy + Math.sin(endAngle) * r
        const x3 = cx + Math.cos(endAngle) * innerR, y3 = cy + Math.sin(endAngle) * innerR
        const x4 = cx + Math.cos(startAngle) * innerR, y4 = cy + Math.sin(startAngle) * innerR
        const large = endAngle - startAngle > Math.PI ? 1 : 0
        const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4} Z`
        return <path key={i} d={d} fill={it.color} />
      })}
    </svg>
  )
}
