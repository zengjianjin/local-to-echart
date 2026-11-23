import type { InferredFieldType } from '@/types'
import { toNumber } from './numberParse'

export function inferTypeFromValues(values: Array<string | number | boolean | null>): InferredFieldType {
  const present = values.filter((value) => value !== null && value !== '')
  if (!present.length) return 'text'
  if (present.every((value) => typeof value === 'boolean')) return 'boolean'
  if (
    present.every(
      (value) => typeof value === 'number' || toNumber(value) !== null,
    )
  ) {
    return 'number'
  }
  if (present.every((value) => !Number.isNaN(Date.parse(String(value))))) return 'date'
  return 'text'
}
