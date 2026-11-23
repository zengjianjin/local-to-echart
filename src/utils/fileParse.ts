import type { TableData } from '@/types'
import { parseCsvText } from './csv'
import { parseExcelBuffer } from './excel'
import { parseJsonTable, parseMarkdownTable } from './tableFormats'

export const TEXT_FILE_EXTENSIONS = ['csv', 'tsv', 'txt', 'json', 'jsonl', 'ndjson', 'md', 'markdown']
export const FILE_ACCEPT = '.csv,.tsv,.txt,.json,.jsonl,.ndjson,.md,.markdown,.xlsx,.xlsm,.xls'

export function isExcelFile(file: File): boolean {
  return /\.(xlsx|xlsm|xls)$/i.test(file.name)
}

export function isSupportedFile(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return TEXT_FILE_EXTENSIONS.includes(extension) || isExcelFile(file)
}

export async function parseDataFile(file: File, sheetName?: string, headerRow = 1): Promise<TableData> {
  const text = await file.text()
  return parseTextFile(text, file.name, sheetName, headerRow)
}

export function parseTextFile(text: string, name: string, sheetName?: string, headerRow = 1): TableData {
  const extension = name.split('.').pop()?.toLowerCase() ?? ''
  if (['csv', 'tsv', 'txt'].includes(extension)) return parseCsvText(text, name, headerRow)
  if (['json', 'jsonl', 'ndjson'].includes(extension)) return parseJsonTable(text, name)
  if (['md', 'markdown'].includes(extension)) return parseMarkdownTable(text, name)
  if (isExcelFile({ name } as File)) throw new Error('Excel 文件需要二进制数据')
  throw new Error(`不支持的文件类型: .${extension || '未知'}`)
}
