import { useState, useEffect, useCallback, useMemo } from 'react'

import DashboardShell from './components/layout/DashboardShell'
import Sidebar        from './components/layout/Sidebar'
import Topbar         from './components/layout/Topbar'
import UploadModal    from './components/UploadModal'

import OverviewTab   from './components/tabs/OverviewTab'
import LotesTab      from './components/tabs/LotesTab'
import ProductionTab from './components/tabs/ProductionTab'
import DietTab       from './components/tabs/DietTab'
import MonthlyTab    from './components/tabs/MonthlyTab'
import DataTab       from './components/tabs/DataTab'
import HistoryTab    from './components/tabs/HistoryTab'
import GuideTab      from './components/tabs/GuideTab'

import { ACCENT_MAP } from './theme/palette'
import { getLoteColor } from './components/charts/chartUtils'
import {
  fetchFazendas, fetchLotes, fetchDates,
  fetchKpis, fetchData, fetchBatchSum,
  fetchMonthly, fetchRaw, fetchUploads,
} from './api/client'

const A = ACCENT_MAP.green

export default function App() {
  const [tab,        setTab]        = useState('overview')
  const [uploadOpen, setUploadOpen] = useState(false)

  // ── Meta ───────────────────────────────────────────────────────────────
  const [fazendas, setFazendas] = useState([])
  const [lotes,    setLotes]    = useState([])
  const [minDate,  setMinDate]  = useState('')
  const [maxDate,  setMaxDate]  = useState('')

  // ── Filtros ────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({ fazenda: '', dataInicio: '', dataFim: '', lotes: [] })

  // ── Dados ──────────────────────────────────────────────────────────────
  const [kpis,        setKpis]        = useState(null)
  const [rows,        setRows]        = useState([])
  const [batchSum,    setBatchSum]    = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [rawData,     setRawData]     = useState([])
  const [uploads,     setUploads]     = useState([])

  // ── Loading ────────────────────────────────────────────────────────────
  const [loadKpis,    setLoadKpis]    = useState(true)
  const [loadRows,    setLoadRows]    = useState(true)
  const [loadBatch,   setLoadBatch]   = useState(true)
  const [loadMonthly, setLoadMonthly] = useState(false)
  const [loadRaw,     setLoadRaw]     = useState(false)
  const [loadUpl,     setLoadUpl]     = useState(false)

  // ── Bootstrap ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchFazendas().then(({ fazendas: list }) => {
      setFazendas(list)
      if (list.length) setFilters(f => ({ ...f, fazenda: list[0] }))
    })
  }, [])

  useEffect(() => {
    if (!filters.fazenda) return
    Promise.all([fetchLotes(filters.fazenda), fetchDates(filters.fazenda)]).then(([lr, dr]) => {
      const ls = lr.lotes
      const minD = dr.min_date || '', maxD = dr.max_date || ''
      setLotes(ls); setMinDate(minD); setMaxDate(maxD)
      setFilters(f => ({ ...f, dataInicio: minD, dataFim: maxD, lotes: ls }))
    })
  }, [filters.fazenda]) // eslint-disable-line

  // ── Params ─────────────────────────────────────────────────────────────
  const buildParams = useCallback(() => {
    const p = {}
    if (filters.fazenda)    p.fazenda     = filters.fazenda
    if (filters.dataInicio) p.data_inicio = filters.dataInicio
    if (filters.dataFim)    p.data_fim    = filters.dataFim
    if (filters.lotes.length && filters.lotes.length < lotes.length)
      p.lotes = filters.lotes.join(',')
    return p
  }, [filters, lotes.length])

  // ── Load all ───────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!filters.dataInicio) return
    const params = buildParams()
    setLoadKpis(true); setLoadRows(true); setLoadBatch(true); setLoadMonthly(true)
    try {
      const [k, d, b, m] = await Promise.all([
        fetchKpis(params), fetchData(params), fetchBatchSum(params), fetchMonthly(params),
      ])
      setKpis(k); setRows(d.data); setBatchSum(b.data); setMonthlyData(m.data)
    } finally {
      setLoadKpis(false); setLoadRows(false); setLoadBatch(false); setLoadMonthly(false)
    }
  }, [buildParams, filters.dataInicio])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Lazy loaders ───────────────────────────────────────────────────────
  const loadRawData = useCallback(() => {
    setLoadRaw(true)
    fetchRaw(buildParams()).then(r => setRawData(r.data)).finally(() => setLoadRaw(false))
  }, [buildParams])

  useEffect(() => { if (tab === 'data')    loadRawData() }, [tab, loadRawData])

  const loadUploads = useCallback(() => {
    setLoadUpl(true)
    fetchUploads().then(r => setUploads(r.data)).finally(() => setLoadUpl(false))
  }, [])

  useEffect(() => { if (tab === 'history') loadUploads() }, [tab, loadUploads])

  const onUploadSuccess = () => {
    fetchFazendas().then(({ fazendas: list }) => setFazendas(list))
    loadAll()
    if (tab === 'history') loadUploads()
    if (tab === 'data')    loadRawData()
  }

  // ── Filtered rows ──────────────────────────────────────────────────────
  const filteredRows = rows.filter(r =>
    filters.lotes.length === 0 || filters.lotes.includes(r.lote)
  )

  // ── Derived sparkline / trend data ────────────────────────────────────
  const { rebanhoLeite, rebanhoEf, leiteTrend, efTrend } = useMemo(() => {
    if (!filteredRows.length) return { rebanhoLeite: [], rebanhoEf: [], leiteTrend: null, efTrend: null }
    const dateMap = {}
    filteredRows.forEach(r => {
      if (!dateMap[r.data_registro]) dateMap[r.data_registro] = { leite: 0, ef: 0, vacas: 0 }
      dateMap[r.data_registro].leite += (r.leite_vaca || 0) * (r.num_vacas || 0)
      dateMap[r.data_registro].ef    += (r.eficiencia  || 0) * (r.num_vacas || 0)
      dateMap[r.data_registro].vacas += (r.num_vacas   || 0)
    })
    const sorted = Object.keys(dateMap).sort()
    const rebanhoLeite = sorted.map(d => dateMap[d].vacas > 0 ? dateMap[d].leite / dateMap[d].vacas : 0)
    const rebanhoEf    = sorted.map(d => dateMap[d].vacas > 0 ? dateMap[d].ef   / dateMap[d].vacas : 0)
    const avg = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
    const last7L = rebanhoLeite.slice(-7), prev7L = rebanhoLeite.slice(-14, -7)
    const last7E = rebanhoEf.slice(-7),   prev7E = rebanhoEf.slice(-14, -7)
    const leiteTrend = prev7L.length && avg(prev7L) ? ((avg(last7L) - avg(prev7L)) / avg(prev7L)) * 100 : null
    const efTrend    = prev7E.length && avg(prev7E) ? ((avg(last7E) - avg(prev7E)) / avg(prev7E)) * 100 : null
    return { rebanhoLeite, rebanhoEf, leiteTrend, efTrend }
  }, [filteredRows])

  // ── Build colors from actual lotes (fallback palette for unknown lotes) ──
  const activeLotes = filters.lotes.length ? filters.lotes : lotes
  const colorsMap = useMemo(
    () => Object.fromEntries(activeLotes.map((l, i) => [l, getLoteColor(l, i)])),
    [activeLotes.join(',')]  // eslint-disable-line
  )

  // ── Context object for all tabs ───────────────────────────────────────
  const ctx = {
    lotes:       activeLotes,
    colors:      colorsMap,
    k:           kpis || {},
    batch:       batchSum,
    rows:        filteredRows,
    rebanhoLeite,
    rebanhoEf,
    leiteTrend,
    efTrend,
    monthly:     monthlyData,
    fazendas,
    loadKpis,
    loadBatch,
  }

  return (
    <>
      <DashboardShell
        A={A}
        sidebar={
          <Sidebar
            tab={tab}
            setTab={setTab}
            onUploadClick={() => setUploadOpen(true)}
            lotesCount={lotes.length}
            A={A}
          />
        }
        topbar={
          <Topbar
            filters={filters}
            onChange={setFilters}
            fazendas={fazendas}
            lotes={lotes}
            kpis={kpis}
            onRefresh={loadAll}
            A={A}
          />
        }
      >
        {tab === 'overview'   && <OverviewTab   ctx={ctx} A={A} />}
        {tab === 'lotes'      && <LotesTab      ctx={ctx} A={A} />}
        {tab === 'production' && <ProductionTab ctx={ctx} A={A} />}
        {tab === 'diet'       && <DietTab       ctx={ctx} A={A} />}
        {tab === 'monthly'    && <MonthlyTab    ctx={ctx} A={A} />}
        {tab === 'data'       && <DataTab       ctx={ctx} A={A} rawData={rawData} />}
        {tab === 'history'    && <HistoryTab    A={A} uploads={uploads} onUploadClick={() => setUploadOpen(true)} />}
        {tab === 'guide'      && <GuideTab      A={A} />}
      </DashboardShell>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={onUploadSuccess}
      />
    </>
  )
}
