export const fmt = (n, d = 1) =>
  n == null ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d })

export const fmtInt = (n) =>
  n == null ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 })

export const fmtDate = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${d} ${months[Number(m) - 1]} ${y}`
}

export const monthName = (mesStr) => {
  if (!mesStr) return ''
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const [, m] = mesStr.split('-')
  return months[Number(m) - 1] || mesStr
}
