import { ref, shallowRef } from 'vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { isExcelFile, parseDataFile } from '@/utils/fileParse'
import { getExcelSheetInfo, parseExcelBuffer } from '@/utils/excel'
import { loadDemoTable } from '@/utils/demoData'
import { logError } from '@/utils/logger'

export interface PendingWorkbook {
  fileName: string
  buffer: ArrayBuffer
  sheets: Array<{ name: string; rowCount: number }>
}

export const pendingWorkbook = shallowRef<PendingWorkbook | null>(null)
export const selectedSheet = ref('')

const { state, applyTable } = useWorkspaceStore()

export function confirmSheetImport() {
  const pending = pendingWorkbook.value
  if (!pending) return
  state.ui.isImporting = true
  state.ui.errorMessage = ''
  try {
    applyTable(parseExcelBuffer(pending.buffer, pending.fileName, selectedSheet.value))
    pendingWorkbook.value = null
  } catch (error) {
    state.ui.errorMessage = logError('fileImport', error)
  } finally {
    state.ui.isImporting = false
  }
}

export function cancelSheetImport() {
  pendingWorkbook.value = null
}

export function useFileImport() {
  const isDragging = ref(false)

  async function importFiles(files: FileList | File[]) {
    const list = Array.from(files)
    const file = list.find((item) => /\.(csv|tsv|txt|xlsx|xlsm|xls)$/i.test(item.name))
    if (!file) {
      state.ui.errorMessage = '请选择 CSV、TSV 或 Excel 文件'
      return
    }
    state.ui.isImporting = true
    state.ui.errorMessage = ''
    try {
      if (isExcelFile(file)) {
        const buffer = await file.arrayBuffer()
        const sheets = getExcelSheetInfo(buffer)
        if (sheets.length > 1) {
          pendingWorkbook.value = { fileName: file.name, buffer, sheets }
          selectedSheet.value = sheets[0].name
          return
        }
        applyTable(parseExcelBuffer(buffer, file.name))
      } else {
        applyTable(await parseDataFile(file))
      }
    } catch (error) {
      state.ui.errorMessage = logError('fileImport', error)
    } finally {
      state.ui.isImporting = false
    }
  }

  function onFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files) void importFiles(input.files)
    input.value = ''
  }

  function onDrop(event: DragEvent) {
    isDragging.value = false
    if (event.dataTransfer?.files) void importFiles(event.dataTransfer.files)
  }

  function loadDemo() {
    state.ui.errorMessage = ''
    try {
      applyTable(loadDemoTable())
    } catch (error) {
      state.ui.errorMessage = logError('demoImport', error)
    }
  }

  return {
    isDragging,
    onFileChange,
    onDrop,
    loadDemo,
    importFiles,
    confirmSheetImport,
    cancelSheetImport,
  }
}
