export default function SectionHeader({ A, eyebrow, title, subtitle, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.8, margin: 0, color: '#1a1f1a', textTransform: 'uppercase' }}>
        {eyebrow || title}
      </h1>
      {right}
    </div>
  )
}
