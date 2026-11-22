import * as XLSX from 'xlsx'
import type { InferredFieldType, TableData } from '@/types'
import { inferTypeFromValues } from './typeInference'

function toCellValue(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null || value === '') return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  return String(value)
}

export function getExcelSheetInfo(buffer: ArrayBuffer): Array<{ name: string; rowCount: number }> {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name]
    const rows = sheet
      ? (XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true }) as unknown[][])
      : []
    return { name, rowCount: Math.max(0, rows.length - 1) }
  })
}

export function parseExcelBuffer(buffer: ArrayBuffer, name: string, sheetName?: string): TableData {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const target = sheetName ?? workbook.SheetNames[0]
  const sheet = target ? workbook.Sheets[target] : undefined
  const rawRows = sheet
    ? (XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true }) as unknown[][])
    : []
  if (!rawRows.length) throw new Error('工作簿中没有可读取的数据')

  const width = Math.max(...rawRows.map((row) => row.length))
  const columns = rawRows[0].map((cell, index) => String(cell ?? '').trim() || `字段 ${index + 1}`)
  while (columns.length < width) columns.push(`字段 ${columns.length + 1}`)
  const rows = rawRows.slice(1).map((row) =>
    Array.from({ length: width }, (_, index) => toCellValue(row[index])),
  )
  const inferredTypes: InferredFieldType[] = columns.map((_, index) =>
    inferTypeFromValues(rows.map((row) => row[index] ?? null)),
  )

  return { name, columns, rows, inferredTypes, rowCount: rows.length }
}
