import type { FieldSchema, SchemaSection } from '@/types'
import { formatterPresets, lineStyleOptions, seriesTypeOptions, symbolOptions } from './fieldKinds'
import { areaStyleFields, emphasisFields, itemStyleFields, labelFields, lineStyleFields, prefixFields } from './nestedStyles'

export const commonSeriesFields: FieldSchema[] = [
  { path: 'id', label: '系列标识', section: 'series', kind: 'string' },
  { path: 'name', label: '系列名称', section: 'series', kind: 'string', placeholder: '例如：销售额' },
  { path: 'type', label: '系列类型', section: 'series', kind: 'enum', enumValues: seriesTypeOptions, default: 'bar' },
  { path: 'datasetIndex', label: '数据节点索引', section: 'series', kind: 'number', min: 0, max: 20 },
  { path: 'seriesLayoutBy', label: '数据布局', section: 'series', kind: 'enum', enumValues: [{ label: '按列', value: 'column' }, { label: '按行', value: 'row' }] },
  { path: 'legendHoverLink', label: '图例联动高亮', section: 'series', kind: 'boolean' },
  { path: 'silent', label: '不响应交互', section: 'series', kind: 'boolean' },
  { path: 'z', label: '图形层级', section: 'series', kind: 'number', min: -100, max: 1000 },
  { path: 'zlevel', label: '画布层级', section: 'series', kind: 'number', min: 0, max: 100 },
  { path: 'xAxisIndex', label: 'X 轴索引', section: 'series', kind: 'number', min: 0, max: 20 },
  { path: 'yAxisIndex', label: 'Y 轴索引', section: 'series', kind: 'number', min: 0, max: 20 },
  {
    path: 'label',
    label: '系列标签',
    section: 'series',
    kind: 'object',
    children: labelFields,
  },
  ...emphasisFields('emphasis'),
  ...emphasisFields('blur').map((field) => ({ ...field, label: field.label.replace('高亮', '失焦') })),
  {
    path: 'itemStyle',
    label: '图形样式',
    section: 'series',
    kind: 'object',
    children: itemStyleFields,
  },
  {
    path: 'encode',
    label: '维度编码',
    section: 'series',
    kind: 'object',
    children: [
      { path: 'x', label: 'X 轴字段', section: 'series', kind: 'string', placeholder: '例如：0 或 月份', chartTypes: ['bar', 'line', 'scatter', 'heatmap'] },
      { path: 'y', label: 'Y 轴字段', section: 'series', kind: 'string', placeholder: '例如：[1] 或 销售额', chartTypes: ['bar', 'line', 'scatter', 'heatmap'] },
      { path: 'itemName', label: '扇区名称字段', section: 'series', kind: 'string', placeholder: '例如：0 或 月份', chartTypes: ['pie'] },
      { path: 'value', label: '扇区数值字段', section: 'series', kind: 'string', placeholder: '例如：2 或 销售额', chartTypes: ['pie'] },
      { path: 'tooltip', label: '提示字段', section: 'series', kind: 'string' },
      { path: 'seriesName', label: '系列名字段', section: 'series', kind: 'string' },
    ],
  },
  { path: 'data', label: '系列数据', section: 'series', kind: 'unknown', description: '建议使用 dataset；此处仅在高级场景下编辑' },
]

export const typeSpecificSeriesFields: FieldSchema[] = [
  { path: 'barWidth', label: '柱宽', section: 'series', kind: 'string', placeholder: '例如：18 或 60%', chartTypes: ['bar'] },
  { path: 'barMaxWidth', label: '最大柱宽', section: 'series', kind: 'string', chartTypes: ['bar'] },
  { path: 'barMinHeight', label: '最小柱高', section: 'series', kind: 'number', min: 0, max: 100, chartTypes: ['bar'] },
  { path: 'barGap', label: '同系列柱间距', section: 'series', kind: 'string', placeholder: '例如：30%', chartTypes: ['bar'] },
  { path: 'barCategoryGap', label: '类目柱间距', section: 'series', kind: 'string', placeholder: '例如：20%', chartTypes: ['bar'] },
  { path: 'stack', label: '堆叠组', section: 'series', kind: 'string', placeholder: '例如：总量', chartTypes: ['bar', 'line', 'area'] },
  { path: 'smooth', label: '平滑曲线', section: 'series', kind: 'boolean', chartTypes: ['line'] },
  { path: 'showSymbol', label: '显示数据点', section: 'series', kind: 'boolean', chartTypes: ['line'] },
  { path: 'symbol', label: '数据点形状', section: 'series', kind: 'enum', enumValues: symbolOptions, chartTypes: ['line', 'scatter'] },
  { path: 'symbolSize', label: '数据点大小', section: 'series', kind: 'string', placeholder: '例如：8', chartTypes: ['line', 'scatter'] },
  { path: 'step', label: '阶梯线', section: 'series', kind: 'enum', enumValues: [{ label: '关闭', value: false }, { label: '起点', value: 'start' }, { label: '中点', value: 'middle' }, { label: '终点', value: 'end' }], chartTypes: ['line'] },
  {
    path: 'lineStyle',
    label: '折线样式',
    section: 'series',
    kind: 'object',
    children: lineStyleFields,
    chartTypes: ['line'],
  },
  {
    path: 'areaStyle',
    label: '面积样式',
    section: 'series',
    kind: 'object',
    children: areaStyleFields,
    chartTypes: ['line'],
  },
  { path: 'radius', label: '饼图半径', section: 'series', kind: 'string', placeholder: '例如：60%', chartTypes: ['pie'] },
  { path: 'center', label: '饼图圆心', section: 'series', kind: 'string', placeholder: '例如：[50%, 50%]', chartTypes: ['pie', 'gauge'] },
  { path: 'roseType', label: '南丁格尔玫瑰', section: 'series', kind: 'enum', enumValues: [{ label: '关闭', value: '' }, { label: '半径', value: 'radius' }, { label: '面积', value: 'area' }], chartTypes: ['pie'] },
  { path: 'minAngle', label: '最小扇区角度', section: 'series', kind: 'number', min: 0, max: 90, chartTypes: ['pie'] },
  { path: 'avoidLabelOverlap', label: '避免标签重叠', section: 'series', kind: 'boolean', chartTypes: ['pie'] },
  {
    path: 'labelLine',
    label: '标签引导线',
    section: 'series',
    kind: 'object',
    children: [
      { path: 'show', label: '显示引导线', section: 'series', kind: 'boolean' },
      ...prefixFields('lineStyle', lineStyleFields),
    ],
    chartTypes: ['pie'],
  },
  { path: 'coordinateSystem', label: '坐标系', section: 'series', kind: 'string', placeholder: '例如：cartesian2d、polar', chartTypes: ['scatter', 'heatmap', 'radar'] },
]

export const seriesMarkFields: FieldSchema[] = [
  {
    path: 'markPoint',
    label: '标注点',
    section: 'series',
    kind: 'object',
    children: [
      { path: 'symbol', label: '标记形状', section: 'series', kind: 'enum', enumValues: symbolOptions },
      { path: 'symbolSize', label: '标记大小', section: 'series', kind: 'string' },
      { path: 'label.formatter', label: '标注模板', section: 'series', kind: 'template', enumValues: formatterPresets },
    ],
  },
  {
    path: 'markLine',
    label: '标注线',
    section: 'series',
    kind: 'object',
    children: [
      { path: 'symbol', label: '端点形状', section: 'series', kind: 'enum', enumValues: symbolOptions },
      { path: 'lineStyle.type', label: '线型', section: 'series', kind: 'enum', enumValues: lineStyleOptions },
      { path: 'label.formatter', label: '标注模板', section: 'series', kind: 'template', enumValues: formatterPresets },
    ],
  },
  {
    path: 'markArea',
    label: '标注区域',
    section: 'series',
    kind: 'object',
    children: [
      { path: 'itemStyle.color', label: '区域颜色', section: 'series', kind: 'color' },
      { path: 'itemStyle.opacity', label: '区域透明度', section: 'series', kind: 'number', min: 0, max: 1, step: 0.05 },
      { path: 'label.show', label: '显示标签', section: 'series', kind: 'boolean' },
    ],
  },
]

export const seriesItemFields = [...commonSeriesFields, ...typeSpecificSeriesFields, ...seriesMarkFields]

export const seriesSection: SchemaSection = {
  id: 'series',
  label: '数据系列',
  description: '每个 series 的通用属性、类型专属属性与标注',
  fields: [
    {
      path: 'series',
      label: 'series 列表',
      section: 'series',
      kind: 'array',
      description: '可新增、复制、排序多个系列；字段按当前系列类型过滤',
      itemFields: seriesItemFields,
    },
  ],
}

export function seriesFieldsForType(type: string): FieldSchema[] {
  return seriesItemFields.filter((field) => !field.chartTypes || field.chartTypes.includes(type))
}
