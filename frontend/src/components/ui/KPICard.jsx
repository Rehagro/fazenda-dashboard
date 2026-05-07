import Icon from './Icon'
import Sparkline from '../charts/Sparkline'

export default function KPICard({ kpi, A, padding = '20px 22px' }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, padding, border: `1px solid ${A.primaryLight}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: kpi.color + '18', color: kpi.color, display: 'grid', placeItems: 'center' }}>
          <Icon name={kpi.icon} size={19} strokeWidth={2} />
        </div>
        {kpi.trendVal != null && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
            background: kpi.trendVal >= 0 ? '#dcf3e0' : '#fde8e8',
            color: kpi.trendVal >= 0 ? '#1f6b30' : '#a83232',
          }}>
            <Icon name={kpi.trendVal >= 0 ? 'arrowUp' : 'arrowDown'} size={11} strokeWidth={2.5} />
            {Math.abs(kpi.trendVal).toFixed(1)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 12.5, color: '#6b7568', fontWeight: 600 }}>{kpi.label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</span>
        <span style={{ fontSize: 11.5, color: '#9ca299', fontWeight: 600 }}>{kpi.unit}</span>
      </div>
      {kpi.spark && kpi.spark.length > 1 && (
        <div style={{ marginTop: 'auto' }}>
          <Sparkline data={kpi.spark} color={kpi.color} height={32} />
        </div>
      )}
      {kpi.sub && !kpi.spark && (
        <div style={{ fontSize: 11.5, color: '#9ca299' }}>{kpi.sub}</div>
      )}
    </div>
  )
}
