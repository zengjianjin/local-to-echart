import { ref, watch } from 'vue'
import { translate } from '@/i18n/translate'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import type { SerializableNode } from '@/types'
import { logError } from '@/utils/logger'
import { stringifyOption, parseOptionJson } from '@/utils/optionValidator'

const { state, replaceOption, setOptionValueAt, removeOptionValueAt, resetChartOption } = useWorkspaceStore()

const jsonDraft = ref(stringifyOption(state.project.option))
const jsonError = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let applyingDraft = false

function syncDraft() {
  jsonDraft.value = stringifyOption(state.project.option)
}

watch(
  () => state.project.option,
  () => {
    if (applyingDraft) return
    syncDraft()
  },
  { deep: true, flush: 'sync' },
)

watch(
  () => state.ui.editorMode,
  (mode) => {
    if (mode === 'json') {
      syncDraft()
      jsonError.value = ''
    }
  },
)

function applyDraft() {
  const result = parseOptionJson(jsonDraft.value)
  if (!result.ok || !result.option) {
    const message = result.message ?? translate('runtime.jsonInvalid')
    jsonError.value = result.line
      ? translate('runtime.jsonLineError', { line: result.line, message })
      : message
    return
  }
  jsonError.value = ''
  applyingDraft = true
  try {
    replaceOption(result.option)
  } finally {
    applyingDraft = false
  }
}

function onJsonInput(value: string) {
  jsonDraft.value = value
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(applyDraft, 250)
}

function setPath(path: string, value: SerializableNode) {
  setOptionValueAt(path, value)
}

function removePath(path: string) {
  removeOptionValueAt(path)
}

function resetAll() {
  resetChartOption()
  syncDraft()
}

export function useOptionEditor() {
  return {
    jsonDraft,
    jsonError,
    onJsonInput,
    applyDraft,
    syncDraft,
    setPath,
    removePath,
    resetAll,
    logError,
  }
}
