export default function DashboardShell({ sidebar, topbar, children, A }) {
  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      background: A.bg,
    }}>
      {sidebar}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {topbar}
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: '24px 28px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
