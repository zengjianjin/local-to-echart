import type { FieldSchema, SchemaSection } from '@/types'
import { localizeField, localizeSection } from '@/i18n/schema'
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
  const localized = localizeField(field)
  const enumLabels = (field.enumValues ?? []).flatMap((option, index) => [
    option.label,
    localized.enumValues?.[index]?.label ?? '',
  ])
  const haystack = [
    field.label,
    localized.label,
    field.path,
    field.description ?? '',
    localized.description ?? '',
    ...enumLabels,
  ].join(' ').toLowerCase()
  return haystack.includes(query)
}

function filterField(field: FieldSchema, query: string): FieldSchema | null {
  if (matches(field, query)) return localizeField(field)
  const children = field.children?.map((child) => filterField(child, query)).filter(Boolean) as FieldSchema[] | undefined
  const itemFields = field.itemFields?.map((item) => filterField(item, query)).filter(Boolean) as FieldSchema[] | undefined
  if (children?.length || itemFields?.length) {
    return {
      ...localizeField(field),
      children: children?.length ? children : undefined,
      itemFields: itemFields?.length ? itemFields : undefined,
    }
  }
  return null
}

export function filterSections(query: string): SchemaSection[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return allSections.map(localizeSection)
  return allSections
    .map((section) => {
      const localizedSection = localizeSection(section)
      const sectionHaystack = [
        section.label,
        localizedSection.label,
        section.description,
        localizedSection.description,
        section.id,
      ].join(' ').toLowerCase()
      if (sectionHaystack.includes(normalized)) return localizedSection
      const fields = section.fields
        .map((field) => filterField(field, normalized))
        .filter(Boolean) as FieldSchema[]
      return fields.length ? { ...localizedSection, fields } : null
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
