import type { SerializableEchartsOption, TableData } from '@/types'
import { cloneSerializableOption } from './optionClone'

export function createInitialOption(): SerializableEchartsOption {
  return {
    backgroundColor: 'transparent',
    color: ['#4F8CFF', '#6C5CE7', '#22C55E', '#F59E0B', '#EF4444', '#38BDF8'],
    textStyle: { fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif' },
    title: { text: '未命名图表', left: 16, top: 12, textStyle: { fontSize: 18, fontWeight: 600 } },
    tooltip: { trigger: 'axis' },
    legend: { top: 12, right: 16 },
    grid: { show: false, left: 48, right: 28, top: 56, bottom: 44, containLabel: true },
    xAxis: [{ type: 'category', splitLine: { show: false } }],
    yAxis: [{ type: 'value', splitLine: { show: false } }],
    series: [],
    animation: true,
  }
}

export function tableToSource(table: TableData): Array<Array<string | number | boolean | null>> {
  return [table.columns, ...table.rows]
}

export function applyTableToOption(
  table: TableData,
  option: SerializableEchartsOption,
): SerializableEchartsOption {
  const next = cloneSerializableOption(option)
  const source = tableToSource(table)
  const datasets = Array.isArray(next.dataset) ? next.dataset : []
  const existingIndex = datasets.findIndex(
    (item) => Boolean(item) && typeof item === 'object' && (item as Record<string, unknown>).id === 'workspace-dataset',
  )
  const datasetNode = { id: 'workspace-dataset', sourceHeader: 1, source }
  if (existingIndex >= 0) datasets[existingIndex] = datasetNode
  else datasets.unshift(datasetNode)
  next.dataset = datasets

  const series = Array.isArray(next.series) ? next.series : []
  if (!series.length && table.columns.length > 1) {
    const valueIndex = table.inferredTypes.findIndex((type, index) => index > 0 && type === 'number')
    const yIndex = valueIndex >= 0 ? valueIndex : 1
    series.push({
      id: 'workspace-series-1',
      name: table.columns[yIndex],
      type: 'bar',
      encode: { x: 0, y: [yIndex] },
    })
    next.series = series
  }
  return next
}
