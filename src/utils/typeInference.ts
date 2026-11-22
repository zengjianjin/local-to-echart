import type { InferredFieldType } from '@/types'

export function inferTypeFromValues(values: Array<string | number | boolean | null>): InferredFieldType {
  const present = values.filter((value) => value !== null && value !== '')
  if (!present.length) return 'text'
  if (present.every((value) => typeof value === 'boolean')) return 'boolean'
  if (
    present.every(
      (value) => typeof value === 'number' || /^-?\d+(?:\.\d+)?$/.test(String(value).trim()),
    )
  ) {
    return 'number'
  }
  if (present.every((value) => !Number.isNaN(Date.parse(String(value))))) return 'date'
  return 'text'
}
