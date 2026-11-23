import type { FieldSchema } from '@/types'
import { fieldKindLabels } from '@/schema/fieldKinds'
import { translateSchemaText } from '@/i18n/schema'
import { translate } from '@/i18n/translate'

function valueLabel(value: string | number | boolean): string {
  if (value === '') return translate('runtime.emptyValue')
  if (typeof value === 'boolean') return value ? translate('common.yes') : translate('common.no')
  return String(value)
}

export function fieldHelpText(field: FieldSchema, resolvedPath?: string): string {
  const path = resolvedPath || field.path
  const label = translateSchemaText(field.label) ?? field.label
  const description = translateSchemaText(field.description) ?? field.description
  const parts: string[] = []

  if (description) {
    parts.push(description)
  } else {
    const kind = translateSchemaText(fieldKindLabels[field.kind] ?? field.kind) ?? field.kind
    parts.push(translate('runtime.fieldHelp.base', {
      label,
      kind,
      path: path || translate('runtime.currentNode'),
    }))
  }

  if (field.enumValues?.length) {
    const values = field.enumValues
      .map((item) => {
        const translated = translateSchemaText(item.label) ?? item.label
        return translate('runtime.enumValueItem', { label: translated, value: valueLabel(item.value) })
      })
      .join('、')
    parts.push(translate('runtime.fieldHelp.enumValues', { values }))
  }
  if (typeof field.min === 'number' || typeof field.max === 'number') {
    const min = typeof field.min === 'number' ? field.min : translate('runtime.unlimited')
    const max = typeof field.max === 'number' ? field.max : translate('runtime.unlimited')
    parts.push(translate('runtime.fieldHelp.range', { min, max }))
  }
  if (field.kind === 'array') parts.push(translate('runtime.fieldHelp.array'))
  if (field.kind === 'object') parts.push(translate('runtime.fieldHelp.object'))
  if (field.kind === 'template') parts.push(translate('runtime.fieldHelp.template'))
  if (field.placeholder) {
    parts.push(translate('runtime.fieldHelp.example', { example: translateSchemaText(field.placeholder) ?? field.placeholder }))
  }

  return parts.join(' ')
}
