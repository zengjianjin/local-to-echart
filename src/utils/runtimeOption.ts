import type { FormatterDescriptor, SerializableNode } from '@/types'

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

export function materializeRuntimeOption(option: Record<string, SerializableNode>): RuntimeOption {
  return materializeNode(option) as RuntimeOption
}
