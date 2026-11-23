import type { SerializableNode } from '@/types'
import { translate } from '@/i18n/translate'

const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export function parseOptionPath(path: string): Array<string | number> {
  if (!path.trim()) return []
  const tokens: Array<string | number> = []
  const pattern = /([^.[\]]+)|\[(\d+)\]/g
  let match: RegExpExecArray | null = pattern.exec(path)
  while (match) {
    if (match[1] !== undefined) {
      if (BLOCKED_KEYS.has(match[1])) throw new Error(translate('runtime.unsafePath', { path }))
      tokens.push(match[1])
    } else if (match[2] !== undefined) {
      tokens.push(Number(match[2]))
    }
    match = pattern.exec(path)
  }
  return tokens
}

export function getOptionValue(root: SerializableNode, path: string): unknown {
  let current: unknown = root
  for (const token of parseOptionPath(path)) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Record<string | number, unknown>)[token]
  }
  return current
}

export function hasOptionValue(root: SerializableNode, path: string): boolean {
  let current: unknown = root
  for (const token of parseOptionPath(path)) {
    if (current === null || typeof current !== 'object' || !(token in (current as object))) return false
    current = (current as Record<string | number, unknown>)[token]
  }
  return true
}

export function setOptionValue(root: SerializableNode, path: string, value: SerializableNode): void {
  const tokens = parseOptionPath(path)
  if (!tokens.length) return
  let current = root as Record<string | number, unknown>
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const token = tokens[index]
    const next = tokens[index + 1]
    if (current[token] === null || typeof current[token] !== 'object') {
      current[token] = typeof next === 'number' ? [] : {}
    }
    current = current[token] as Record<string | number, unknown>
  }
  current[tokens[tokens.length - 1]] = value
}

export function unsetOptionValue(root: SerializableNode, path: string): void {
  const tokens = parseOptionPath(path)
  if (!tokens.length) return
  let current = root as Record<string | number, unknown>
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const next = current[tokens[index]]
    if (next === null || typeof next !== 'object') return
    current = next as Record<string | number, unknown>
  }
  delete current[tokens[tokens.length - 1]]
}

export function cloneOption<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
