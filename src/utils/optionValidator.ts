import type { ChartProjectFile, SerializableEchartsOption } from '@/types'
import { logError } from './logger'

export interface JsonParseResult {
  ok: boolean
  option?: SerializableEchartsOption
  message?: string
  line?: number
}

function lineFromPosition(text: string, position?: number): number | undefined {
  if (typeof position !== 'number') return undefined
  return text.slice(0, position).split('\n').length
}

export function parseOptionJson(text: string): JsonParseResult {
  try {
    const parsed = JSON.parse(text) as unknown
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, message: '根节点必须是 JSON 对象' }
    }
    return { ok: true, option: parsed as SerializableEchartsOption }
  } catch (error) {
    const message = logError('optionValidator', error)
    const match = message.match(/position\s+(\d+)/i)
    return {
      ok: false,
      message,
      line: lineFromPosition(text, match ? Number(match[1]) : undefined),
    }
  }
}

export function stringifyOption(option: SerializableEchartsOption, pretty = true): string {
  return JSON.stringify(option, null, pretty ? 2 : 0)
}

export function validateProjectFile(value: unknown): { ok: true; project: ChartProjectFile } | { ok: false; message: string } {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, message: '配置文件根节点必须是对象' }
  }
  const candidate = value as Partial<ChartProjectFile>
  if (candidate.formatVersion !== 1) {
    return { ok: false, message: '这不是当前版本的项目配置，旧格式不会被导入' }
  }
  if (!candidate.meta || typeof candidate.meta.name !== 'string') {
    return { ok: false, message: '配置缺少 meta.name' }
  }
  if (!candidate.option || typeof candidate.option !== 'object' || Array.isArray(candidate.option)) {
    return { ok: false, message: '配置缺少合法的 option 对象' }
  }
  return { ok: true, project: candidate as ChartProjectFile }
}
