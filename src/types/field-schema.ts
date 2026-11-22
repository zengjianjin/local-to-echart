export type FieldKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'color'
  | 'enum'
  | 'object'
  | 'array'
  | 'template'
  | 'unknown'

export interface EnumOption {
  label: string
  value: string | number | boolean
}

export interface FieldSchema {
  path: string
  label: string
  section: string
  kind: FieldKind
  description?: string
  chartTypes?: string[]
  enumValues?: EnumOption[]
  children?: FieldSchema[]
  itemFields?: FieldSchema[]
  min?: number
  max?: number
  step?: number
  placeholder?: string
  default?: unknown
}

export interface SchemaSection {
  id: string
  label: string
  description: string
  icon?: string
  fields: FieldSchema[]
}
