import type { SerializableEchartsOption, TableData } from '@/types'
import { translate } from '@/i18n/translate'
import { cloneOption } from './optionPath'

export function cloneSerializableOption(option: SerializableEchartsOption): SerializableEchartsOption {
  return cloneOption(option)
}

export function summarizeDatasetSize(table: TableData | null): string {
  if (!table) return translate('runtime.noData')
  const cellCount = table.rowCount * table.columns.length
  const params = { rows: table.rowCount, columns: table.columns.length }
  if (cellCount > 20000) return translate('runtime.datasetSummary', params)
  return translate('runtime.datasetSummaryShort', params)
}
