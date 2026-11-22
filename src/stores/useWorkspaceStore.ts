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

function setOptionValueAt(path: string, value: SerializableNode) {
  try {
    setOptionValue(state.project.option, path, value)
    state.ui.selectedPath = path
    touch()
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
  touch()
}

function applyTable(table: TableData) {
  state.table = table
  state.project.meta.name = table.name.replace(/\.[^.]+$/, '')
  state.project.option = normalizeOption(applyTableToOption(table, state.project.option))
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
  state.ui.theme = state.ui.theme === 'light' ? 'dark' : 'light'
  try {
    localStorage.setItem('echarts-studio-theme', state.ui.theme)
  } catch {
    return
  }
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
    removeOptionValueAt,
    replaceOption,
    applyTable,
    setProject,
    resetProject,
    toggleTheme,
    touch,
  }
}
