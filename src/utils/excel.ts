import * as XLSX from 'xlsx'
import type { InferredFieldType, TableData } from '@/types'
import { inferTypeFromValues } from './typeInference'
import { toNumber } from './numberParse'

function toCellValue(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null || value === '') return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  const numeric = toNumber(value)
  return numeric === null ? String(value) : numeric
}

function normalizeHeaderRow(value: number): number {
  return Math.min(20, Math.max(1, Math.floor(Number(value) || 1)))
}

function groupNameForColumn(
  rows: unknown[][],
  merges: XLSX.Range[] | undefined,
  headerIndex: number,
  columnIndex: number,
): string {
  if (!merges?.length) return ''
  let group = ''
  let nearestRow = -1
  for (const merge of merges) {
    if (merge.s.c > columnIndex || merge.e.c < columnIndex) continue
    if (merge.e.c === merge.s.c || merge.s.r >= headerIndex) continue
    const label = rows[merge.s.r]?.[merge.s.c]
    if (typeof label !== 'string' && typeof label !== 'number') continue
    const text = String(label).trim()
    if (!text || merge.s.r < nearestRow) continue
    nearestRow = merge.s.r
    group = text
  }
  return group
}

export function getExcelSheetInfo(buffer: ArrayBuffer, headerRow = 1): Array<{ name: string; rowCount: number }> {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const headerIndex = normalizeHeaderRow(headerRow) - 1
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name]
    const rows = sheet
      ? (XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true }) as unknown[][])
      : []
    return { name, rowCount: Math.max(0, rows.length - headerIndex - 1) }
  })
}

export function parseExcelBuffer(buffer: ArrayBuffer, name: string, sheetName?: string, headerRow = 1): TableData {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const target = sheetName ?? workbook.SheetNames[0]
  const sheet = target ? workbook.Sheets[target] : undefined
  const rawRows = sheet
    ? (XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true }) as unknown[][])
    : []
  if (!rawRows.length) throw new Error('工作簿中没有可读取的数据')

  const headerIndex = normalizeHeaderRow(headerRow) - 1
  if (headerIndex >= rawRows.length) throw new Error('表头行超出数据范围')
  const headerCells = rawRows[headerIndex] ?? []

  const width = Math.max(...rawRows.map((row) => row.length), headerCells.length)
  const usedNames = new Map<string, number>()
  const columns = Array.from({ length: width }, (_, index) => {
    let base = String(headerCells[index] ?? '').trim() || `字段 ${index + 1}`
    const group = groupNameForColumn(rawRows, sheet?.['!merges'], headerIndex, index)
    if (group && group !== base) base = `${group} / ${base}`
    const count = (usedNames.get(base) ?? 0) + 1
    usedNames.set(base, count)
    return count > 1 ? `${base} (${count})` : base
  })
  const rows = rawRows.slice(headerIndex + 1).map((row) =>
    Array.from({ length: width }, (_, index) => toCellValue(row[index])),
  )
  const inferredTypes: InferredFieldType[] = columns.map((_, index) =>
    inferTypeFromValues(rows.map((row) => row[index] ?? null)),
  )

  return { name, columns, rows, inferredTypes, rowCount: rows.length }
}
