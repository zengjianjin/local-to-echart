import type { FieldSchema, SchemaSection } from '@/types'
import { i18n } from './index'
import enSchema from './locales/en-US/schema'
import zhSchema from './locales/zh-CN/schema'
import zhTwSchema from './locales/zh-TW/schema'
import type { Locale } from './types'

const dictionaries: Record<Locale, Record<string, string>> = {
  'zh-CN': zhSchema,
  'zh-TW': zhTwSchema,
  'en-US': enSchema,
}

export function translateSchemaText(text: string | undefined): string | undefined {
  if (text === undefined) return undefined
  const locale = i18n.global.locale.value as Locale
  return dictionaries[locale]?.[text] ?? dictionaries['zh-CN'][text] ?? text
}

export function localizeField(field: FieldSchema): FieldSchema {
  return {
    ...field,
    label: translateSchemaText(field.label) ?? field.label,
    description: translateSchemaText(field.description) ?? field.description,
    placeholder: translateSchemaText(field.placeholder) ?? field.placeholder,
    enumValues: field.enumValues?.map((option) => ({
      ...option,
      label: translateSchemaText(option.label) ?? option.label,
    })),
    children: field.children?.map(localizeField),
    itemFields: field.itemFields?.map(localizeField),
  }
}

export function localizeSection(section: SchemaSection): SchemaSection {
  return {
    ...section,
    label: translateSchemaText(section.label) ?? section.label,
    description: translateSchemaText(section.description) ?? section.description,
    fields: section.fields.map(localizeField),
  }
}
