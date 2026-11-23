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

function normalize(rows: unknown[][]): Array<Array<string | number | boolean | null>> {
  if (!rows.length) return []
  const width = Math.max(...rows.map((row) => row.length))
  const columns = rows[0].map((cell, index) => String(cell ?? '').trim() || `字段 ${index + 1}`)
  while (columns.length < width) columns.push(`字段 ${columns.length + 1}`)
  const body = rows.slice(1).map((row) =>
    Array.from({ length: width }, (_, index) => {
      const value = row[index]
      if (value === undefined || value === null || value === '') return null
      if (typeof value === 'number' || typeof value === 'boolean') return value
      const numeric = toNumber(value)
      return numeric === null ? String(value) : numeric
    }),
  )
  return [columns, ...body]
}

export function parseCsvText(text: string, name = 'pasted.csv'): TableData {
  const delimiter = detectDelimiter(text)
  let rawRows: unknown[][] = []
  Papa.parse<unknown[]>(text, {
    delimiter,
    skipEmptyLines: 'greedy',
    complete: (result) => {
      rawRows = result.data as unknown[][]
    },
  })
  const normalized = normalize(rawRows)
  const columns = (normalized[0] ?? []).map((cell) => String(cell ?? ''))
  const body = normalized.slice(1)
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
