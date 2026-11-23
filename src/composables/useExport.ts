import { reactive } from 'vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { downloadBlob, readProjectFile, serializeProject } from '@/utils/configFile'
import { exportChart, type ChartLike, type ExportSize } from '@/utils/chartExport'
import { logError } from '@/utils/logger'

export const exportSizePresets = [
  { value: 'auto', label: '', labelKey: 'chart.exportSizeFollow', width: null, height: null },
  { value: '1080p', label: '1920 × 1080', width: 1920, height: 1080 },
  { value: '1440p', label: '2560 × 1440', width: 2560, height: 1440 },
  { value: '4k', label: '3840 × 2160', width: 3840, height: 2160 },
  { value: 'custom', label: '', labelKey: 'chart.exportSizeCustom', width: null, height: null },
] as const

export const exportSize = reactive<ExportSize>({ preset: 'auto', width: null, height: null })

export function applyExportPreset(value: string) {
  exportSize.preset = value
  const preset = exportSizePresets.find((item) => item.value === value)
  if (preset && value !== 'custom') {
    exportSize.width = preset.width
    exportSize.height = preset.height
  } else if (value === 'custom' && (!exportSize.width || !exportSize.height)) {
    exportSize.width = 1920
    exportSize.height = 1080
  }
}

export function useExport() {
  const { state, runtimeOption, chartInstance, setProject } = useWorkspaceStore()
  const chart = () => chartInstance.value as ChartLike | null
  const projectName = () => state.project.meta.name || 'chart'

  function exportImage(kind: 'png' | 'svg' | 'pdf') {
    const message = exportChart(kind, chart(), runtimeOption.value, projectName(), exportSize)
    if (message) state.ui.errorMessage = message
    else state.ui.errorMessage = ''
  }

  function exportConfig(mode: 'full' | 'option') {
    const project = {
      ...state.project,
      table: mode === 'full' ? (state.table ?? undefined) : undefined,
    }
    const suffix = mode === 'full' ? 'project' : 'option'
    downloadBlob(serializeProject(project), `${projectName()}-${suffix}.json`, 'application/json')
    state.ui.errorMessage = ''
  }

  async function importConfig(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return
    try {
      const project = await readProjectFile(input.files[0])
      setProject(project)
      state.ui.errorMessage = ''
    } catch (error) {
      state.ui.errorMessage = logError('configImport', error)
    } finally {
      input.value = ''
    }
  }

  return { exportImage, exportConfig, importConfig }
}
