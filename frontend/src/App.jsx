import React, { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, TrendingUp, Leaf, FlaskConical,
  History, RefreshCw, Calendar, Table2, BookOpen,
} from 'lucide-react'

import Header        from './components/Header.jsx'
import FilterBar     from './components/FilterBar.jsx'
import KPICards      from './components/KPICards.jsx'
import BatchTable    from './components/BatchTable.jsx'
import UploadModal   from './components/UploadModal.jsx'
import UploadHistory from './components/UploadHistory.jsx'
import MonthlyTab    from './components/MonthlyTab.jsx'
import RawDataTab    from './components/RawDataTab.jsx'
import OrientacoesTab from './components/OrientacoesTab.jsx'

import FeedEfficiencyChart   from './components/charts/FeedEfficiencyChart.jsx'
import ProductionChart       from './components/charts/ProductionChart.jsx'
import DMIChart              from './components/charts/DMIChart.jsx'
import ForageChart           from './components/charts/ForageChart.jsx'
import HerdPieChart          from './components/charts/HerdPieChart.jsx'
import ProductionVsForageChart from './components/charts/ProductionVsForageChart.jsx'
import CMSVsForageChart      from './components/charts/CMSVsForageChart.jsx'

import {
  fetchFazendas, fetchLotes, fetchDates,
  fetchKpis, fetchData, fetchBatchSum,
  fetchMonthly, fetchRaw, fetchUploads,
} from './api/client.js'

const TABS = [
  { id: 'overview',   label: 'Visão Geral',        icon: LayoutDashboard },
  { id: 'efficiency', label: 'Eficiência Aliment.', icon: TrendingUp      },
  { id: 'production', label: 'Produção',            icon: FlaskConical    },
  { id: 'diet',       label: 'Dieta & CMS',         icon: Leaf            },
  { id: 'monthly',    label: 'Análise Mensal',      icon: Calendar        },
  { id: 'data',       label: 'Dados Brutos',        icon: Table2          },
  { id: 'history',    label: 'Histórico',           icon: History         },
  { id: 'guide',      label: 'Orientações',         icon: BookOpen        },
]

export default function App() {
  const [tab,        setTab]        = useState('overview')
  const [uploadOpen, setUploadOpen] = useState(false)

  // ── Fazenda / lotes (meta) ──────────────────────────────────────────────
  const [fazendas,    setFazendas]    = useState([])
  const [lotes,       setLotes]       = useState([])

  // ── Datas limite ───────────────────────────────────────────────────────
  const [minDate, setMinDate] = useState('')
  const [maxDate, setMaxDate] = useState('')

  // ── Filtros ────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    fazenda:    '',
    dataInicio: '',
    dataFim:    '',
    lotes:      [],
  })

  // ── Dados ──────────────────────────────────────────────────────────────
  const [kpis,        setKpis]        = useState(null)
  const [rows,        setRows]        = useState([])
  const [batchSum,    setBatchSum]    = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [rawData,     setRawData]     = useState([])
  const [uploads,     setUploads]     = useState([])

  // ── Loading flags ──────────────────────────────────────────────────────
  const [loadKpis,    setLoadKpis]    = useState(true)
  const [loadRows,    setLoadRows]    = useState(true)
  const [loadBatch,   setLoadBatch]   = useState(true)
  const [loadMonthly, setLoadMonthly] = useState(false)
  const [loadRaw,     setLoadRaw]     = useState(false)
  const [loadUpl,     setLoadUpl]     = useState(false)

  // ── Bootstrap: busca fazendas e seleciona a primeira ───────────────────
  useEffect(() => {
    fetchFazendas().then(({ fazendas: list }) => {
      setFazendas(list)
      if (list.length > 0) {
        setFilters(f => ({ ...f, fazenda: list[0] }))
      }
    })
  }, [])

  // ── Quando fazenda muda: recarrega lotes, datas e reseta filtros ────────
  useEffect(() => {
    if (!filters.fazenda) return
    Promise.all([
      fetchLotes(filters.fazenda),
      fetchDates(filters.fazenda),
    ]).then(([lotesRes, datesRes]) => {
      const ls   = lotesRes.lotes
      const minD = datesRes.min_date || ''
      const maxD = datesRes.max_date || ''
      setLotes(ls)
      setMinDate(minD)
      setMaxDate(maxD)
      setFilters(f => ({
        ...f,
        dataInicio: minD,
        dataFim:    maxD,
        lotes:      ls,
      }))
    })
  }, [filters.fazenda])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Constrói params da API ──────────────────────────────────────────────
  const buildParams = useCallback(() => {
    const p = {}
    if (filters.fazenda)    p.fazenda     = filters.fazenda
    if (filters.dataInicio) p.data_inicio = filters.dataInicio
    if (filters.dataFim)    p.data_fim    = filters.dataFim
    if (filters.lotes.length && filters.lotes.length < lotes.length)
      p.lotes = filters.lotes.join(',')
    return p
  }, [filters, lotes.length])

  // ── Carrega dados principais ────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!filters.dataInicio) return
    const params = buildParams()
    setLoadKpis(true); setLoadRows(true); setLoadBatch(true); setLoadMonthly(true)
    try {
      const [k, d, b, m] = await Promise.all([
        fetchKpis(params),
        fetchData(params),
        fetchBatchSum(params),
        fetchMonthly(params),
      ])
      setKpis(k)
      setRows(d.data)
      setBatchSum(b.data)
      setMonthlyData(m.data)
    } finally {
      setLoadKpis(false); setLoadRows(false); setLoadBatch(false); setLoadMonthly(false)
    }
  }, [buildParams, filters.dataInicio])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Dados brutos (carrega ao entrar na aba) ─────────────────────────────
  const loadRawData = useCallback(() => {
    setLoadRaw(true)
    fetchRaw(buildParams())
      .then(r => setRawData(r.data))
      .finally(() => setLoadRaw(false))
  }, [buildParams])

  useEffect(() => {
    if (tab === 'data') loadRawData()
  }, [tab, loadRawData])

  // ── Histórico de uploads ────────────────────────────────────────────────
  const loadUploads = useCallback(() => {
    setLoadUpl(true)
    fetchUploads()
      .then(r => setUploads(r.data))
      .finally(() => setLoadUpl(false))
  }, [])

  useEffect(() => {
    if (tab === 'history') loadUploads()
  }, [tab, loadUploads])

  const onUploadSuccess = () => {
    // Recarrega fazendas (pode ter nova fazenda) e dados
    fetchFazendas().then(({ fazendas: list }) => {
      setFazendas(list)
    })
    loadAll()
    if (tab === 'history') loadUploads()
    if (tab === 'data')    loadRawData()
  }

  // ── Linhas filtradas (client-side para charts) ──────────────────────────
  const filteredRows = rows.filter(r =>
    filters.lotes.length === 0 || filters.lotes.includes(r.lote)
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Header onUploadClick={() => setUploadOpen(true)} />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        minDate={minDate}
        maxDate={maxDate}
        fazendas={fazendas}
        lotes={lotes}
      />

      {/* Tab nav */}
      <div className="bg-white border-b border-gray-200 sticky top-[57px] z-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex gap-0.5 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3.5 py-3.5 text-sm whitespace-nowrap transition-all
                ${tab === id ? 'tab-active' : 'tab-inactive'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
          <button
            onClick={loadAll}
            className="ml-auto flex items-center gap-1 text-xs text-gray-400
                       hover:text-gray-700 px-3 py-3.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">

        {/* ── VISÃO GERAL ───────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            <KPICards kpis={kpis} loading={loadKpis} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <FeedEfficiencyChart data={filteredRows} activeLotes={filters.lotes} />
              <ProductionChart     data={filteredRows} activeLotes={filters.lotes} />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <BatchTable data={batchSum} loading={loadBatch} />
              </div>
              <HerdPieChart batchSummary={batchSum} loading={loadBatch} />
            </div>
          </>
        )}

        {/* ── EFICIÊNCIA ───────────────────────────────────────────────── */}
        {tab === 'efficiency' && (
          <>
            <KPICards kpis={kpis} loading={loadKpis} />
            <FeedEfficiencyChart data={filteredRows} activeLotes={filters.lotes} />
            <BatchTable data={batchSum} loading={loadBatch} />
          </>
        )}

        {/* ── PRODUÇÃO ─────────────────────────────────────────────────── */}
        {tab === 'production' && (
          <>
            <KPICards kpis={kpis} loading={loadKpis} />
            <ProductionChart data={filteredRows} activeLotes={filters.lotes} />
            <BatchTable
              data={[...batchSum].sort((a, b) => b.leite_vaca_pond - a.leite_vaca_pond)}
              loading={loadBatch}
            />
          </>
        )}

        {/* ── DIETA & CMS ──────────────────────────────────────────────── */}
        {tab === 'diet' && (
          <>
            <KPICards kpis={kpis} loading={loadKpis} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ProductionVsForageChart data={filteredRows} activeLotes={filters.lotes} />
              <CMSVsForageChart        data={filteredRows} activeLotes={filters.lotes} />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ForageChart batchSummary={batchSum} loading={loadBatch} />
              <DMIChart    batchSummary={batchSum} loading={loadBatch} />
            </div>
            <BatchTable
              data={[...batchSum].sort((a, b) => b.ms_vaca_pond - a.ms_vaca_pond)}
              loading={loadBatch}
            />
          </>
        )}

        {/* ── ANÁLISE MENSAL ───────────────────────────────────────────── */}
        {tab === 'monthly' && (
          <MonthlyTab
            data={monthlyData.filter(r =>
              filters.lotes.length === 0 || filters.lotes.includes(r.lote)
            )}
            lotes={filters.lotes}
            loading={loadMonthly}
          />
        )}

        {/* ── DADOS BRUTOS ─────────────────────────────────────────────── */}
        {tab === 'data' && (
          <RawDataTab data={rawData} loading={loadRaw} />
        )}

        {/* ── HISTÓRICO ────────────────────────────────────────────────── */}
        {tab === 'history' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Histórico de Uploads</h2>
                <p className="text-sm text-gray-500">Arquivos enviados e persistidos no banco</p>
              </div>
              <button onClick={() => setUploadOpen(true)} className="btn-primary text-sm">
                Novo Upload
              </button>
            </div>
            <UploadHistory uploads={uploads} loading={loadUpl} />
          </>
        )}

        {/* ── ORIENTAÇÕES ──────────────────────────────────────────────── */}
        {tab === 'guide' && <OrientacoesTab />}

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-4 px-6 text-center text-xs text-gray-400">
        Fazenda Nutrition Dashboard © 2026 — Nutrição Pecuária Leiteira
      </footer>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={onUploadSuccess}
      />
    </div>
  )
}
