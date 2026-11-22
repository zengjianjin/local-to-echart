import type { SerializableEchartsOption, TableData } from '@/types'
import { cloneOption } from './optionPath'

export function cloneSerializableOption(option: SerializableEchartsOption): SerializableEchartsOption {
  return cloneOption(option)
}

export function summarizeDatasetSize(table: TableData | null): string {
  if (!table) return '无数据'
  const cellCount = table.rowCount * table.columns.length
  if (cellCount > 20000) return `${table.rowCount} 行 · ${table.columns.length} 列 · 大数据集`
  return `${table.rowCount} 行 · ${table.columns.length} 列`
}
