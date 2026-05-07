import SectionHeader from '../ui/SectionHeader'
import Icon from '../ui/Icon'

export default function HistoryTab({ A, uploads, onUploadClick }) {
  return (
    <>
      <SectionHeader
        A={A}
        eyebrow="Uploads"
        title="Histórico de envios"
        subtitle="Arquivos Excel persistidos no banco"
        right={
          <button onClick={onUploadClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: A.primary, color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Icon name="upload" size={14} style={{ color: '#fff' }} /> Novo Upload
          </button>
        }
      />
      <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${A.primaryLight}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: A.bg }}>
                {['Arquivo', 'Enviado em', 'Tamanho', 'Linhas', 'Status'].map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '11px 18px', fontSize: 11, fontWeight: 700, color: '#3a4438', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(uploads || []).map((u, i) => {
                const ok = u.status === 'ok' || u.status === 'importado' || !u.status
                const nome = u.nome || u.filename || u.file_name || '—'
                const data = u.data || u.created_at || u.uploaded_at || '—'
                const size = u.size || u.file_size || '—'
                const linhas = u.linhas || u.rows_count || u.row_count || '—'
                return (
                  <tr key={i} style={{ borderTop: `1px solid ${A.primaryLight}` }}>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 32, height: 32, borderRadius: 8, background: '#15803d22', color: '#15803d', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <Icon name="table" size={16} />
                        </span>
                        <span style={{ fontWeight: 700, color: '#1a1f1a' }}>{nome}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px', color: '#6b7568', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{data}</td>
                    <td style={{ padding: '12px 18px', color: '#6b7568', fontVariantNumeric: 'tabular-nums' }}>{size}</td>
                    <td style={{ padding: '12px 18px', color: '#1a1f1a', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{linhas}</td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: ok ? '#dcf3e0' : '#fde8e8', color: ok ? '#1f6b30' : '#a83232' }}>
                        {ok ? '✓ Importado' : '✗ Erro'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {(!uploads || !uploads.length) && (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#9ca299', fontSize: 13 }}>Nenhum upload encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
