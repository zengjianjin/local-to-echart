import { computed, reactive, shallowRef, toRaw } from 'vue'
import type {
  ChartProjectFile,
  SerializableEchartsOption,
  SerializableNode,
  SeriesGroupConfig,
  TableData,
} from '@/types'
import { currentLocale, setI18nLocale } from '@/i18n'
import { notifyElectronLocale } from '@/i18n/electron'
import { persistLocale } from '@/i18n/language'
import { translate } from '@/i18n/translate'
import type { Locale } from '@/i18n/types'
import { applyTableToOption } from '@/utils/dataset'
import { createDefaultProject } from '@/utils/configFile'
import { logError } from '@/utils/logger'
import { getOptionValue, setOptionValue, unsetOptionValue } from '@/utils/optionPath'
import { normalizeOption } from '@/utils/optionNormalize'
import { materializeRuntimeOption } from '@/utils/runtimeOption'
import { keepNonCartesianSeries } from '@/utils/seriesKind'

interface UiState {
  leftCollapsed: boolean
  rightCollapsed: boolean
  rightExpanded: boolean
  editorMode: 'form' | 'json'
  activeSection: string
  search: string
  selectedPath: string
  jsonDraft: string
  jsonError: string
  errorMessage: string
  isImporting: boolean
  theme: 'light' | 'dark'
  locale: Locale
  dataPreviewOpen: boolean
}

function initialTheme(): 'light' | 'dark' {
  try {
    return localStorage.getItem('echarts-studio-theme') === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

const state = reactive({
  project: createDefaultProject(),
  table: null as TableData | null,
  ui: {
    leftCollapsed: false,
    rightCollapsed: false,
    rightExpanded: false,
    editorMode: 'form',
    activeSection: 'global',
    search: '',
    selectedPath: '',
    jsonDraft: '',
    jsonError: '',
    errorMessage: '',
    isImporting: false,
    theme: initialTheme(),
    locale: currentLocale(),
    dataPreviewOpen: false,
  } as UiState,
})

const chartInstance = shallowRef<unknown>(null)

function setChartInstance(instance: unknown) {
  chartInstance.value = instance
}

const runtimeOption = computed(() => materializeRuntimeOption(state.project.option))

function touch() {
  state.project.meta.updatedAt = new Date().toISOString()
}

let seriesSyncTimer: ReturnType<typeof setTimeout> | null = null
const MAX_GROUPED_SERIES = 120

function scheduleSeriesSync() {
  if (seriesSyncTimer) clearTimeout(seriesSyncTimer)
  seriesSyncTimer = setTimeout(() => {
    seriesSyncTimer = null
    syncSeriesNameFields()
  }, 150)
}

function isAxisEmpty(key: 'xAxis' | 'yAxis'): boolean {
  const axes = getOptionValue(state.project.option, key)
  return Array.isArray(axes) && axes.length === 0
}

function syncAxesWithSeries() {
  const xEmpty = isAxisEmpty('xAxis')
  const yEmpty = isAxisEmpty('yAxis')
  if (xEmpty) state.project.meta.xFields = []
  if (!xEmpty && !yEmpty) return

  const series = getOptionValue(state.project.option, 'series')
  if (!Array.isArray(series)) return
  const next = keepNonCartesianSeries(series as SerializableNode[])
  if (next.length !== series.length) setOptionValue(state.project.option, 'series', next)
}

function setOptionValueAt(path: string, value: SerializableNode) {
  try {
    setOptionValue(state.project.option, path, value)
    state.ui.selectedPath = path
    touch()
    if (path === 'xAxis' || path === 'yAxis') syncAxesWithSeries()
  } catch (error) {
    state.ui.errorMessage = logError('workspace', error)
  }
}

function setGridVisibility(value: boolean) {
  setOptionValue(state.project.option, 'grid.show', value)
  state.ui.selectedPath = 'grid.show'
  touch()
}

function setSplitLineVisibility(value: boolean) {
  for (const key of ['xAxis', 'yAxis']) {
    const axes = getOptionValue(state.project.option, key)
    if (Array.isArray(axes)) {
      axes.forEach((_, index) => setOptionValue(state.project.option, `${key}[${index}].splitLine.show`, value))
    } else if (axes && typeof axes === 'object') {
      setOptionValue(state.project.option, `${key}.splitLine.show`, value)
    }
  }
  state.ui.selectedPath = 'xAxis[0].splitLine.show'
  touch()
}

function axisCount(key: 'xAxis' | 'yAxis'): number {
  const axes = getOptionValue(state.project.option, key)
  if (Array.isArray(axes)) return axes.length
  return axes && typeof axes === 'object' ? 1 : 0
}

function xAxisCount(): number {
  return axisCount('xAxis')
}

function currentXFields(): number[] {
  const stored = state.project.meta.xFields ?? []
  return Array.from({ length: xAxisCount() }, (_, index) => {
    const value = stored[index]
    return Number.isInteger(value) && value! >= 0 ? value! : 0
  })
}

type SeriesStackMode = 'none' | 'stack' | 'percent' | 'samesign' | 'all'

function normalizeSeriesGroup(item: Partial<SeriesGroupConfig>, index: number): SeriesGroupConfig {
  const mode = item.stackMode
  const aggregate = item.aggregate
  return {
    id: typeof item.id === 'string' && item.id ? item.id : `group-${index}`,
    nameFields: Array.isArray(item.nameFields)
      ? item.nameFields.filter((field): field is number => Number.isInteger(field) && field >= 0).slice(0, 1)
      : [],
    nameSeparator: typeof item.nameSeparator === 'string' ? item.nameSeparator : ' ',
    valueField: Number.isInteger(item.valueField) && item.valueField! >= 0 ? item.valueField! : -1,
    groupValues: Array.isArray(item.groupValues)
      ? item.groupValues.filter((value): value is string => typeof value === 'string')
      : [],
    stackMode: mode === 'none' || mode === 'stack' || mode === 'percent' || mode === 'samesign' || mode === 'all'
      ? mode
      : 'none',
    groupLimit: Number.isInteger(item.groupLimit) && item.groupLimit! >= 1 ? Math.min(200, item.groupLimit!) : 24,
    categoryLimit: Number.isInteger(item.categoryLimit) && item.categoryLimit! >= 1 ? Math.min(500, item.categoryLimit!) : 100,
    aggregate: aggregate === 'avg' || aggregate === 'first' ? aggregate : 'sum',
    defaults: item.defaults && typeof item.defaults === 'object' && !Array.isArray(item.defaults) ? item.defaults : {},
  }
}

function currentSeriesGroups(): SeriesGroupConfig[] {
  const stored = state.project.meta.seriesGroups
  if (Array.isArray(stored) && stored.length) return stored.map((item, index) => normalizeSeriesGroup(item, index))
  const meta = state.project.meta
  return [normalizeSeriesGroup({
    id: 'group-0',
    nameFields: meta.seriesNameFields ?? [],
    nameSeparator: meta.seriesNameSeparator ?? ' ',
    valueField: meta.seriesValueField ?? -1,
    groupValues: meta.seriesGroupValues ?? [],
    stackMode: meta.seriesStackMode ?? (meta.seriesStack === true ? 'stack' : 'none'),
    groupLimit: meta.seriesGroupLimit ?? 24,
    categoryLimit: meta.seriesCategoryLimit ?? 100,
    aggregate: meta.seriesAggregate ?? 'sum',
    defaults: meta.seriesGroupDefaults ?? {},
  }, 0)]
}

function currentGroup(groupIndex: number): SeriesGroupConfig {
  return currentSeriesGroups()[groupIndex] ?? normalizeSeriesGroup({}, groupIndex)
}

function updateSeriesGroup(groupIndex: number, patch: Partial<SeriesGroupConfig>) {
  const groups = currentSeriesGroups().map((group) => ({ ...group }))
  if (!groups[groupIndex]) return
  groups[groupIndex] = normalizeSeriesGroup({ ...groups[groupIndex], ...patch }, groupIndex)
  state.project.meta.seriesGroups = groups
  scheduleSeriesSync()
  touch()
}

function currentSeriesNameFields(groupIndex = 0): number[] {
  return currentGroup(groupIndex).nameFields
}

function currentSeriesNameSeparator(groupIndex = 0): string {
  return currentGroup(groupIndex).nameSeparator
}

function currentSeriesValueField(groupIndex = 0): number {
  const field = currentGroup(groupIndex).valueField
  if (field >= 0) return field
  const series = getOptionValue(state.project.option, 'series')
  if (Array.isArray(series)) {
    for (const item of series) {
      if (!isRecord(item) || isGroupedSeries(item)) continue
      const dimension = seriesYDimension(item)
      if (dimension >= 0) return dimension
    }
  }
  const numeric = state.table?.inferredTypes
    .map((type, index) => ({ type, index }))
    .filter((item) => item.type === 'number' && item.index !== (currentXFields()[0] ?? 0)) ?? []
  return numeric[0]?.index ?? -1
}

function currentSeriesStackMode(groupIndex = 0): SeriesStackMode {
  return currentGroup(groupIndex).stackMode
}

function seriesStackEnabled(groupIndex = 0): boolean {
  return currentSeriesStackMode(groupIndex) !== 'none'
}

function currentSeriesGroupLimit(groupIndex = 0): number {
  return currentGroup(groupIndex).groupLimit
}

function currentSeriesCategoryLimit(groupIndex = 0): number {
  return currentGroup(groupIndex).categoryLimit
}

function currentSeriesAggregate(groupIndex = 0): 'sum' | 'avg' | 'first' {
  return currentGroup(groupIndex).aggregate
}

function currentSeriesGroupValueOptions(groupIndex = 0): string[] {
  const fields = currentSeriesNameFields(groupIndex)
  if (!state.table || !fields.length) return []
  const separator = currentSeriesNameSeparator(groupIndex)
  const seen = new Set<string>()
  const values: string[] = []
  state.table.rows.forEach((row) => {
    const name = joinFields(row, fields, separator)
    if (name && !seen.has(name)) {
      seen.add(name)
      values.push(name)
    }
  })
  return values
}

function currentSeriesGroupValues(groupIndex = 0): string[] {
  const options = currentSeriesGroupValueOptions(groupIndex)
  const stored = currentGroup(groupIndex).groupValues
  const selected = stored.filter((value) => options.includes(value))
  return selected.length ? selected : options.slice(0, 4)
}

function currentSeriesGroupDefaults(groupIndex = 0): Record<string, SerializableNode> {
  return currentGroup(groupIndex).defaults
}

function isGroupedSeries(item: Record<string, unknown>): boolean {
  return typeof item.id === 'string' && item.id.startsWith('workspace-series-group-')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function yAxisList(): SerializableNode[] {
  const axes = getOptionValue(state.project.option, 'yAxis')
  if (Array.isArray(axes)) return axes as SerializableNode[]
  return isRecord(axes) ? [axes as SerializableNode] : []
}

function normalizedIndex(value: unknown): number {
  const raw = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(raw) && raw >= 0 ? raw : 0
}

function seriesYAxisIndex(item: Record<string, unknown>): number {
  return normalizedIndex(item.yAxisIndex)
}

function datasetSource(): { index: number; source: Array<Array<SerializableNode>> } | null {
  const datasets = getOptionValue(state.project.option, 'dataset')
  if (!Array.isArray(datasets)) return null
  const index = datasets.findIndex((item) => isRecord(item) && item.id === 'workspace-dataset')
  const node = index >= 0 ? datasets[index] : datasets[0]
  if (!isRecord(node) || !Array.isArray(node.source)) return null
  return { index: index >= 0 ? index : 0, source: node.source as Array<Array<SerializableNode>> }
}

function originalDimension(dimension: number): number {
  const data = datasetSource()
  const name = data?.source[0]?.[dimension]
  if (typeof name === 'string') {
    const match = name.match(/^__workspace_xfield_\d+_(\d+)$/)
    if (match) return Number(match[1])
  }
  return dimension
}

function seriesYDimension(item: Record<string, unknown>): number {
  if (isGroupedSeries(item)) return -1
  const encode = item.encode
  if (!isRecord(encode)) return -1
  const raw = encode.y ?? encode.value
  const first = Array.isArray(raw) ? raw[0] : raw
  if (typeof first === 'number') return originalDimension(first)
  if (typeof first === 'string') {
    const byName = state.table?.columns.indexOf(first) ?? -1
    if (byName >= 0) return byName
    return /^\d+$/.test(first) ? originalDimension(Number(first)) : -1
  }
  return -1
}

function ensureXFieldValueDimension(axisIndex: number, fieldIndex: number): number {
  const data = datasetSource()
  if (!data) return fieldIndex
  const rawSource = (toRaw(data.source) as Array<Array<SerializableNode>>)
  const header = rawSource[0]
  if (!Array.isArray(header)) return fieldIndex

  const name = `__workspace_xfield_${axisIndex}_${fieldIndex}`
  const existing = header.indexOf(name)
  if (existing >= 0) return existing

  const dimension = header.length
  const source: Array<Array<SerializableNode>> = rawSource.map((row, index) => {
    const values = Array.isArray(row) ? row : [row as SerializableNode]
    return index === 0 ? [...values, name] : [...values, values[fieldIndex] ?? null]
  })
  setOptionValue(state.project.option, `dataset[${data.index}].source`, source)
  return dimension
}

const GROUPED_DATASET_PREFIX = 'workspace-series-dataset'
const GROUPED_STACK = 'workspace-group'

function groupedDatasetId(groupIndex: number): string {
  return `${GROUPED_DATASET_PREFIX}-${groupIndex}`
}

function joinFields(row: Array<string | number | boolean | null>, fields: number[], separator: string): string {
  return fields
    .map((index) => {
      const value = row[index]
      return value === null || value === undefined ? '' : String(value)
    })
    .filter((value) => value !== '')
    .join(separator)
}

function hasGroupedSeries(): boolean {
  const datasets = getOptionValue(state.project.option, 'dataset')
  if (Array.isArray(datasets) && datasets.some((item) => isRecord(item) && typeof item.id === 'string' && item.id.startsWith(GROUPED_DATASET_PREFIX))) return true
  const series = getOptionValue(state.project.option, 'series')
  return Array.isArray(series) && series.some((item) => isRecord(item) && isGroupedSeries(item))
}

function removeGeneratedSeries() {
  const datasets = getOptionValue(state.project.option, 'dataset')
  if (Array.isArray(datasets)) {
    setOptionValue(
      state.project.option,
      'dataset',
      datasets.filter((item) => !(isRecord(item) && typeof item.id === 'string' && item.id.startsWith(GROUPED_DATASET_PREFIX))),
    )
  }
  const series = getOptionValue(state.project.option, 'series')
  if (Array.isArray(series)) {
    setOptionValue(
      state.project.option,
      'series',
      series.filter((item) => !(isRecord(item) && typeof item.id === 'string' && item.id.startsWith('workspace-series'))),
    )
  }
}

function rebuildAutoSeries(valueField?: number) {
  if (!state.table) return
  state.project.option = normalizeOption(applyTableToOption(state.table, state.project.option, currentXFields(), valueField))
  syncXFieldYAxes()
}

function buildGroupedDataset(groupIndex: number): { source: Array<Array<SerializableNode>>; groups: string[] } | null {
  const table = state.table
  if (!table) return null
  const xField = currentXFields()[0] ?? 0
  const nameFields = currentSeriesNameFields(groupIndex)
  const valueField = currentSeriesValueField(groupIndex)
  if (!nameFields.length || valueField < 0) return null

  const groupLimit = currentSeriesGroupLimit(groupIndex)
  const categoryLimit = currentSeriesCategoryLimit(groupIndex)
  const aggregate = currentSeriesAggregate(groupIndex)
  const selectedValues = new Set(currentSeriesGroupValues(groupIndex))
  const categories: string[] = []
  const categoryIndex = new Map<string, number>()
  const groups: string[] = []
  const valuesByGroup = new Map<string, Array<number | null>>()
  const countsByGroup = new Map<string, number[]>()

  for (const row of table.rows) {
    const name = joinFields(row, nameFields, currentSeriesNameSeparator(groupIndex))
    if (!name || !selectedValues.has(name)) continue
    const category = String(row[xField] ?? '')
    if (!category) continue
    let position = categoryIndex.get(category)
    if (position === undefined) {
      if (categories.length >= categoryLimit) continue
      position = categories.length
      categoryIndex.set(category, position)
      categories.push(category)
    }
    if (!valuesByGroup.has(name)) {
      if (groups.length >= groupLimit) continue
      groups.push(name)
      valuesByGroup.set(name, [])
      countsByGroup.set(name, [])
    }
    const values = valuesByGroup.get(name)!
    const counts = countsByGroup.get(name)!
    const raw = row[valueField]
    const numeric = raw === null || raw === undefined || raw === '' ? null : Number(raw)
    if (typeof numeric !== 'number' || !Number.isFinite(numeric)) continue
    while (values.length <= position) {
      values.push(null)
      counts.push(0)
    }
    values[position] = aggregate === 'first' ? (values[position] ?? numeric) : (values[position] ?? 0) + numeric
    counts[position] = (counts[position] ?? 0) + 1
  }

  const source: Array<Array<SerializableNode>> = [
    [table.columns[xField] ?? translate('runtime.categoryFallback'), ...groups],
  ]
  categories.forEach((category, position) => {
    source.push([category, ...groups.map((name) => {
      const sum = valuesByGroup.get(name)?.[position] ?? null
      const count = countsByGroup.get(name)?.[position] ?? 0
      return sum === null ? null : (aggregate === 'avg' && count > 0 ? sum / count : sum)
    })])
  })

  if (currentSeriesStackMode(groupIndex) === 'percent') {
    for (let row = 1; row < source.length; row += 1) {
      const total = source[row].slice(1).reduce<number>((sum, value) => sum + (typeof value === 'number' ? value : 0), 0)
      if (!total) continue
      for (let column = 1; column < source[row].length; column += 1) {
        const value = source[row][column]
        if (typeof value === 'number') source[row][column] = Number(((value / total) * 100).toFixed(2))
      }
    }
  }
  return { source, groups }
}

function syncSeriesNameFields() {
  const groups = currentSeriesGroups()
  const hasActive = groups.some((group, index) => (
    group.nameFields.length > 0 && currentSeriesValueField(index) >= 0
  ))
  if (!state.table) return
  if (!hasActive) {
    const valueField = currentSeriesValueField(0)
    if (hasGroupedSeries() || valueField >= 0) {
      removeGeneratedSeries()
      rebuildAutoSeries(valueField >= 0 ? valueField : undefined)
    }
    return
  }

  removeGeneratedSeries()
  const datasets = getOptionValue(state.project.option, 'dataset')
  const datasetList = Array.isArray(datasets) ? [...datasets] : []
  const series = getOptionValue(state.project.option, 'series')
  const seriesList = Array.isArray(series) ? [...series] : []
  let generatedCount = 0

  groups.forEach((group, groupIndex) => {
    const built = buildGroupedDataset(groupIndex)
    if (!built) return
    if (generatedCount + built.groups.length > MAX_GROUPED_SERIES) return
    generatedCount += built.groups.length
    const datasetIndex = datasetList.length
    datasetList.push({ id: groupedDatasetId(groupIndex), source: built.source })

    const valueFieldName = state.table?.columns[currentSeriesValueField(groupIndex)] ?? ''
    const stackMode = currentSeriesStackMode(groupIndex)
    built.groups.forEach((name, index) => {
      const item: Record<string, SerializableNode> = {
        id: `workspace-series-group-${groupIndex}-${index}`,
        name: valueFieldName ? `${name} · ${valueFieldName}` : name,
        type: 'bar',
        xAxisIndex: 0,
        datasetIndex,
        encode: { x: 0, y: [index + 1] },
      }
      Object.assign(item, currentSeriesGroupDefaults(groupIndex))
      // 堆叠由分组配置统一管理，必须在 defaults 之后写入，避免旧默认值残留导致切换不生效
      if (stackMode === 'none') {
        delete item.stack
        delete item.stackStrategy
      } else {
        item.stack = `${GROUPED_STACK}-${groupIndex}`
        if (stackMode === 'samesign' || stackMode === 'all') item.stackStrategy = stackMode
        else delete item.stackStrategy
      }
      seriesList.push(item)
    })
  })

  setOptionValue(state.project.option, 'dataset', datasetList)
  setOptionValue(state.project.option, 'series', seriesList)
}

function cleanupAutoYAxes() {
  const option = state.project.option
  let axes = yAxisList()
  const autoIndexes = axes
    .map((item, index) => (
      isRecord(item) && typeof item.id === 'string' && item.id.startsWith('workspace-xfield-y-') ? index : -1
    ))
    .filter((index) => index >= 0)
  if (!autoIndexes.length) return

  const series = getOptionValue(option, 'series')
  if (Array.isArray(series)) {
    series.forEach((item, position) => {
      if (!isRecord(item)) return
      if (autoIndexes.includes(seriesYAxisIndex(item))) {
        setOptionValue(option, `series[${position}].yAxisIndex`, 0)
      }
    })
  }
  for (let index = axes.length - 1; index >= 0; index -= 1) {
    if (!autoIndexes.includes(index)) continue
    const next = axes.filter((_, itemIndex) => itemIndex !== index)
    setOptionValue(option, 'yAxis', next)
    axes = next
  }
}

function syncXFieldYAxes() {
  cleanupAutoYAxes()
  const option = state.project.option
  const fields = currentXFields()
  const series = getOptionValue(option, 'series')
  const list = Array.isArray(series) ? series : []

  fields.forEach((field, axisIndex) => {
    list.forEach((item, position) => {
      if (!isRecord(item) || isGroupedSeries(item)) return
      if (normalizedIndex(item.xAxisIndex) !== axisIndex) return
      if (seriesYDimension(item) !== field) return
      const valueDimension = ensureXFieldValueDimension(axisIndex, field)
      setOptionValue(option, `series[${position}].encode.y`, [valueDimension])
    })
  })

}

function setXFieldAt(axisIndex: number, fieldIndex: number) {
  const fields = currentXFields()
  fields[axisIndex] = fieldIndex
  state.project.meta.xFields = fields
  const series = getOptionValue(state.project.option, 'series')
  if (Array.isArray(series)) {
    series.forEach((item, position) => {
      if (!isRecord(item) || isGroupedSeries(item)) return
      if (normalizedIndex(item.xAxisIndex) === axisIndex) {
        setOptionValue(state.project.option, `series[${position}].encode.x`, fieldIndex)
      }
    })
  }
  syncXFieldYAxes()
  touch()
}

function setSeriesNameFields(groupIndex: number, fields: number[]) {
  updateSeriesGroup(groupIndex, { nameFields: fields, groupValues: [] })
}

function setSeriesNameSeparator(groupIndex: number, separator: string) {
  updateSeriesGroup(groupIndex, { nameSeparator: separator, groupValues: [] })
}

function setSeriesValueField(groupIndex: number, field: number) {
  updateSeriesGroup(groupIndex, { valueField: field })
}

function setSeriesStack(enabled: boolean) {
  setSeriesStackMode(0, enabled ? 'stack' : 'none')
}

function setSeriesStackMode(groupIndex: number, mode: SeriesStackMode) {
  updateSeriesGroup(groupIndex, { stackMode: mode })
}

function setSeriesGroupLimit(groupIndex: number, limit: number) {
  updateSeriesGroup(groupIndex, { groupLimit: Math.min(200, Math.max(1, Math.floor(Number(limit) || 24))) })
}

function setSeriesCategoryLimit(groupIndex: number, limit: number) {
  updateSeriesGroup(groupIndex, { categoryLimit: Math.min(500, Math.max(1, Math.floor(Number(limit) || 100))) })
}

function setSeriesAggregate(groupIndex: number, aggregate: 'sum' | 'avg' | 'first') {
  updateSeriesGroup(groupIndex, { aggregate })
}

function setSeriesGroupValues(groupIndex: number, values: string[]) {
  updateSeriesGroup(groupIndex, { groupValues: values })
}

function setSeriesGroupDefaults(groupIndex: number, defaults: Record<string, SerializableNode>) {
  updateSeriesGroup(groupIndex, { defaults: { ...currentSeriesGroupDefaults(groupIndex), ...defaults } })
}

function addSeriesGroup() {
  const groups = currentSeriesGroups().map((group) => ({ ...group }))
  const index = groups.length
  groups.push(normalizeSeriesGroup({ id: `group-${index}` }, index))
  state.project.meta.seriesGroups = groups
  scheduleSeriesSync()
  touch()
}

function removeSeriesGroup(groupIndex: number) {
  const groups = currentSeriesGroups().map((group) => ({ ...group }))
  if (groups.length <= 1) return
  groups.splice(groupIndex, 1)
  state.project.meta.seriesGroups = groups
  scheduleSeriesSync()
  touch()
}

function applySeriesBulk(groupIndex: number, patches: Array<{ path: string; value: SerializableNode }>) {
  if (!patches.length) return
  const list = getOptionValue(state.project.option, 'series')
  if (!Array.isArray(list)) return
  const prefix = `workspace-series-group-${groupIndex}-`

  const next = list.map((item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || !item.id.startsWith(prefix)) return item
    const copy = JSON.parse(JSON.stringify(item)) as Record<string, SerializableNode>
    patches.forEach((patch) => setOptionValue(copy, patch.path, patch.value))
    return copy
  })
  setOptionValueAt('series', next)

  const groups = currentSeriesGroups().map((group) => ({ ...group }))
  if (!groups[groupIndex]) return
  const defaults = { ...groups[groupIndex].defaults }
  patches.forEach((patch) => {
    defaults[patch.path] = patch.value
  })
  groups[groupIndex] = normalizeSeriesGroup({ ...groups[groupIndex], defaults }, groupIndex)
  state.project.meta.seriesGroups = groups
  scheduleSeriesSync()
  touch()
}

const CHART_THEME_PRESETS = {
  light: {
    background: '#FFFFFF',
    text: '#111827',
    title: '#1F2937',
    muted: '#6B7280',
    split: '#E5E7EB',
  },
  dark: {
    background: '#0F172A',
    text: '#E2E8F0',
    title: '#F8FAFC',
    muted: '#94A3B8',
    split: '#334155',
  },
} as const

function currentChartTheme(): 'light' | 'dark' {
  return state.project.option.backgroundColor === CHART_THEME_PRESETS.dark.background ? 'dark' : 'light'
}

function setChartTheme(mode: 'light' | 'dark') {
  const palette = CHART_THEME_PRESETS[mode]
  const option = state.project.option
  setOptionValue(option, 'backgroundColor', palette.background)
  setOptionValue(option, 'textStyle.color', palette.text)
  setOptionValue(option, 'title.textStyle.color', palette.title)
  setOptionValue(option, 'legend.textStyle.color', palette.muted)
  for (const key of ['xAxis', 'yAxis']) {
    const axes = getOptionValue(option, key)
    if (Array.isArray(axes)) {
      axes.forEach((_, index) => {
        setOptionValue(option, `${key}[${index}].axisLabel.color`, palette.muted)
        setOptionValue(option, `${key}[${index}].splitLine.lineStyle.color`, palette.split)
      })
    } else if (axes && typeof axes === 'object') {
      setOptionValue(option, `${key}.axisLabel.color`, palette.muted)
      setOptionValue(option, `${key}.splitLine.lineStyle.color`, palette.split)
    }
  }
  touch()
}

function removeOptionValueAt(path: string) {
  try {
    unsetOptionValue(state.project.option, path)
    touch()
  } catch (error) {
    state.ui.errorMessage = logError('workspace', error)
  }
}

function replaceOption(option: SerializableEchartsOption) {
  state.project.option = normalizeOption(option)
  syncAxesWithSeries()
  syncXFieldYAxes()
  scheduleSeriesSync()
  touch()
}

function applyTable(table: TableData) {
  state.table = table
  state.project.meta.name = table.name.replace(/\.[^.]+$/, '')
  const xFields = Array.from({ length: xAxisCount() }, (_, index) => state.project.meta.xFields?.[index] ?? 0)
  state.project.meta.xFields = xFields
  state.project.option = normalizeOption(applyTableToOption(table, state.project.option, xFields))
  syncXFieldYAxes()
  scheduleSeriesSync()
  touch()
}

function setProject(project: ChartProjectFile) {
  state.project = { ...project, option: normalizeOption(project.option) }
  state.table = project.table ?? null
  state.ui.jsonDraft = ''
  state.ui.jsonError = ''
  syncXFieldYAxes()
  scheduleSeriesSync()
}

function resetProject() {
  state.project = createDefaultProject()
  state.table = null
  state.ui.jsonDraft = ''
  state.ui.jsonError = ''
}

function setLocale(locale: Locale) {
  state.ui.locale = locale
  setI18nLocale(locale)
  persistLocale(locale)
  notifyElectronLocale(locale)
}

function toggleTheme() {
  const next = state.ui.theme === 'light' ? 'dark' : 'light'
  state.ui.theme = next
  try {
    localStorage.setItem('echarts-studio-theme', next)
  } catch {
    // Ignore storage failures; the in-memory theme still applies.
  }
  setChartTheme(next)
}

export function useWorkspaceStore() {
  return {
    state,
    runtimeOption,
    chartInstance,
    setChartInstance,
    setOptionValueAt,
    setGridVisibility,
    setSplitLineVisibility,
    currentChartTheme,
    setChartTheme,
    currentXFields,
    currentSeriesStackMode,
    currentSeriesGroups,
    addSeriesGroup,
    removeSeriesGroup,
    currentSeriesNameFields,
    currentSeriesNameSeparator,
    currentSeriesValueField,
    currentSeriesGroupLimit,
    currentSeriesCategoryLimit,
    currentSeriesAggregate,
    currentSeriesGroupValueOptions,
    currentSeriesGroupValues,
    seriesStackEnabled,
    setXFieldAt,
    setSeriesStackMode,
    setSeriesNameFields,
    setSeriesNameSeparator,
    setSeriesValueField,
    setSeriesStack,
    setSeriesGroupLimit,
    setSeriesCategoryLimit,
    setSeriesAggregate,
    setSeriesGroupValues,
    setSeriesGroupDefaults,
    applySeriesBulk,
    syncXFieldYAxes,
    syncSeriesNameFields,
    removeOptionValueAt,
    replaceOption,
    applyTable,
    setProject,
    resetProject,
    toggleTheme,
    setLocale,
    touch,
  }
}
