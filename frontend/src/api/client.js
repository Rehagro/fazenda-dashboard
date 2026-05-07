import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const fetchFazendas  = ()         => api.get('/fazendas').then(r => r.data)
export const fetchLotes     = (fazenda)  => api.get('/lotes', { params: { fazenda } }).then(r => r.data)
export const fetchDates     = (fazenda)  => api.get('/dates', { params: { fazenda } }).then(r => r.data)
export const fetchKpis      = (params)   => api.get('/dashboard/kpis', { params }).then(r => r.data)
export const fetchData      = (params)   => api.get('/dashboard/data', { params }).then(r => r.data)
export const fetchBatchSum  = (params)   => api.get('/dashboard/batch-summary', { params }).then(r => r.data)
export const fetchMonthly   = (params)   => api.get('/dashboard/monthly', { params }).then(r => r.data)
export const fetchRaw       = (params)   => api.get('/dashboard/raw', { params }).then(r => r.data)
export const fetchUploads   = ()         => api.get('/uploads').then(r => r.data)
export const uploadFile     = (fd)       => api.post('/upload', fd).then(r => r.data)

export const fetchMetaSobra = (fazenda)  => api.get('/config/meta-sobra', { params: { fazenda } }).then(r => r.data)
export const saveMetaSobra  = (body)     => api.post('/config/meta-sobra', body).then(r => r.data)
export const deleteMetaSobra = (fazenda, lote) => api.delete('/config/meta-sobra', { params: { fazenda, lote } }).then(r => r.data)

export const templateUrl    = '/api/template'
export const templateCsvUrl = '/api/template?fmt=csv'

export default api
