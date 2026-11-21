import * as XLSX from 'xlsx'
import type { DataRow, Dataset, Table } from '../types'

const DELIMITERS = [',', '\t', ';', '|']

/** Minimal shape of an Excel merged-cell range (only what the header logic needs). */
interface MergeRange {
  s: { r: number; c: number }
  e: { r: number; c: number }
}

function countOutsideQuotes(text: string, delimiter: string): number {
  let count = 0
  let inQuotes = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') i += 1
      else inQuotes = !inQuotes
    } else if (ch === delimiter && !inQuotes) {
      count += 1
    }
  }
  return count
}

export function detectDelimiter(text: string): string {
  const sample = text.split(/\r?\n/).slice(0, 5).join('\n')
  return DELIMITERS.reduce(
    (best, d) => (countOutsideQuotes(sample, d) > countOutsideQuotes(sample, best) ? d : best),
    ',',
  )
}

function splitDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1 } else inQuotes = false
      } else {
        field += ch
      }
    } else if (ch === '"' && field.trim() === '') {
      inQuotes = true
    } else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1
      row.push(field)
      field = ''
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  row.push(field)
  if (row.some((cell) => String(cell).trim() !== '')) rows.push(row)
  return rows
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const cleaned = String(value).trim().replace(/[,\s%¥$]/g, '')
  if (cleaned === '' || cleaned === '-') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function isNumericColumn(rows: DataRow[], column: string): boolean {
  const present = rows.map((r) => r[column]).filter((v) => v !== '' && v !== null && v !== undefined)
  if (!present.length) return false
  const numeric = present.filter((v) => toNumber(v) !== null).length
  return numeric / present.length >= 0.8
}

// Decide whether the first N rows form a multi-level header.
// A second header row is detected when row 1 is mostly non-numeric while
// row 2 continues the header structure (merged spans or repeated group labels).
function detectHeaderRowCount(matrix: unknown[][], merges: MergeRange[]): number {
  if (matrix.length < 3) return 1
  const hasVerticalMergeInFirstRow = merges.some((m) => m.s.r === 0 && m.e.r >= 1)
  const hasHorizontalMergeInFirstRow = merges.some((m) => m.s.r === m.e.r && m.s.r === 0 && m.e.c > m.s.c)
  if (!hasVerticalMergeInFirstRow && !hasHorizontalMergeInFirstRow) return 1

  const second = matrix[1] || []
  const numericCells = second.filter((v) => toNumber(v) !== null).length
  const filled = second.filter((v) => String(v).trim() !== '').length
  // If the second row is almost entirely numbers, it is data, not a header.
  if (filled > 0 && numericCells / filled > 0.6) return 1
  return 2
}

// Expand merged header cells and join two header levels into unique names.
function expandMergedHeaders(matrix: unknown[][], merges: MergeRange[], headerRows: number): unknown[][] {
  if (headerRows < 2) return matrix

  const grid = matrix.slice()
  const width = Math.max(...grid.map((r) => r.length))

  const fill = (rowIndex: number) => {
    merges
      .filter((m) => m.s.r <= rowIndex && m.e.r >= rowIndex)
      .forEach((m) => {
        const value = grid[m.s.r]?.[m.s.c]
        if (value === undefined || String(value).trim() === '') return
        for (let c = m.s.c; c <= m.e.c; c += 1) {
          if (grid[rowIndex][c] === undefined || String(grid[rowIndex][c]).trim() === '') {
            grid[rowIndex][c] = value
          }
        }
      })
  }
  fill(0)
  if (headerRows > 1) fill(1)

  const first = grid[0]
  const second = grid[1] || []
  const names: string[] = []
  for (let c = 0; c < width; c += 1) {
    const top = String(first[c] ?? '').trim()
    const sub = String(second[c] ?? '').trim()
    if (!top && !sub) {
      names.push(`列${c + 1}`)
    } else if (!sub || sub === top) {
      names.push(top)
    } else {
      names.push(`${top}/${sub}`)
    }
  }

  grid[0] = names
  grid.splice(1, headerRows - 1)
  return grid
}

function toTable(rawRows: unknown[][]): Table {
  const clean = rawRows.filter((row) => row.some((cell) => String(cell).trim() !== ''))
  if (!clean.length) throw new Error('文件里没有可读取的数据行')

  const seen = new Map<string, number>()
  const columns = clean[0].map((raw, i) => {
    let name = String(raw).trim() || `列${i + 1}`
    if (seen.has(name)) {
      const n = (seen.get(name) ?? 0) + 1
      seen.set(name, n)
      name = `${name}_${n}`
    } else {
      seen.set(name, 1)
    }
    return name
  })

  const rows: DataRow[] = clean.slice(1).map((row) => {
    const item: DataRow = {}
    columns.forEach((col, i) => {
      item[col] = row[i] === undefined ? '' : String(row[i]).trim()
    })
    return item
  })

  const numericColumns = columns.filter((col) => isNumericColumn(rows, col))
  numericColumns.forEach((col) => {
    rows.forEach((row) => { row[col] = toNumber(row[col]) })
  })

  return { columns, rows, numericColumns }
}

export function parseDelimited(text: string): Table {
  const normalized = String(text).replace(/^\uFEFF/, '')
  return toTable(splitDelimited(normalized, detectDelimiter(normalized)))
}

export async function parseFile(file: File): Promise<Dataset> {
  const name = file.name || '未命名文件'
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  let table: Table

  if (['xlsx', 'xls', 'xlsm'].includes(ext)) {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!sheet) throw new Error('Excel 文件里没有工作表')
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false }) as unknown[][]
    // Support merged / two-level headers (common in Chinese billing exports).
    // sheet_to_json fills merged cells with empty strings, so back-fill them
    // from the merge ranges before building composite column names.
    const merges = (sheet['!merges'] || []) as MergeRange[]
    const headerRows = detectHeaderRowCount(matrix, merges)
    const expanded = expandMergedHeaders(matrix, merges, headerRows)
    table = toTable(expanded)
  } else if (['csv', 'tsv', 'txt'].includes(ext)) {
    table = parseDelimited(await file.text())
  } else {
    throw new Error(`暂不支持 .${ext}，请选择 CSV / TSV / Excel 文件`)
  }

  return { ...table, name, rowCount: table.rows.length }
}
