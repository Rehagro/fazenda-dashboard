export default function SectionHeader({ A, eyebrow, title, subtitle, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: A.primaryDark, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
          {eyebrow}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: 0, color: '#1a1f1a' }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 13, color: '#6b7568', marginTop: 4 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}
