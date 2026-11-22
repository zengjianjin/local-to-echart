import { ref, watch } from 'vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import type { SerializableNode } from '@/types'
import { logError } from '@/utils/logger'
import { stringifyOption, parseOptionJson } from '@/utils/optionValidator'

const { state, replaceOption, setOptionValueAt, removeOptionValueAt, resetProject } = useWorkspaceStore()

const jsonDraft = ref(stringifyOption(state.project.option))
const jsonError = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function syncDraft() {
  jsonDraft.value = stringifyOption(state.project.option)
}

watch(
  () => state.project.option,
  () => {
    if (state.ui.editorMode !== 'json') syncDraft()
  },
  { deep: true },
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
    jsonError.value = result.line ? `第 ${result.line} 行：${result.message ?? 'JSON 无效'}` : result.message ?? 'JSON 无效'
    return
  }
  jsonError.value = ''
  replaceOption(result.option)
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
  resetProject()
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
