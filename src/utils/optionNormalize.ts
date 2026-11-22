import type { SerializableEchartsOption, SerializableNode } from '@/types'
import { cloneSerializableOption } from './optionClone'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function normalizeDimension(value: unknown): SerializableNode {
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  return value as SerializableNode
}

function normalizeSeries(series: SerializableNode): { value: SerializableNode; isPie: boolean } {
  if (!isRecord(series)) return { value: series, isPie: false }
  const isPie = series.type === 'pie'
  if (!isPie || !isRecord(series.encode)) return { value: series, isPie }
  const encode = series.encode as Record<string, unknown>
  if ('value' in encode || (!('x' in encode) && !('y' in encode))) return { value: series, isPie }

  const rawName = encode.x ?? 0
  const rawValue = Array.isArray(encode.y) ? encode.y[0] : (encode.y ?? 1)
  const nextEncode: Record<string, SerializableNode> = {}
  for (const [key, entry] of Object.entries(encode)) {
    if (key !== 'x' && key !== 'y') nextEncode[key] = entry as SerializableNode
  }
  nextEncode.itemName = normalizeDimension(rawName)
  nextEncode.value = normalizeDimension(rawValue)
  return { value: { ...series, encode: nextEncode }, isPie }
}

export function normalizeOption(option: SerializableEchartsOption): SerializableEchartsOption {
  const next = cloneSerializableOption(option)

  if (Array.isArray(next.dataset)) {
    next.dataset = next.dataset.map((item) => {
      if (!isRecord(item) || !Array.isArray(item.source) || item.sourceHeader !== undefined) return item
      return { ...item, sourceHeader: 1 }
    })
  }

  if (Array.isArray(next.series)) {
    const normalized = next.series.map((item) => normalizeSeries(item))
    next.series = normalized.map((entry) => entry.value)
    const hasPie = normalized.some((entry) => entry.isPie)
    if (hasPie && isRecord(next.legend)) {
      const legend = next.legend as Record<string, SerializableNode>
      const top = legend.top
      if (typeof top !== 'number' || top < 40) legend.top = 44
      if (legend.type === undefined || legend.type === '') legend.type = 'scroll'
    }
  }

  return next
}
