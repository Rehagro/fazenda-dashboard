import Icon from '../ui/Icon'

const NAV = [
  {
    group: 'Análise',
    items: [
      { id: 'overview',   label: 'Visão Geral',  icon: 'home' },
      { id: 'lotes',      label: 'Lotes',        icon: 'grass', badge: true },
      { id: 'production', label: 'Produção',      icon: 'drop' },
      { id: 'diet',       label: 'Dieta & CMS',  icon: 'flask' },
      { id: 'monthly',    label: 'Histórico',     icon: 'history' },
    ],
  },
  {
    group: 'Dados',
    items: [
      { id: 'data',     label: 'Dados Brutos',   icon: 'table' },
      { id: 'history',  label: 'Uploads',         icon: 'upload' },
      { id: 'settings', label: 'Configurações',   icon: 'settings' },
      { id: 'guide',    label: 'Orientações',     icon: 'book' },
    ],
  },
]

export default function Sidebar({ tab, setTab, onUploadClick, lotesCount, A }) {
  return (
    <div style={{
      width: 236, flexShrink: 0,
      background: '#fff',
      borderRight: `1px solid ${A.primaryLight}`,
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: A.primary, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="cow" size={20} strokeWidth={1.8} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1f1a', letterSpacing: -0.3 }}>Fazenda</div>
          <div style={{ fontSize: 11, color: '#6b7568', fontWeight: 500 }}>Nutrição leiteira</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {NAV.map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7568', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 8px 4px' }}>
              {group}
            </div>
            {items.map(({ id, label, icon, badge }) => {
              const active = tab === id
              return (
                <button key={id} onClick={() => setTab(id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 10px', border: 'none', borderRadius: 9, cursor: 'pointer',
                  background: active ? A.primaryLight : 'transparent',
                  color: active ? A.primaryDark : '#3a4438',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13.5, fontFamily: 'inherit',
                  textAlign: 'left', marginBottom: 1,
                  transition: 'background 0.12s, color 0.12s',
                }}>
                  <Icon name={icon} size={16} strokeWidth={active ? 2.2 : 1.8} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && lotesCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 99, background: A.primary, color: '#fff' }}>
                      {lotesCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Upload card */}
      <div style={{ padding: '12px 12px 16px' }}>
        <div style={{ borderRadius: 14, padding: '16px 14px', background: `linear-gradient(135deg, ${A.primary}, ${A.primaryDark})` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Subir planilha</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 12, lineHeight: 1.4 }}>
            Envie seu Excel para atualizar os dados
          </div>
          <button onClick={onUploadClick} style={{
            width: '100%', padding: '8px 0', border: 'none',
            background: '#fff', color: A.primaryDark,
            fontWeight: 700, fontSize: 12.5, borderRadius: 8,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icon name="upload" size={13} style={{ color: A.primaryDark }} />
            Upload Excel
          </button>
        </div>
      </div>
    </div>
  )
}
