import type { EnumOption, FieldKind } from '@/types'

export const fieldKindLabels: Record<FieldKind, string> = {
  string: '文本',
  number: '数值',
  boolean: '开关',
  color: '颜色',
  enum: '选择',
  object: '对象',
  array: '数组',
  template: '模板',
  unknown: '未知',
}

export const positionOptions: EnumOption[] = [
  { label: '左', value: 'left' },
  { label: '中', value: 'center' },
  { label: '右', value: 'right' },
]

export const verticalPositionOptions: EnumOption[] = [
  { label: '上', value: 'top' },
  { label: '中', value: 'middle' },
  { label: '下', value: 'bottom' },
]

export const axisTypeOptions: EnumOption[] = [
  { label: '类目轴', value: 'category' },
  { label: '数值轴', value: 'value' },
  { label: '时间轴', value: 'time' },
  { label: '对数轴', value: 'log' },
]

export const seriesTypeOptions: EnumOption[] = [
  { label: '柱状图', value: 'bar' },
  { label: '折线图', value: 'line' },
  { label: '饼图', value: 'pie' },
  { label: '散点图', value: 'scatter' },
  { label: '雷达图', value: 'radar' },
  { label: '仪表盘', value: 'gauge' },
  { label: '热力图', value: 'heatmap' },
]

export const lineStyleOptions: EnumOption[] = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' },
]

export const symbolOptions: EnumOption[] = [
  { label: '圆形', value: 'circle' },
  { label: '矩形', value: 'rect' },
  { label: '三角形', value: 'triangle' },
  { label: '菱形', value: 'diamond' },
  { label: '无', value: 'none' },
]

export const formatterPresets: EnumOption[] = [
  { label: '名称 + 数值', value: '{b}: {c}' },
  { label: '系列 + 名称 + 数值', value: '{a}\n{b}: {c}' },
  { label: '百分比', value: '{b}: {d}%' },
  { label: '仅数值', value: '{c}' },
]
