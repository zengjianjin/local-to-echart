import type { FieldSchema, SchemaSection } from '@/types'
import { globalSections } from './global'
import { componentSections } from './components'
import { axesSections } from './axes'
import { seriesSection } from './series'
import { advancedSections } from './advanced'

const unknownSection: SchemaSection = {
  id: 'unknown',
  label: '未知字段',
  description: 'schema 未覆盖但已保存在配置中的字段',
  fields: [],
}

export const allSections: SchemaSection[] = [
  ...globalSections,
  ...componentSections,
  ...axesSections,
  seriesSection,
  ...advancedSections,
  unknownSection,
]

export function getSection(id: string): SchemaSection | undefined {
  return allSections.find((section) => section.id === id)
}

function matches(field: FieldSchema, query: string): boolean {
  const haystack = [field.label, field.path, field.description ?? ''].join(' ').toLowerCase()
  return haystack.includes(query)
}

function filterField(field: FieldSchema, query: string): FieldSchema | null {
  if (matches(field, query)) return field
  const children = field.children?.map((child) => filterField(child, query)).filter(Boolean) as FieldSchema[] | undefined
  const itemFields = field.itemFields?.map((item) => filterField(item, query)).filter(Boolean) as FieldSchema[] | undefined
  if (children?.length || itemFields?.length) {
    return { ...field, children: children?.length ? children : undefined, itemFields: itemFields?.length ? itemFields : undefined }
  }
  return null
}

export function filterSections(query: string): SchemaSection[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return allSections
  return allSections
    .map((section) => {
      if ([section.label, section.description, section.id].join(' ').toLowerCase().includes(normalized)) {
        return section
      }
      const fields = section.fields
        .map((field) => filterField(field, normalized))
        .filter(Boolean) as FieldSchema[]
      return fields.length ? { ...section, fields } : null
    })
    .filter(Boolean) as SchemaSection[]
}

function rootOf(path: string): string {
  return path.split(/[.[]/)[0]
}

export function knownRootKeys(): Set<string> {
  const keys = new Set<string>()
  for (const section of allSections) {
    for (const field of section.fields) keys.add(rootOf(field.path))
  }
  return keys
}

export function countSchemaFields(): number {
  let total = 0
  const walk = (fields: FieldSchema[]) => {
    for (const field of fields) {
      total += 1
      if (field.children) walk(field.children)
      if (field.itemFields) walk(field.itemFields)
    }
  }
  for (const section of allSections) walk(section.fields)
  return total
}
