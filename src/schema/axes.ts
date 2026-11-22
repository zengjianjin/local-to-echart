import type { FieldSchema, SchemaSection } from '@/types'
import { axisTypeOptions, lineStyleOptions } from './fieldKinds'
import { labelFields, lineStyleFields, prefixFields } from './nestedStyles'

export const axisItemFields: FieldSchema[] = [
  { path: 'type', label: '轴类型', section: 'axes', kind: 'enum', enumValues: axisTypeOptions },
  { path: 'name', label: '轴名称', section: 'axes', kind: 'string', placeholder: '例如：月份' },
  { path: 'nameLocation', label: '名称位置', section: 'axes', kind: 'enum', enumValues: [{ label: '末端', value: 'end' }, { label: '中间', value: 'middle' }, { label: '起点', value: 'start' }] },
  { path: 'position', label: '轴位置', section: 'axes', kind: 'enum', enumValues: [{ label: '下', value: 'bottom' }, { label: '上', value: 'top' }, { label: '左', value: 'left' }, { label: '右', value: 'right' }] },
  { path: 'show', label: '显示坐标轴', section: 'axes', kind: 'boolean' },
  { path: 'min', label: '最小值', section: 'axes', kind: 'string', placeholder: '例如：0 或 dataMin' },
  { path: 'max', label: '最大值', section: 'axes', kind: 'string', placeholder: '例如：100 或 dataMax' },
  { path: 'splitNumber', label: '分段数', section: 'axes', kind: 'number', min: 1, max: 30 },
  { path: 'boundaryGap', label: '两端留白', section: 'axes', kind: 'boolean' },
  { path: 'inverse', label: '反向', section: 'axes', kind: 'boolean' },
  {
    path: 'axisLabel',
    label: '刻度标签',
    section: 'axes',
    kind: 'object',
    children: labelFields,
  },
  {
    path: 'axisLine',
    label: '轴线',
    section: 'axes',
    kind: 'object',
    children: [
      { path: 'show', label: '显示轴线', section: 'axes', kind: 'boolean' },
      ...prefixFields('lineStyle', lineStyleFields),
    ],
  },
  {
    path: 'axisTick',
    label: '刻度线',
    section: 'axes',
    kind: 'object',
    children: [
      { path: 'show', label: '显示刻度', section: 'axes', kind: 'boolean' },
      { path: 'inside', label: '朝内', section: 'axes', kind: 'boolean' },
      { path: 'length', label: '刻度长度', section: 'axes', kind: 'number', min: 0, max: 30 },
    ],
  },
  {
    path: 'splitLine',
    label: '分隔线',
    section: 'axes',
    kind: 'object',
    children: [
      { path: 'show', label: '显示分隔线', section: 'axes', kind: 'boolean' },
      ...prefixFields('lineStyle', lineStyleFields),
    ],
  },
  {
    path: 'splitArea',
    label: '分隔区域',
    section: 'axes',
    kind: 'object',
    children: [
      { path: 'show', label: '显示分隔区域', section: 'axes', kind: 'boolean' },
      { path: 'areaStyle.color', label: '区域颜色', section: 'axes', kind: 'color' },
      { path: 'areaStyle.opacity', label: '区域透明度', section: 'axes', kind: 'number', min: 0, max: 1, step: 0.05 },
    ],
  },
]

const singleAxisFields = axisItemFields.filter((field) =>
  ['type', 'name', 'position', 'show', 'min', 'max', 'inverse'].includes(field.path),
)

export const axesSections: SchemaSection[] = [
  {
    id: 'xAxis',
    label: 'X 轴',
    description: '支持多个类目轴、数值轴与时间轴',
    fields: [
      {
        path: 'xAxis',
        label: 'X 轴列表',
        section: 'xAxis',
        kind: 'array',
        itemFields: axisItemFields,
        default: [{ type: 'category' }],
      },
    ],
  },
  {
    id: 'yAxis',
    label: 'Y 轴',
    description: '支持多个数值轴与双轴布局',
    fields: [
      {
        path: 'yAxis',
        label: 'Y 轴列表',
        section: 'yAxis',
        kind: 'array',
        itemFields: axisItemFields,
        default: [{ type: 'value' }],
      },
    ],
  },
  {
    id: 'otherAxes',
    label: '其他坐标轴',
    description: '极坐标、单轴与平行坐标轴',
    fields: [
      { path: 'radiusAxis', label: '径向轴', section: 'otherAxes', kind: 'array', itemFields: singleAxisFields },
      { path: 'angleAxis', label: '角度轴', section: 'otherAxes', kind: 'array', itemFields: singleAxisFields },
      { path: 'singleAxis', label: '单轴', section: 'otherAxes', kind: 'array', itemFields: singleAxisFields },
      { path: 'parallelAxis', label: '平行坐标轴', section: 'otherAxes', kind: 'array', itemFields: singleAxisFields },
    ],
  },
]

export const axisLineTypeOptions = lineStyleOptions
