import type { EChartsOption } from 'echarts'
import type {
  AggregateMethod,
  CellValue,
  ChartConfig,
  ChartType,
  DataRow,
  Dataset,
  PaletteKey,
} from '../types'

export const PALETTES: Record<PaletteKey, string[]> = {
  ocean: ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'],
  forest: ['#10b981', '#84cc16', '#14b8a6', '#65a30d', '#0ea5e9'],
  sunset: ['#f97316', '#ef4444', '#f59e0b', '#eab308', '#8b5cf6'],
}

export const PALETTE_LABELS: Record<PaletteKey, string> = {
  ocean: '海洋蓝',
  forest: '森林绿',
  sunset: '暖阳橙',
}

export const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: '柱状图' },
  { value: 'line', label: '折线图' },
  { value: 'pie', label: '饼图' },
]

export const AGGREGATES: { value: AggregateMethod; label: string }[] = [
  { value: 'sum', label: '求和' },
  { value: 'avg', label: '平均值' },
  { value: 'count', label: '计数' },
  { value: 'max', label: '最大值' },
  { value: 'min', label: '最小值' },
  { value: 'first', label: '首条值' },
]

function aggregate(values: CellValue[], method: AggregateMethod): number {
  if (method === 'count') {
    return values.filter((v) => v !== null && v !== undefined && v !== '').length
  }
  const nums = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  if (!nums.length) return 0
  if (method === 'avg') return nums.reduce((a, b) => a + b, 0) / nums.length
  if (method === 'max') return Math.max(...nums)
  if (method === 'min') return Math.min(...nums)
  if (method === 'first') return nums[0]
  return nums.reduce((a, b) => a + b, 0)
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000
}

export function buildOption(dataset: Dataset | null | undefined, config: ChartConfig): EChartsOption | null {
  if (!dataset || !dataset.columns.length) return null

  const requestedX = Array.isArray(config.xFields)
    ? config.xFields
    : [config.xField || dataset.columns[0]]
  const validX = requestedX.filter((f) => dataset.columns.includes(f))
  const xFields = validX.length ? validX : [dataset.columns[0]]
  const separator = config.xSeparator ?? ' / '
  const yFields = config.yFields.filter((f) => dataset.columns.includes(f))
  const fields = yFields.length ? yFields : dataset.numericColumns.slice(0, 1)
  if (!fields.length) return null

  // Stacking dimension: split rows by this field's values into separate series,
  // while the X axis stays on the selected field(s). E.g. X=时段, stack=结算日期
  // gives one bar per time period made of one segment per date.
  const stackField = config.stackField && dataset.columns.includes(config.stackField)
    ? config.stackField
    : ''
  const availableStackValues = stackField
    ? [...new Set(dataset.rows.map((r) => String(r[stackField] ?? '')).filter((v) => v !== ''))]
    : []
  const selectedStack = stackField
    ? (Array.isArray(config.stackValues) && config.stackValues.length
        ? config.stackValues.filter((v) => availableStackValues.includes(v))
        : availableStackValues.slice(0, 4))
    : []
  const useStack = Boolean(stackField && selectedStack.length)
  const stackValues = useStack ? selectedStack : ['']
  const doStack = useStack && config.stacked !== false

  const rowXKey = (row: DataRow) => xFields.map((field) => String(row[field] ?? '')).join(separator)
  const eligibleRows = dataset.rows.filter((row) => (
    !useStack || selectedStack.includes(String(row[stackField] ?? ''))
  ))
  const limit = Math.max(1, Number(config.limit) || 24)
  const categories = [...new Set(eligibleRows.map(rowXKey))].slice(0, limit)

  // buckets[stackValue\x00xKey] = per-value-field arrays of raw values
  const buckets = new Map<string, CellValue[][]>()
  dataset.rows.forEach((row) => {
    const stackValue = useStack ? String(row[stackField] ?? '') : ''
    if (useStack && !selectedStack.includes(stackValue)) return
    const xKey = rowXKey(row)
    if (!categories.includes(xKey)) return
    const key = `${stackValue}\u0000${xKey}`
    if (!buckets.has(key)) buckets.set(key, fields.map((): CellValue[] => []))
    const bucket = buckets.get(key)
    if (!bucket) return
    fields.forEach((field, i) => {
      const value = row[field]
      if (value !== '' && value !== null && value !== undefined) bucket[i].push(value)
    })
  })
  const valueAt = (stackValue: string, xKey: string, index: number) => round(
    aggregate(buckets.get(`${stackValue}\u0000${xKey}`)?.[index] || [], config.aggregate),
  )

  const palette = PALETTES[config.palette] || PALETTES.ocean
  const isPie = config.type === 'pie'
  const stackLabel = stackField ? `（按${stackField}堆叠）` : ''

  const option: EChartsOption = {
    color: palette,
    animationDuration: 350,
    title: {
      text: config.title || `${fields.join(' / ')} · 按${xFields.join('+')}${stackLabel}`,
      left: 0,
      top: 0,
      textStyle: { fontSize: 17, fontWeight: 600, color: '#1f2937' },
    },
    tooltip: isPie
      ? { trigger: 'item', valueFormatter: (v: unknown) => String(round(Number(v))) }
      : { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      top: 34,
      left: 0,
      type: 'scroll',
      itemWidth: 14,
      itemHeight: 8,
      textStyle: { color: '#6b7280', fontSize: 12 },
    },
    series: [],
  }

  if (isPie) {
    option.series = [{
      name: fields[0],
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '60%'],
      itemStyle: { borderColor: '#ffffff', borderWidth: 2, borderRadius: 4 },
      label: { formatter: '{b}: {d}%', color: '#4b5563', fontSize: 12 },
      data: categories.map((name) => ({
        name,
        value: stackValues.reduce((sum, sv) => sum + valueAt(sv, name, 0), 0),
      })),
    }]
  } else {
    const type = config.type === 'line' ? 'line' : 'bar'
    option.grid = { left: 8, right: 16, top: 78, bottom: 8, containLabel: true }
    option.xAxis = {
      type: 'category',
      data: categories,
      axisLabel: { color: '#6b7280', fontSize: 11, hideOverlap: true },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
    }
    option.yAxis = {
      type: 'value',
      splitLine: { lineStyle: { color: '#f0f2f5' } },
      axisLabel: { color: '#9ca3af', fontSize: 11 },
    }
    option.series = []
    stackValues.forEach((sv) => {
      fields.forEach((field, i) => {
        const series = option.series as Record<string, unknown>[]
        series.push({
          name: useStack ? `${sv} · ${field}` : field,
          type,
          stack: doStack && fields.length === 1 ? 'total' : (doStack ? field : undefined),
          smooth: type === 'line',
          showSymbol: type === 'line' && categories.length <= 20,
          barMaxWidth: 36,
          itemStyle: { borderRadius: type === 'bar' && !doStack ? [4, 4, 0, 0] : 0 },
          data: categories.map((xKey) => valueAt(sv, xKey, i)),
        })
      })
    })
  }

  return option
}
