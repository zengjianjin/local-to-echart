import { computed, reactive, shallowRef } from 'vue'
import type {
  ChartProjectFile,
  SerializableEchartsOption,
  SerializableNode,
  TableData,
} from '@/types'
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
  const header = data.source[0]
  if (!Array.isArray(header)) return fieldIndex

  const name = `__workspace_xfield_${axisIndex}_${fieldIndex}`
  let dimension = header.findIndex((item) => item === name)
  if (dimension < 0) {
    dimension = header.length
    header.push(name)
    for (let row = 1; row < data.source.length; row += 1) {
      const values = data.source[row]
      if (Array.isArray(values)) values.push(values[fieldIndex] ?? null)
      else data.source[row] = [values]
    }
  } else {
    for (let row = 1; row < data.source.length; row += 1) {
      const values = data.source[row]
      if (Array.isArray(values)) values[dimension] = values[fieldIndex] ?? null
    }
  }
  setOptionValue(state.project.option, `dataset[${data.index}].source`, data.source)
  return dimension
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
      if (!isRecord(item)) return
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
      if (!isRecord(item)) return
      if (normalizedIndex(item.xAxisIndex) === axisIndex) {
        setOptionValue(state.project.option, `series[${position}].encode.x`, fieldIndex)
      }
    })
  }
  syncXFieldYAxes()
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
  touch()
}

function applyTable(table: TableData) {
  state.table = table
  state.project.meta.name = table.name.replace(/\.[^.]+$/, '')
  const xFields = Array.from({ length: xAxisCount() }, (_, index) => state.project.meta.xFields?.[index] ?? 0)
  state.project.meta.xFields = xFields
  state.project.option = normalizeOption(applyTableToOption(table, state.project.option, xFields))
  syncXFieldYAxes()
  touch()
}

function setProject(project: ChartProjectFile) {
  state.project = { ...project, option: normalizeOption(project.option) }
  state.table = project.table ?? null
  state.ui.jsonDraft = ''
  state.ui.jsonError = ''
}

function resetProject() {
  state.project = createDefaultProject()
  state.table = null
  state.ui.jsonDraft = ''
  state.ui.jsonError = ''
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
    setXFieldAt,
    syncXFieldYAxes,
    removeOptionValueAt,
    replaceOption,
    applyTable,
    setProject,
    resetProject,
    toggleTheme,
    touch,
  }
}
