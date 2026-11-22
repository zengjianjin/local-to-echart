import type { TableData } from '@/types'
import { parseCsvText } from './csv'
import { parseExcelBuffer } from './excel'

export function isExcelFile(file: File): boolean {
  return /\.(xlsx|xlsm|xls)$/i.test(file.name)
}

export async function parseDataFile(file: File, sheetName?: string): Promise<TableData> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (['csv', 'tsv', 'txt'].includes(extension)) {
    return parseCsvText(await file.text(), file.name)
  }
  if (isExcelFile(file)) {
    return parseExcelBuffer(await file.arrayBuffer(), file.name, sheetName)
  }
  throw new Error(`不支持的文件类型: .${extension || '未知'}`)
}
