export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'boolean') return null

  const text = String(value).trim()
  if (!text) return null
  const negative = /^\(.*\)$/.test(text)
  const cleaned = text
    .replace(/^\((.*)\)$/, '$1')
    .replace(/[,，\s%¥$￥]/g, '')
  if (!cleaned || cleaned === '-') return null

  const numeric = Number(cleaned)
  if (!Number.isFinite(numeric)) return null
  return negative ? -numeric : numeric
}
