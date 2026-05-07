export default function Card({ A, title, eyebrow, subtitle, right, children, padding = '20px 22px' }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, padding, border: `1px solid ${A.primaryLight}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          {eyebrow && (
            <div style={{ fontSize: 11, color: A.primaryDark, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 }}>
              {eyebrow}
            </div>
          )}
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3, color: '#1a1f1a' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11.5, color: '#9ca299', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}
