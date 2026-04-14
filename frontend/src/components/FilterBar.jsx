import React from 'react'
import { Filter, X, Building2 } from 'lucide-react'
import { getLoteColor } from './charts/chartUtils'

export default function FilterBar({
  filters, onChange,
  minDate, maxDate,
  fazendas, lotes,
}) {
  const toggleLote = (lote) => {
    const cur  = filters.lotes
    const next = cur.includes(lote)
      ? cur.filter(l => l !== lote)
      : [...cur, lote]
    onChange({ ...filters, lotes: next })
  }

  const resetFilters = () =>
    onChange({ ...filters, dataInicio: minDate, dataFim: maxDate, lotes: [...lotes] })

  const allSelected = filters.lotes.length === lotes.length

  const isDirty =
    !allSelected ||
    filters.dataInicio !== minDate ||
    filters.dataFim    !== maxDate

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-30">
      <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center gap-3">

        {/* Seletor de fazenda */}
        {fazendas.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
            <select
              value={filters.fazenda || ''}
              onChange={e => onChange({ ...filters, fazenda: e.target.value, lotes: [...lotes] })}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium
                         focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white
                         text-brand-700 cursor-pointer"
            >
              {fazendas.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        )}

        {/* Separador */}
        {fazendas.length > 0 && (
          <span className="h-5 w-px bg-gray-200" />
        )}

        {/* Período */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="date"
            value={filters.dataInicio}
            min={minDate}
            max={filters.dataFim || maxDate}
            onChange={e => onChange({ ...filters, dataInicio: e.target.value })}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="text-gray-400 text-xs">até</span>
          <input
            type="date"
            value={filters.dataFim}
            min={filters.dataInicio}
            max={maxDate}
            onChange={e => onChange({ ...filters, dataFim: e.target.value })}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Chips de lote */}
        <div className="flex flex-wrap items-center gap-1.5">
          {lotes.map((lote, i) => {
            const active = filters.lotes.includes(lote)
            const color  = getLoteColor(lote, i)
            return (
              <button
                key={lote}
                onClick={() => toggleLote(lote)}
                style={active ? {
                  backgroundColor: color + '22',
                  borderColor: color,
                  color,
                } : {}}
                className={`badge border cursor-pointer transition-all select-none text-xs
                  ${!active ? 'bg-gray-100 text-gray-400 border-gray-200' : ''}`}
              >
                {lote}
              </button>
            )
          })}
        </div>

        {/* Limpar filtros */}
        {isDirty && (
          <button
            onClick={resetFilters}
            className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors ml-auto"
          >
            <X className="w-3 h-3" /> Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}
