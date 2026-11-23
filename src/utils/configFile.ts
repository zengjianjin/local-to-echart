import type { ChartProjectFile } from '@/types'
import { translate } from '@/i18n/translate'
import { createInitialOption } from './dataset'
import { validateProjectFile } from './optionValidator'

export function createDefaultProject(): ChartProjectFile {
  return {
    formatVersion: 1,
    meta: { name: translate('runtime.unnamedChart'), updatedAt: new Date().toISOString() },
    option: createInitialOption(),
  }
}

export function serializeProject(project: ChartProjectFile): string {
  return JSON.stringify(project, null, 2)
}

export async function readProjectFile(file: File): Promise<ChartProjectFile> {
  const value = JSON.parse(await file.text()) as unknown
  const result = validateProjectFile(value)
  if (!result.ok) throw new Error(result.message)
  return result.project
}

export function downloadBlob(content: BlobPart, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
