import { ref, shallowRef } from 'vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { isExcelFile, isSupportedFile, parseTextFile } from '@/utils/fileParse'
import { parseClipboardText } from '@/utils/tableFormats'
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
export const headerRow = ref(1)
export const isDragging = ref(false)
const lastExcelFile = shallowRef<{ fileName: string; buffer: ArrayBuffer } | null>(null)
const lastCsvFile = shallowRef<{ fileName: string; text: string } | null>(null)

const { state, applyTable } = useWorkspaceStore()

function applyExcel(fileName: string, buffer: ArrayBuffer, sheetName?: string) {
  applyTable(parseExcelBuffer(buffer, fileName, sheetName, headerRow.value))
}

export function confirmSheetImport() {
  const pending = pendingWorkbook.value
  if (!pending) return
  state.ui.isImporting = true
  state.ui.errorMessage = ''
  try {
    applyExcel(pending.fileName, pending.buffer, selectedSheet.value)
    pendingWorkbook.value = null
  } catch (error) {
    state.ui.errorMessage = logError('fileImport', error)
  } finally {
    state.ui.isImporting = false
  }
}

export function setHeaderRow(value: number) {
  headerRow.value = Math.min(20, Math.max(1, Math.floor(Number(value) || 1)))
  if (pendingWorkbook.value) return
  const excel = lastExcelFile.value
  const csv = lastCsvFile.value
  if (!excel && !csv) return
  state.ui.isImporting = true
  state.ui.errorMessage = ''
  try {
    if (excel) applyExcel(excel.fileName, excel.buffer)
    else if (csv) applyTable(parseTextFile(csv.text, csv.fileName, undefined, headerRow.value))
  } catch (error) {
    state.ui.errorMessage = logError('fileImport', error)
  } finally {
    state.ui.isImporting = false
  }
}

export function cancelSheetImport() {
  pendingWorkbook.value = null
}

export async function importFiles(files: FileList | File[]) {
  const list = Array.from(files)
  const file = list.find(isSupportedFile)
  if (!file) {
    state.ui.errorMessage = '请选择 CSV、TSV、JSON、JSON Lines、Markdown 表格或 Excel 文件'
    return
  }
  state.ui.isImporting = true
  state.ui.errorMessage = ''
  try {
    if (isExcelFile(file)) {
      const buffer = await file.arrayBuffer()
      lastCsvFile.value = null
      lastExcelFile.value = { fileName: file.name, buffer }
      const sheets = getExcelSheetInfo(buffer, headerRow.value)
      if (sheets.length > 1) {
        pendingWorkbook.value = { fileName: file.name, buffer, sheets }
        selectedSheet.value = sheets[0].name
        return
      }
      applyExcel(file.name, buffer)
    } else {
      const text = await file.text()
      lastCsvFile.value = { fileName: file.name, text }
      lastExcelFile.value = null
      applyTable(parseTextFile(text, file.name, undefined, headerRow.value))
    }
  } catch (error) {
    state.ui.errorMessage = logError('fileImport', error)
  } finally {
    state.ui.isImporting = false
  }
}

export function onDrop(event: globalThis.DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files) void importFiles(event.dataTransfer.files)
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) void importFiles(input.files)
  input.value = ''
}

export async function pasteFromClipboard() {
  state.ui.isImporting = true
  state.ui.errorMessage = ''
  try {
    const text = await navigator.clipboard.readText()
    const table = parseClipboardText(text)
    lastCsvFile.value = null
    lastExcelFile.value = null
    applyTable(table)
  } catch (error) {
    state.ui.errorMessage = logError('clipboardImport', error)
  } finally {
    state.ui.isImporting = false
  }
}

function loadDemo() {
  state.ui.errorMessage = ''
  try {
    applyTable(loadDemoTable())
  } catch (error) {
    state.ui.errorMessage = logError('demoImport', error)
  }
}

export function useFileImport() {
  return {
    isDragging,
    onFileChange,
    onDrop,
    pasteFromClipboard,
    loadDemo,
    importFiles,
    confirmSheetImport,
    cancelSheetImport,
    headerRow,
    setHeaderRow,
  }
}
