import { useState } from 'react'
import SectionHeader from '../ui/SectionHeader'
import Icon from '../ui/Icon'
import { fmt, fmtInt } from '../../utils/format'

const PAGE_SIZE = 40

export default function DataTab({ ctx, A, rawData }) {
  const { colors } = ctx
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const rows = (rawData && rawData.length ? rawData : ctx.rows)
  const filtered = search
    ? rows.filter(r => r.lote?.toLowerCase().includes(search.toLowerCase()) || r.data_registro?.includes(search))
    : rows

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const exportCsv = () => {
    const cols = ['data_registro', 'lote', 'num_vacas', 'producao_leite_total', 'leite_vaca', 'consumo_ms_total', 'ms_vaca', 'eficiencia', 'pct_forragem']
    const header = cols.join(',')
    const body = filtered.map(r => cols.map(c => r[c] ?? '').join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([header + '\n' + body], { type: 'text/csv' }))
    a.download = 'dados_fazenda.csv'
    a.click()
  }

  return (
    <>
      <SectionHeader A={A} eyebrow="Dados Brutos" title="Tabela detalhada por dia e lote" subtitle={`${filtered.length} registros · use exportar para baixar tudo`} />
      <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${A.primaryLight}`, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${A.primaryLight}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: A.bg, borderRadius: 9 }}>
            <Icon name="search" size={15} style={{ color: '#6b7568' }} />
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder="Filtrar por data (AAAA-MM-DD) ou lote…"
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, flex: 1, fontFamily: 'inherit' }}
            />
          </div>
          <button onClick={exportCsv} style={{ padding: '7px 12px', border: `1px solid ${A.primaryLight}`, background: '#fff', borderRadius: 9, fontWeight: 700, fontSize: 12, color: A.primaryDark, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            <Icon name="download" size={13} style={{ color: A.primaryDark }} /> Exportar CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: A.bg }}>
                {['Data', 'Lote', 'Vacas', 'Produção (kg)', 'Leite/vaca', 'CMS total', 'CMS/vaca', 'Eficiência', '% Forragem'].map((h, i) => (
                  <th key={i} style={{ textAlign: i < 2 ? 'left' : 'right', padding: '9px 14px', fontSize: 10.5, fontWeight: 700, color: '#3a4438', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${A.primaryLight}` }}>
                  <td style={{ padding: '8px 14px', fontVariantNumeric: 'tabular-nums', color: '#3a4438', whiteSpace: 'nowrap' }}>{r.data_registro?.split('-').reverse().join('/')}</td>
                  <td style={{ padding: '8px 14px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: colors[r.lote] || '#888' }} />{r.lote}</span></td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.num_vacas}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{fmtInt(r.producao_leite_total)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.leite_vaca, 1)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtInt(r.consumo_ms_total)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.ms_vaca, 1)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{(r.eficiencia || 0).toFixed(3)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.pct_forragem, 1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 18px', borderTop: `1px solid ${A.primaryLight}`, fontSize: 12, color: '#6b7568', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Mostrando {slice.length} de {filtered.length} registros</span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ minWidth: 28, padding: '4px 8px', border: `1px solid ${A.primaryLight}`, background: '#fff', color: '#3a4438', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>◀</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i).map(i => (
                <button key={i} onClick={() => setPage(i)} style={{ minWidth: 28, padding: '4px 8px', border: `1px solid ${A.primaryLight}`, background: page === i ? A.primaryLight : '#fff', color: page === i ? A.primaryDark : '#3a4438', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ minWidth: 28, padding: '4px 8px', border: `1px solid ${A.primaryLight}`, background: '#fff', color: '#3a4438', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>▶</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
