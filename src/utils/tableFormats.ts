import type { TableData } from '@/types'
import { inferTypeFromValues } from './typeInference'
import { toNumber } from './numberParse'
import { parseCsvText } from './csv'

type Cell = string | number | boolean | null

function toCell(value: unknown): Cell {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'number' || typeof value === 'boolean') return value
  const numeric = toNumber(value)
  if (numeric !== null) return numeric
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function uniqueColumns(header: unknown[], width: number): string[] {
  const used = new Map<string, number>()
  const columns = Array.from({ length: width }, (_, index) => {
    let base = String(header[index] ?? '').trim() || `字段 ${index + 1}`
    const count = (used.get(base) ?? 0) + 1
    used.set(base, count)
    return count > 1 ? `${base} (${count})` : base
  })
  return columns
}

function finalizeTable(name: string, header: unknown[], bodyRows: unknown[][]): TableData {
  const width = Math.max(header.length, ...bodyRows.map((row) => row.length), 1)
  const columns = uniqueColumns(header, width)
  const rows = bodyRows.map((row) =>
    Array.from({ length: width }, (_, index) => toCell(row[index])),
  )
  const inferredTypes = columns.map((_, index) =>
    inferTypeFromValues(rows.map((row) => row[index] ?? null)),
  )
  return { name, columns, rows, inferredTypes, rowCount: rows.length }
}

function jsonValueToRow(value: unknown, columns: string[]): Cell[] {
  if (Array.isArray(value)) return columns.map((_, index) => toCell(value[index]))
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return columns.map((column) => toCell(record[column]))
  }
  return columns.map((_, index) => (index === 0 ? toCell(value) : null))
}

function parseObjectRecords(name: string, records: Array<Record<string, unknown>>): TableData {
  const columns: string[] = []
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!columns.includes(key)) columns.push(key)
    }
  }
  if (!columns.length) throw new Error('JSON 中没有可读取的字段')
  return finalizeTable(name, columns, records.map((record) => jsonValueToRow(record, columns)))
}

function unwrapJsonArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of ['data', 'rows', 'records', 'items', 'list']) {
      if (Array.isArray(record[key])) return record[key]
    }
  }
  return null
}

function parseJsonLines(text: string, name: string): TableData {
  const records: Array<Record<string, unknown>> = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const value: unknown = JSON.parse(line)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      records.push(value as Record<string, unknown>)
    }
  }
  if (!records.length) throw new Error('JSON Lines 中没有可读取的对象')
  return parseObjectRecords(name, records)
}

function isJsonLines(text: string): boolean {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return false
  if (!lines.every((line) => line.trimStart().startsWith('{'))) return false
  try {
    JSON.parse(text)
    return false
  } catch {
    return lines.every((line) => {
      try {
        const value: unknown = JSON.parse(line)
        return Boolean(value && typeof value === 'object' && !Array.isArray(value))
      } catch {
        return false
      }
    })
  }
}

export function parseJsonTable(text: string, name = 'data.json'): TableData {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('JSON 内容为空')
  if (isJsonLines(trimmed)) return parseJsonLines(trimmed, name)

  let value: unknown
  try {
    value = JSON.parse(trimmed)
  } catch {
    throw new Error('JSON 格式无法解析')
  }

  const array = unwrapJsonArray(value)
  if (array) {
    if (!array.length) throw new Error('JSON 数组为空')
    if (Array.isArray(array[0])) {
      const header = array[0] as unknown[]
      return finalizeTable(name, header, array.slice(1) as unknown[][])
    }
    return parseObjectRecords(name, array.filter(
      (item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)),
    ))
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const columns = Object.keys(record)
    return finalizeTable(name, columns, [columns.map((column) => record[column])])
  }
  throw new Error('JSON 根节点需要是数组、对象数组或 JSON Lines')
}

function splitMarkdownRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, '|'))
}

function isMarkdownDivider(line: string): boolean {
  if (!line.includes('-')) return false
  const cells = splitMarkdownRow(line)
  return cells.length > 0 && cells.every((cell) => /^:?-{1,}:?$/.test(cell))
}

export function parseMarkdownTable(text: string, name = 'table.md'): TableData {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  const tableLines = lines.filter((line) => line.includes('|') && !isMarkdownDivider(line))
  if (tableLines.length < 2) throw new Error('未找到有效的 Markdown 表格')
  const header = splitMarkdownRow(tableLines[0])
  const body = tableLines.slice(1).map(splitMarkdownRow)
  return finalizeTable(name, header, body)
}

export function looksLikeMarkdown(text: string): boolean {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  return lines.some((line) => line.includes('|')) && lines.some(isMarkdownDivider)
}

export function looksLikeJson(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.startsWith('[') || trimmed.startsWith('{')
}

export function parseClipboardText(text: string, name = 'pasted.txt'): TableData {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('剪贴板内容为空')
  if (looksLikeMarkdown(trimmed)) return parseMarkdownTable(trimmed, name)
  if (looksLikeJson(trimmed)) return parseJsonTable(trimmed, name)
  return parseCsvText(trimmed, name)
}
