// ── Cores fixas para lotes conhecidos ──────────────────────────────────────
const FIXED_COLORS = {
  'TOP VACA':  '#16a34a',
  'TOP NOV':   '#0ea5e9',
  'CB1':       '#7c3aed',
  'CB2':       '#d97706',
  'CB4':       '#dc2626',
  'PÓS PARTO': '#db2777',
}

const PALETTE = [
  '#16a34a', '#0ea5e9', '#7c3aed', '#d97706',
  '#dc2626', '#db2777', '#0891b2', '#65a30d',
  '#9333ea', '#ea580c', '#0d9488', '#b45309',
]

// Cor especial da linha "Rebanho" (média ponderada de todos os lotes)
export const REBANHO_COLOR = '#1e3a5f'

// Retorna cor para um lote (fixo ou do palette por índice)
export function getLoteColor(lote, index = 0) {
  return FIXED_COLORS[lote] || PALETTE[index % PALETTE.length]
}

// Compatibilidade com código legado
export const LOTE_COLORS = FIXED_COLORS
export const ALL_LOTES   = Object.keys(FIXED_COLORS)

// ── Pivot helpers ──────────────────────────────────────────────────────────

/**
 * Transforma linhas brutas em array { date, 'TOP VACA': val, 'CB1': val, … }
 * agrupado por data_registro.
 */
export function pivotByDate(rows, field) {
  const map = {}
  for (const row of rows) {
    const d = row.data_registro
    if (!map[d]) map[d] = { date: d }
    map[d][row.lote] = Number(row[field])
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Igual ao pivotByDate mas adiciona a key "Rebanho" com a média
 * ponderada por num_vacas de `weightedField`.
 *
 * Para eficiência:   numField='producao_leite_total', denField='consumo_ms_total'
 * Para leite/vaca:   numField='producao_leite_total', denField='num_vacas'
 * Para CMS/vaca:     numField='consumo_ms_total',     denField='num_vacas'
 */
export function pivotWithHerd(rows, field, numField, denField) {
  // Acumula numerador / denominador por data para o rebanho
  const herd = {}
  for (const row of rows) {
    const d = row.data_registro
    if (!herd[d]) herd[d] = { num: 0, den: 0 }
    herd[d].num += Number(row[numField] || 0)
    herd[d].den += Number(row[denField] || 0)
  }

  // Pivot por lote
  const map = {}
  for (const row of rows) {
    const d = row.data_registro
    if (!map[d]) map[d] = { date: d }
    map[d][row.lote] = Number(row[field])
  }

  // Injeta linha Rebanho
  for (const [d, { num, den }] of Object.entries(herd)) {
    if (map[d] && den > 0) map[d]['Rebanho'] = Number((num / den).toFixed(4))
  }

  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Calcula média ponderada de `field` por `weightField` para cada data_registro.
 * Retorna { 'YYYY-MM-DD': valor, … }
 */
export function weightedHerdByDate(rows, field, weightField) {
  const map = {}
  for (const row of rows) {
    const d = row.data_registro
    if (!map[d]) map[d] = { wsum: 0, wden: 0 }
    const f = Number(row[field])
    const w = Number(row[weightField] || 0)
    if (!isNaN(f) && f !== 0) {
      map[d].wsum += f * w
      map[d].wden += w
    }
  }
  const result = {}
  for (const [d, { wsum, wden }] of Object.entries(map)) {
    result[d] = wden > 0 ? Number((wsum / wden).toFixed(4)) : null
  }
  return result
}

/**
 * Pivot de dados mensais (campo `mes` = 'YYYY-MM') com linha "Rebanho"
 * usando média ponderada por avg_vacas.
 */
export function pivotMonthlyWithHerd(rows, field) {
  const herd = {}
  for (const row of rows) {
    const m = row.mes
    if (!herd[m]) herd[m] = { wsum: 0, wden: 0 }
    const vacas = Number(row.avg_vacas || 1)
    herd[m].wsum += Number(row[field] || 0) * vacas
    herd[m].wden += vacas
  }

  const map = {}
  for (const row of rows) {
    const m = row.mes
    if (!map[m]) map[m] = { date: m }
    map[m][row.lote] = Number(row[field])
  }

  for (const [m, { wsum, wden }] of Object.entries(herd)) {
    if (map[m] && wden > 0) map[m]['Rebanho'] = Number((wsum / wden).toFixed(4))
  }

  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
}

// ── Formatadores ──────────────────────────────────────────────────────────

export function fmtDate(dateStr) {
  if (!dateStr) return ''
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

export function fmtMonth(monthStr) {
  if (!monthStr) return ''
  const [y, m] = monthStr.split('-')
  const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${names[Number(m) - 1]}/${y.slice(2)}`
}

export function tooltipFmt(value, name) {
  return [Number(value).toFixed(2), name]
}
