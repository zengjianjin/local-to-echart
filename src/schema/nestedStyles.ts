import type { FieldSchema } from '@/types'
import { formatterPresets, lineStyleOptions, positionOptions } from './fieldKinds'

export function prefixFields(prefix: string, fields: FieldSchema[]): FieldSchema[] {
  return fields.map((field) => ({
    ...field,
    path: `${prefix}.${field.path}`,
    children: field.children ? prefixFields(`${prefix}.${field.path}`, field.children) : undefined,
  }))
}

export const textStyleFields: FieldSchema[] = [
  { path: 'color', label: '文字颜色', section: 'textStyle', kind: 'color' },
  { path: 'fontSize', label: '字号', section: 'textStyle', kind: 'number', min: 8, max: 72, step: 1 },
  {
    path: 'fontWeight',
    label: '字重',
    section: 'textStyle',
    kind: 'enum',
    enumValues: [
      { label: '常规', value: 'normal' },
      { label: '加粗', value: 'bold' },
      { label: '更细', value: 'lighter' },
      { label: '更粗', value: 'bolder' },
    ],
  },
  { path: 'fontFamily', label: '字体', section: 'textStyle', kind: 'string', placeholder: '例如：Arial, sans-serif' },
  { path: 'lineHeight', label: '行高', section: 'textStyle', kind: 'number', min: 8, max: 100 },
]

export const labelFields: FieldSchema[] = [
  { path: 'show', label: '显示标签', section: 'label', kind: 'boolean' },
  { path: 'position', label: '标签位置', section: 'label', kind: 'enum', enumValues: positionOptions },
  { path: 'color', label: '文字颜色', section: 'label', kind: 'color' },
  { path: 'fontSize', label: '字号', section: 'label', kind: 'number', min: 8, max: 48 },
  { path: 'backgroundColor', label: '标签背景', section: 'label', kind: 'color' },
  { path: 'borderColor', label: '标签边框', section: 'label', kind: 'color' },
  { path: 'borderRadius', label: '标签圆角', section: 'label', kind: 'number', min: 0, max: 32 },
  { path: 'padding', label: '标签内边距', section: 'label', kind: 'string', placeholder: '例如：[4, 8]' },
  { path: 'rotate', label: '旋转角度', section: 'label', kind: 'number', min: -90, max: 90 },
  { path: 'formatter', label: '标签模板', section: 'label', kind: 'template', enumValues: formatterPresets },
]

export const itemStyleFields: FieldSchema[] = [
  { path: 'color', label: '填充颜色', section: 'itemStyle', kind: 'color' },
  { path: 'borderColor', label: '边框颜色', section: 'itemStyle', kind: 'color' },
  { path: 'borderWidth', label: '边框宽度', section: 'itemStyle', kind: 'number', min: 0, max: 20 },
  { path: 'borderRadius', label: '圆角', section: 'itemStyle', kind: 'number', min: 0, max: 50 },
  { path: 'opacity', label: '透明度', section: 'itemStyle', kind: 'number', min: 0, max: 1, step: 0.05 },
  { path: 'shadowBlur', label: '阴影模糊', section: 'itemStyle', kind: 'number', min: 0, max: 80 },
  { path: 'shadowColor', label: '阴影颜色', section: 'itemStyle', kind: 'color' },
]

export const lineStyleFields: FieldSchema[] = [
  { path: 'color', label: '线条颜色', section: 'lineStyle', kind: 'color' },
  { path: 'width', label: '线条宽度', section: 'lineStyle', kind: 'number', min: 0, max: 20, step: 0.5 },
  { path: 'type', label: '线条类型', section: 'lineStyle', kind: 'enum', enumValues: lineStyleOptions },
  { path: 'opacity', label: '透明度', section: 'lineStyle', kind: 'number', min: 0, max: 1, step: 0.05 },
  { path: 'curveness', label: '曲率', section: 'lineStyle', kind: 'number', min: -1, max: 1, step: 0.05 },
]

export const areaStyleFields: FieldSchema[] = [
  { path: 'color', label: '区域颜色', section: 'areaStyle', kind: 'color' },
  { path: 'opacity', label: '区域透明度', section: 'areaStyle', kind: 'number', min: 0, max: 1, step: 0.05 },
  { path: 'shadowBlur', label: '阴影模糊', section: 'areaStyle', kind: 'number', min: 0, max: 80 },
]

export function emphasisFields(prefix = 'emphasis'): FieldSchema[] {
  return [
    {
      path: `${prefix}.label`,
      label: '高亮标签',
      section: 'series',
      kind: 'object',
      children: labelFields,
    },
    {
      path: `${prefix}.itemStyle`,
      label: '高亮图形',
      section: 'series',
      kind: 'object',
      children: itemStyleFields,
    },
    {
      path: `${prefix}.lineStyle`,
      label: '高亮线条',
      section: 'series',
      kind: 'object',
      children: lineStyleFields,
    },
    { path: `${prefix}.scale`, label: '高亮缩放', section: 'series', kind: 'number', min: 0.5, max: 2, step: 0.05 },
  ]
}
