import { useState } from 'react'
import SectionHeader from '../ui/SectionHeader'
import Icon from '../ui/Icon'
import { saveMetaSobra, deleteMetaSobra } from '../../api/client'

export default function SettingsTab({ ctx, A, metaSobra, onMetaChange }) {
  const { lotes, fazendas } = ctx
  const fazenda = ctx.filters?.fazenda || (fazendas.length ? fazendas[0] : '')

  // editing[lote] = string value being typed
  const [editing, setEditing]   = useState({})
  const [saving,  setSaving]    = useState({})
  const [saved,   setSaved]     = useState({})
  const [error,   setError]     = useState({})

  const metaMap = {}
  for (const m of (metaSobra || [])) {
    if (m.fazenda === fazenda) metaMap[m.lote] = m.meta_pct
  }

  function handleChange(lote, val) {
    setEditing(e => ({ ...e, [lote]: val }))
    setSaved(s => ({ ...s, [lote]: false }))
    setError(e => ({ ...e, [lote]: null }))
  }

  async function handleSave(lote) {
    const raw = editing[lote]
    const val = parseFloat(String(raw).replace(',', '.'))
    if (isNaN(val) || val < 0 || val > 100) {
      setError(e => ({ ...e, [lote]: 'Valor entre 0 e 100' }))
      return
    }
    setSaving(s => ({ ...s, [lote]: true }))
    try {
      await saveMetaSobra({ fazenda, lote, meta_pct: val })
      setSaved(s => ({ ...s, [lote]: true }))
      setEditing(e => ({ ...e, [lote]: undefined }))
      onMetaChange && onMetaChange()
    } catch {
      setError(e => ({ ...e, [lote]: 'Erro ao salvar' }))
    } finally {
      setSaving(s => ({ ...s, [lote]: false }))
    }
  }

  async function handleDelete(lote) {
    try {
      await deleteMetaSobra(fazenda, lote)
      onMetaChange && onMetaChange()
    } catch {
      setError(e => ({ ...e, [lote]: 'Erro ao remover' }))
    }
  }

  function currentVal(lote) {
    if (editing[lote] !== undefined) return editing[lote]
    const m = metaMap[lote]
    return m !== undefined ? String(m) : ''
  }

  return (
    <>
      <SectionHeader
        A={A}
        eyebrow="Configurações"
        title="Meta de sobra por lote"
        subtitle="Define o % de sobra ideal para cada lote da fazenda selecionada. Usado nos gráficos de análise."
      />

      <div style={{ maxWidth: 680 }}>
        <div style={{
          background: '#fff', borderRadius: 18, overflow: 'hidden',
          border: `1px solid ${A.primaryLight}`,
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 22px', borderBottom: `1px solid ${A.primaryLight}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Metas de sobra</div>
              <div style={{ fontSize: 12, color: '#6b7568', marginTop: 2 }}>
                Fazenda: <strong>{fazenda || '—'}</strong>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#6b7568', background: A.bg, padding: '4px 10px', borderRadius: 8 }}>
              Meta típica: 5–10%
            </div>
          </div>

          {/* Table */}
          {lotes.length === 0 ? (
            <div style={{ padding: '32px 22px', textAlign: 'center', color: '#9ca299', fontSize: 13 }}>
              Nenhum lote encontrado para esta fazenda.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: A.bg }}>
                  <th style={{ textAlign: 'left',   padding: '10px 22px', fontSize: 11, fontWeight: 700, color: '#3a4438', textTransform: 'uppercase', letterSpacing: 0.5 }}>Lote</th>
                  <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#3a4438', textTransform: 'uppercase', letterSpacing: 0.5 }}>Meta de sobra (%)</th>
                  <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#3a4438', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map(lote => {
                  const val     = currentVal(lote)
                  const hasMeta = metaMap[lote] !== undefined
                  const isSaved = saved[lote]
                  const isErr   = error[lote]
                  const isSaving = saving[lote]

                  return (
                    <tr key={lote} style={{ borderTop: `1px solid ${A.primaryLight}` }}>
                      <td style={{ padding: '12px 22px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <span style={{ width: 24, height: 24, borderRadius: 6, background: A.primaryLight, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800, color: A.primaryDark }}>
                            {lote.split(' ').map(w => w[0]).slice(0, 2).join('')}
                          </span>
                          <span style={{ fontWeight: 700 }}>{lote}</span>
                          {hasMeta && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: '#dcfce7', color: '#166534' }}>
                              {metaMap[lote]}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={val}
                            onChange={e => handleChange(lote, e.target.value)}
                            placeholder="ex: 7.5"
                            style={{
                              width: 90, padding: '6px 10px', fontSize: 13,
                              border: `1px solid ${isErr ? '#fca5a5' : A.primaryLight}`,
                              borderRadius: 8, outline: 'none', fontFamily: 'inherit',
                              textAlign: 'center',
                              background: isErr ? '#fef2f2' : '#fff',
                            }}
                          />
                          <span style={{ fontSize: 12, color: '#6b7568' }}>%</span>
                        </div>
                        {isErr && (
                          <div style={{ fontSize: 10, color: '#dc2626', marginTop: 4 }}>{isErr}</div>
                        )}
                        {isSaved && (
                          <div style={{ fontSize: 10, color: '#16a34a', marginTop: 4 }}>Salvo!</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          <button
                            onClick={() => handleSave(lote)}
                            disabled={isSaving || !val}
                            style={{
                              padding: '6px 14px', border: 'none', borderRadius: 7,
                              background: val ? A.primary : '#e5e7eb',
                              color: val ? '#fff' : '#9ca3af',
                              fontWeight: 700, fontSize: 12, cursor: val ? 'pointer' : 'default',
                              fontFamily: 'inherit',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <Icon name="save" size={12} />
                            {isSaving ? 'Salvando...' : 'Salvar'}
                          </button>
                          {hasMeta && (
                            <button
                              onClick={() => handleDelete(lote)}
                              style={{
                                padding: '6px 10px', border: `1px solid #fca5a5`,
                                borderRadius: 7, background: '#fff',
                                color: '#dc2626', cursor: 'pointer',
                                fontFamily: 'inherit', fontSize: 12,
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <Icon name="trash" size={12} />
                              Remover
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Info card */}
        <div style={{
          marginTop: 16, padding: '14px 18px',
          background: A.bg, borderRadius: 14,
          border: `1px solid ${A.primaryLight}`,
          fontSize: 12.5, color: '#3a4438', lineHeight: 1.6,
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="info" size={14} style={{ color: '#6b7568', flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Como é usada:</strong> a meta de sobra aparece como linha de referência no gráfico
              de <em>% sobra por lote</em>. Sobra abaixo da meta indica risco de consumo limitado;
              acima indica desperdício. Meta típica: <strong>5–10%</strong>.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
