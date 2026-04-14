import React from 'react'
import { Droplets, Users, Zap, Leaf, FlaskConical, Wheat, Layers, Milk } from 'lucide-react'

function KPICard({ icon: Icon, label, value, unit, color, sub, small }) {
  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between">
        <span className={`font-medium text-gray-500 ${small ? 'text-xs' : 'text-sm'}`}>{label}</span>
        <div className={`rounded-lg flex items-center justify-center ${color} ${small ? 'w-7 h-7' : 'w-9 h-9'}`}>
          <Icon className={`text-white ${small ? 'w-4 h-4' : 'w-5 h-5'}`} />
        </div>
      </div>
      <div className="flex items-baseline gap-1 mt-2">
        <span className={`font-bold text-gray-900 ${small ? 'text-xl' : 'text-2xl'}`}>{value}</span>
        <span className="text-xs text-gray-400 font-medium">{unit}</span>
      </div>
      {sub && <p className="text-xs text-gray-400 mt-1 leading-tight">{sub}</p>}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="kpi-card animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-7 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-100 rounded w-3/4 mt-2" />
    </div>
  )
}

export default function KPICards({ kpis, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
        </div>
      </div>
    )
  }

  const {
    total_producao, total_vacas,
    eficiencia_ponderada, avg_forragem,
    leite_vaca_rebanho, ms_vaca_rebanho,
    avg_pct_ms_dieta, avg_pct_ms_forragem,
    ultima_data,
  } = kpis || {}

  const fmt  = (n, d = 1) => n != null ? Number(n).toLocaleString('pt-BR', { maximumFractionDigits: d }) : '—'
  const ref  = ultima_data ? `Ref: ${ultima_data}` : ''
  const pond = 'ponderado por nº de vacas'

  return (
    <div className="space-y-3">
      {/* Linha 1 — Produção e rebanho */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Droplets}
          label="Produção Total"
          value={fmt(total_producao, 0)}
          unit="kg leite/dia"
          color="bg-brand-600"
          sub={ref}
        />
        <KPICard
          icon={Users}
          label="Total Vacas em Lactação"
          value={fmt(total_vacas, 0)}
          unit="cabeças"
          color="bg-sky-500"
          sub={ref}
        />
        <KPICard
          icon={Milk}
          label="Leite/Vaca Rebanho"
          value={fmt(leite_vaca_rebanho, 1)}
          unit="kg/vaca/dia"
          color="bg-teal-500"
          sub={pond}
        />
        <KPICard
          icon={Zap}
          label="Eficiência Alimentar"
          value={fmt(eficiencia_ponderada, 3)}
          unit="kg leite/kg MS"
          color="bg-amber-500"
          sub={pond}
        />
      </div>

      {/* Linha 2 — Dieta e matéria seca */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={FlaskConical}
          label="CMS/Vaca Rebanho"
          value={fmt(ms_vaca_rebanho, 1)}
          unit="kg MS/vaca/dia"
          color="bg-indigo-500"
          sub={pond}
          small
        />
        <KPICard
          icon={Leaf}
          label="% Forragem na Dieta"
          value={fmt(avg_forragem, 1)}
          unit="%"
          color="bg-emerald-500"
          sub={pond}
          small
        />
        <KPICard
          icon={Wheat}
          label="% MS Forragem Principal"
          value={avg_pct_ms_forragem != null ? fmt(avg_pct_ms_forragem, 1) : '—'}
          unit="%"
          color="bg-lime-600"
          sub={avg_pct_ms_forragem != null ? pond : 'dado não informado'}
          small
        />
        <KPICard
          icon={Layers}
          label="% MS da Dieta"
          value={avg_pct_ms_dieta != null ? fmt(avg_pct_ms_dieta, 1) : '—'}
          unit="%"
          color="bg-orange-500"
          sub={avg_pct_ms_dieta != null ? pond : 'dado não informado'}
          small
        />
      </div>
    </div>
  )
}
