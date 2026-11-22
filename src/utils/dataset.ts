import type { SerializableEchartsOption, TableData } from '@/types'
import { cloneSerializableOption } from './optionClone'
import { keepNonCartesianSeries } from './seriesKind'

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
  xFields: number[] = [0],
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

  const oldSeries = Array.isArray(next.series) ? next.series : []
  const customSeries = oldSeries.filter(
    (item) => !(Boolean(item) && typeof item === 'object' && String((item as Record<string, unknown>).id ?? '').startsWith('workspace-series')),
  )

  const xAxisReady = Array.isArray(next.xAxis) ? next.xAxis.length > 0 : Boolean(next.xAxis)
  const yAxisReady = Array.isArray(next.yAxis) ? next.yAxis.length > 0 : Boolean(next.yAxis)
  if (!xAxisReady || !yAxisReady) {
    next.series = keepNonCartesianSeries(customSeries)
    return next
  }

  const valueIndexes = table.inferredTypes
    .map((type, index) => ({ type, index }))
    .filter((item) => item.index > 0 && item.type === 'number')
    .map((item) => item.index)
  const finalValueIndexes = valueIndexes.length ? valueIndexes : (table.columns.length > 1 ? [1] : [])
  const xIndex = xFields[0] ?? 0

  const autoSeries = finalValueIndexes.map((valueIndex) => ({
    id: `workspace-series-${valueIndex}`,
    name: table.columns[valueIndex],
    type: 'bar',
    xAxisIndex: 0,
    encode: { x: xIndex, y: [valueIndex] },
  }))
  next.series = [...customSeries, ...autoSeries]
  return next
}
