import type { SerializableNode } from '@/types'

export function normalizeEncodeInput(path: string, value: SerializableNode): SerializableNode {
  if (typeof value !== 'string' || !/\.encode\.(x|y|itemName|value)$/.test(path)) return value
  const text = value.trim()
  if (/^\[\s*\d+(?:\s*,\s*\d+)*\s*\]$/.test(text)) {
    return text.slice(1, -1).split(',').map((item) => Number(item.trim()))
  }
  if (/^\d+$/.test(text)) {
    const numeric = Number(text)
    return path.endsWith('.encode.y') ? [numeric] : numeric
  }
  return value
}

function parseBracketList(text: string): SerializableNode[] | null {
  if (!text.startsWith('[') || !text.endsWith(']')) return null
  const inner = text.slice(1, -1).trim()
  if (!inner) return []
  return inner.split(',').map((entry) => {
    const item = entry.trim().replace(/^['"]|['"]$/g, '')
    if (/^-?\d+(\.\d+)?%$/.test(item)) return item
    const numeric = Number(item)
    return item !== '' && Number.isFinite(numeric) ? numeric : item
  })
}

export function normalizeFieldInput(path: string, value: SerializableNode): SerializableNode {
  const encodeValue = normalizeEncodeInput(path, value)
  if (encodeValue !== value || typeof value !== 'string') return encodeValue
  const text = value.trim()
  const listPaths = /(\.color|toolbox|padding|center|xAxisIndex|yAxisIndex)$/
  const numericPaths = /(\.symbolSize|\.min|\.max|\.animationThreshold|\.progressive|\.progressiveThreshold)$/
  if (listPaths.test(path)) {
    const list = parseBracketList(text)
    if (list) return list
    if (/^-?\d+$/.test(text) && /xAxisIndex|yAxisIndex|padding$/.test(path)) return Number(text)
  }
  if (numericPaths.test(path) && /^-?\d+(\.\d+)?$/.test(text)) return Number(text)
  return value
}
