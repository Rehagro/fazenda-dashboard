import { useState } from 'react'

export default function PeriodToggle({ A, value = '30d', onChange }) {
  const [active, setActive] = useState(value)
  const select = (p) => { setActive(p); onChange?.(p) }
  return (
    <div style={{ display: 'flex', gap: 3, padding: 3, background: A.bg, borderRadius: 10 }}>
      {['7d', '30d', '90d'].map(p => (
        <button key={p} onClick={() => select(p)} style={{
          padding: '5px 10px', border: 'none',
          background: active === p ? '#fff' : 'transparent',
          color: active === p ? A.primaryDark : '#6b7568',
          fontWeight: 700, fontSize: 11.5, borderRadius: 7, cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: active === p ? '0 1px 3px rgba(0,0,0,0.07)' : 'none',
        }}>{p}</button>
      ))}
    </div>
  )
}
