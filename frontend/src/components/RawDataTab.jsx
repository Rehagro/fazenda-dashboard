import React, { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 50

const COLS = [
  { key: 'fazenda',              label: 'Fazenda'           },
  { key: 'data_registro',        label: 'Data'              },
  { key: 'lote',                 label: 'Lote'              },
  { key: 'num_vacas',            label: 'Vacas'             },
  { key: 'producao_leite_total', label: 'Prod. Total (kg)'  },
  { key: 'leite_por_vaca',       label: 'Leite/Vaca (kg)'   },
  { key: 'consumo_ms_total',     label: 'CMS Total (kg)'    },
  { key: 'consumo_ms_vaca',      label: 'CMS/Vaca (kg)'     },
  { key: 'percentual_forragem',  label: '% Forragem'        },
  { key: 'eficiencia_alimentar', label: 'Eficiência'        },
  { key: 'pct_ms_forragem',      label: '%MS Forragem'      },
  { key: 'pct_ms_dieta',         label: '%MS Dieta'         },
  { key: 'upload_filename',      label: 'Arquivo'           },
  { key: 'created_at',           label: 'Inserido em'       },
]

function fmtCell(key, val) {
  if (val == null) return <span className="text-gray-300">—</span>
  if (['leite_por_vaca', 'consumo_ms_vaca', 'eficiencia_alimentar'].includes(key))
    return Number(val).toFixed(2)
  if (['producao_leite_total', 'consumo_ms_total'].includes(key))
    return Number(val).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  if (['percentual_forragem', 'pct_ms_forragem', 'pct_ms_dieta'].includes(key))
    return `${Number(val).toFixed(1)}%`
  if (key === 'created_at') return val.replace('T', ' ').slice(0, 16)
  return val
}

export default function RawDataTab({ data, loading }) {
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)

  const filtered = useMemo(() => {
    if (!search.trim()) return data || []
    const q = search.toLowerCase()
    return (data || []).filter(r =>
      Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q))
    )
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const slice      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  if (loading) {
    return (
      <div className="card animate-pulse space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        {[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho + busca */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Dados Brutos</h2>
          <p className="text-sm text-gray-500">
            {filtered.length.toLocaleString('pt-BR')} registros
            {search ? ' (filtrados)' : ''}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar em todos os campos…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 w-72"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
              <tr>
                {COLS.map(c => (
                  <th key={c.key} className="text-left font-semibold text-gray-600 px-3 py-3 whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length} className="text-center py-10 text-gray-400">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : slice.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {COLS.map(c => (
                    <td key={c.key} className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                      {fmtCell(c.key, row[c.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Página {safePage} de {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage(p => p - 1)}
              className="btn-ghost py-1 px-2 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="btn-ghost py-1 px-2 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
