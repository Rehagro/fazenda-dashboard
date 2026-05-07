export default function HBarChart({ items, max, barHeight = 24, gap = 10, formatVal = (v) => v.toFixed(1) }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {items.map((it, i) => {
        const pct = Math.max(0, Math.min(1, it.value / (max || 1)))
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 90, fontSize: 12, fontWeight: 600, color: '#1a1f1a', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: it.color, flexShrink: 0 }} />
              {it.label}
            </div>
            <div style={{ flex: 1, height: barHeight, background: 'rgba(0,0,0,0.04)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${pct * 100}%`, height: '100%', background: it.color, borderRadius: 6, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ width: 64, textAlign: 'right', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#1a1f1a', flexShrink: 0 }}>
              {formatVal(it.value)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
