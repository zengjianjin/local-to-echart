import Papa from 'papaparse'
import type { TableData } from '@/types'
import { inferTypeFromValues } from './typeInference'
import { toNumber } from './numberParse'

export function detectDelimiter(text: string): string {
  const line = text.split(/\r?\n/).find((item) => item.trim()) ?? ''
  const candidates = [',', '\t', ';', '|']
  return candidates.reduce((best, candidate) => {
    const count = line.split(candidate).length
    return count > best.count ? { delimiter: candidate, count } : best
  }, { delimiter: ',', count: 1 }).delimiter
}

function normalizeHeaderRow(value: number): number {
  return Math.min(20, Math.max(1, Math.floor(Number(value) || 1)))
}

function toCellValue(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'number' || typeof value === 'boolean') return value
  const numeric = toNumber(value)
  return numeric === null ? String(value) : numeric
}

export function parseCsvText(text: string, name = 'pasted.csv', headerRow = 1): TableData {
  const delimiter = detectDelimiter(text)
  let rawRows: unknown[][] = []
  Papa.parse<unknown[]>(text, {
    delimiter,
    skipEmptyLines: 'greedy',
    complete: (result) => {
      rawRows = result.data as unknown[][]
    },
  })
  if (!rawRows.length) throw new Error('CSV 中没有可读取的数据')

  const headerIndex = normalizeHeaderRow(headerRow) - 1
  if (headerIndex >= rawRows.length) throw new Error('表头行超出数据范围')
  const headerCells = rawRows[headerIndex] ?? []
  const width = Math.max(...rawRows.map((row) => row.length), headerCells.length)
  const usedNames = new Map<string, number>()
  const columns = Array.from({ length: width }, (_, index) => {
    let base = String(headerCells[index] ?? '').trim() || `字段 ${index + 1}`
    const group = String(rawRows[headerIndex - 1]?.[index] ?? '').trim()
    if (group && group !== base) base = `${group} / ${base}`
    const count = (usedNames.get(base) ?? 0) + 1
    usedNames.set(base, count)
    return count > 1 ? `${base} (${count})` : base
  })
  const body = rawRows.slice(headerIndex + 1).map((row) =>
    Array.from({ length: width }, (_, index) => toCellValue(row[index])),
  )
  const inferredTypes = columns.map((_, index) => inferTypeFromValues(body.map((row) => row[index] ?? null)))
  const rows = body.map((row) =>
    row.map((cell, index) => {
      if (cell === null) return null
      if (inferredTypes[index] === 'number') {
        const numeric = Number(cell)
        return Number.isNaN(numeric) ? cell : numeric
      }
      if (inferredTypes[index] === 'boolean') {
        return cell === true || String(cell).toLowerCase() === 'true'
      }
      return cell
    }),
  )
  return { name, columns, rows, inferredTypes, rowCount: rows.length }
}
