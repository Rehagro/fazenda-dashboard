import Icon from '../ui/Icon'
import { fmtDate } from '../../utils/format'

function Divider({ A }) {
  return <div style={{ width: 1, height: 24, background: A.primaryLight, flexShrink: 0 }} />
}

export default function Topbar({ filters, onChange, fazendas, lotes, kpis, onRefresh, A }) {
  const { dataInicio, dataFim, lotes: selectedLotes, fazenda } = filters

  const daysDiff = (() => {
    if (!dataInicio || !dataFim) return null
    const ms = new Date(dataFim) - new Date(dataInicio)
    return Math.round(ms / 86400000)
  })()

  const periodLabel = (() => {
    if (!dataInicio || !dataFim) return 'Selecione período'
    return `${fmtDate(dataInicio)} — ${fmtDate(dataFim)}`
  })()

  const toggleLote = (lote) => {
    const next = selectedLotes.includes(lote)
      ? selectedLotes.filter(l => l !== lote)
      : [...selectedLotes, lote]
    onChange({ ...filters, lotes: next.length === 0 ? lotes : next })
  }

  const LOTE_COLORS = {
    'TOP VACA': '#16A34A', 'TOP NOV': '#0EA5E9',
    'CB1': '#8B5CF6', 'CB2': '#F59E0B',
    'CB4': '#EC4899', 'PÓS PARTO': '#DC2626',
  }

  return (
    <div style={{
      height: 52, background: '#fff',
      borderBottom: `1px solid ${A.primaryLight}`,
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 16, flexShrink: 0,
    }}>
      {/* Fazenda selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="barn" size={16} style={{ color: A.primary, flexShrink: 0 }} />
        <select
          value={fazenda}
          onChange={e => onChange({ ...filters, fazenda: e.target.value })}
          style={{
            border: `1px solid ${A.primaryLight}`, background: A.cream,
            borderRadius: 8, padding: '4px 8px', fontSize: 13,
            fontWeight: 700, color: '#1a1f1a', cursor: 'pointer',
            fontFamily: 'inherit', outline: 'none',
          }}
        >
          {fazendas.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <Divider A={A} />

      {/* Período */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Icon name="calendar" size={15} style={{ color: A.primary }} />
        <span style={{ fontSize: 12.5, color: '#3a4438', fontWeight: 500 }}>{periodLabel}</span>
        {daysDiff != null && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: A.primaryLight, color: A.primaryDark }}>
            {daysDiff}d
          </span>
        )}
      </div>

      <Divider A={A} />

      {/* Lote chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, flexWrap: 'wrap', overflow: 'hidden' }}>
        {lotes.map(l => {
          const c = LOTE_COLORS[l] || '#888'
          const on = selectedLotes.length === 0 || selectedLotes.includes(l)
          return (
            <button key={l} onClick={() => toggleLote(l)} style={{
              fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
              border: `1px solid ${c}${on ? '40' : '20'}`,
              background: on ? c + '18' : 'transparent',
              color: on ? c : '#9ca299',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.12s',
            }}>{l}</button>
          )
        })}
      </div>

      {/* Refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
        <button onClick={onRefresh} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: '#6b7568', fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit',
          padding: '4px 6px', borderRadius: 6,
        }}>
          <Icon name="refresh" size={13} />
          {kpis?.ultima_data ? `Atualizado ${kpis.ultima_data}` : 'Atualizar'}
        </button>
      </div>
    </div>
  )
}
