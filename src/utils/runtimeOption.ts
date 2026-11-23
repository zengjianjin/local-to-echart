import { toRaw } from 'vue'
import type { FormatterDescriptor, SerializableNode } from '@/types'
import { keepNonCartesianSeries } from './seriesKind'

export interface RuntimeOption {
  [key: string]: unknown
}

function isFormatterDescriptor(value: unknown): value is FormatterDescriptor {
  return Boolean(
    value &&
      typeof value === 'object' &&
      '__templateFormatter' in value &&
      typeof (value as FormatterDescriptor).__templateFormatter.template === 'string',
  )
}

function lookup(params: unknown, key: string): string {
  if (params === null || params === undefined) return ''
  if (Array.isArray(params)) {
    const index = ['a', 'b', 'c', 'd'].indexOf(key)
    return index >= 0 ? String(params[index] ?? '') : ''
  }
  if (typeof params !== 'object') return ''
  const record = params as Record<string, unknown>
  const aliases: Record<string, string[]> = {
    a: ['seriesName', 'series'],
    b: ['name', 'axisValue'],
    c: ['value', 'data'],
    d: ['percent'],
  }
  const candidates = [key, ...(aliases[key] ?? [])]
  for (const candidate of candidates) {
    const value = record[candidate]
    if (value !== undefined && value !== null) return String(value)
  }
  if (key === 'value' && Array.isArray(record.data)) return String(record.data[1] ?? record.data[0] ?? '')
  return ''
}

function makeFormatter(descriptor: FormatterDescriptor) {
  const template = descriptor.__templateFormatter.template
  return (params: unknown) =>
    template.replace(/\{([a-zA-Z][\w]*)\}/g, (_, key: string) => lookup(params, key))
}

function materializeNode(node: SerializableNode): unknown {
  if (isFormatterDescriptor(node)) return makeFormatter(node)
  if (Array.isArray(node)) return node.map(materializeNode)
  if (node && typeof node === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(node)) {
      result[key] = materializeNode(value)
    }
    return result
  }
  return node
}

export function materializeDataset(node: SerializableNode): SerializableNode {
  if (!Array.isArray(node)) return node
  const raw = toRaw(node) as SerializableNode[]
  return node.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return raw[index]
    const record = item as Record<string, SerializableNode>
    const source = record.source
    const copy = { ...(toRaw(item) as Record<string, SerializableNode>) }
    if (Array.isArray(source)) copy.source = toRaw(source)
    return copy
  })
}

export function materializeRuntimeOption(option: Record<string, SerializableNode>): RuntimeOption {
  const result: RuntimeOption = {}
  for (const key of Object.keys(option)) {
    // dataset 是大数组（可能数万单元格），只读取到 source 引用这一层：
    // 保留「source 被替换」的响应式依赖，但不逐个遍历单元格，也不把 Vue proxy 交给 ECharts。
    result[key] = key === 'dataset' ? materializeDataset(option[key]) : materializeNode(option[key])
  }

  const series = result.series
  if (Array.isArray(series)) {
    const xEmpty = Array.isArray(result.xAxis) && result.xAxis.length === 0
    const yEmpty = Array.isArray(result.yAxis) && result.yAxis.length === 0
    if (xEmpty || yEmpty) result.series = keepNonCartesianSeries(series as SerializableNode[])
  }

  return result
}
