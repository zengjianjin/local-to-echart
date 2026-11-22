import type { SchemaSection } from '@/types'
import { prefixFields, textStyleFields } from './nestedStyles'

export const globalSection: SchemaSection = {
  id: 'global',
  label: '全局样式',
  description: '配色、背景、文字与动画等根级配置',
  fields: [
    {
      path: 'color',
      label: '调色板',
      section: 'global',
      kind: 'array',
      description: '按系列顺序循环使用的颜色列表',
      itemFields: [{ path: '', label: '颜色', section: 'global', kind: 'color' }],
    },
    { path: 'backgroundColor', label: '背景颜色', section: 'global', kind: 'color' },
    {
      path: 'textStyle',
      label: '全局文字',
      section: 'global',
      kind: 'object',
      children: textStyleFields,
    },
    { path: 'animation', label: '开启动画', section: 'global', kind: 'boolean' },
    { path: 'animationDuration', label: '初始动画时长', section: 'global', kind: 'number', min: 0, max: 10000, step: 100 },
    { path: 'animationDurationUpdate', label: '更新动画时长', section: 'global', kind: 'number', min: 0, max: 10000, step: 100 },
    {
      path: 'animationEasing',
      label: '初始缓动',
      section: 'global',
      kind: 'enum',
      enumValues: [
        { label: '线性', value: 'linear' },
        { label: '二次缓入', value: 'quadraticIn' },
        { label: '二次缓出', value: 'quadraticOut' },
        { label: '三次进出', value: 'cubicInOut' },
        { label: '弹性缓出', value: 'elasticOut' },
      ],
    },
    {
      path: 'animationEasingUpdate',
      label: '更新缓动',
      section: 'global',
      kind: 'enum',
      enumValues: [
        { label: '线性', value: 'linear' },
        { label: '二次进出', value: 'quadraticInOut' },
        { label: '三次进出', value: 'cubicInOut' },
      ],
    },
    { path: 'animationThreshold', label: '动画元素阈值', section: 'global', kind: 'number', min: 0, max: 100000, step: 500 },
    {
      path: 'stateAnimation',
      label: '状态动画',
      section: 'global',
      kind: 'object',
      children: [
        { path: 'duration', label: '持续时长', section: 'global', kind: 'number', min: 0, max: 3000, step: 50 },
        { path: 'easing', label: '缓动函数', section: 'global', kind: 'string', placeholder: '例如：cubicOut' },
      ],
    },
    {
      path: 'aria',
      label: '无障碍',
      section: 'global',
      kind: 'object',
      children: [
        { path: 'enabled', label: '启用无障碍', section: 'global', kind: 'boolean' },
        {
          path: 'decal.show',
          label: '启用纹理',
          section: 'global',
          kind: 'boolean',
        },
        {
          path: 'label.description',
          label: '图表描述',
          section: 'global',
          kind: 'string',
          placeholder: '例如：月度销售额趋势图',
        },
      ],
    },
    { path: 'progressive', label: '渐进渲染阈值', section: 'global', kind: 'number', min: 0, max: 100000, step: 500 },
    { path: 'progressiveThreshold', label: '渐进渲染下限', section: 'global', kind: 'number', min: 0, max: 100000, step: 500 },
    { path: 'useUTC', label: '使用 UTC', section: 'global', kind: 'boolean' },
  ],
}

export const globalDataSection: SchemaSection = {
  id: 'data',
  label: '数据节点',
  description: 'ECharts 标准 dataset 与数据编码',
  fields: [
    {
      path: 'dataset',
      label: 'dataset',
      section: 'data',
      kind: 'array',
      description: '数据表会写入 dataset[0].source，首行为表头',
      itemFields: [
        { path: 'id', label: '标识', section: 'data', kind: 'string' },
        { path: 'sourceHeader', label: '表头行数', section: 'data', kind: 'number', min: 0, max: 20, default: 1, description: 'ECharts sourceHeader：1 表示首行为表头，0 表示没有表头' },
        { path: 'seriesLayoutBy', label: '布局方向', section: 'data', kind: 'enum', enumValues: [{ label: '按列', value: 'column' }, { label: '按行', value: 'row' }] },
      ],
    },
    {
      path: 'dataset[0].source',
      label: '数据源',
      section: 'data',
      kind: 'unknown',
      description: '大表格建议在 JSON 模式查看；字段编码通过 series.encode 配置',
    },
    {
      path: 'series[0].encode',
      label: '首个系列编码',
      section: 'data',
      kind: 'object',
      children: [
        { path: 'x', label: 'X 轴字段', section: 'data', kind: 'string', placeholder: '例如：0 或 月份', chartTypes: ['bar', 'line', 'scatter', 'heatmap'] },
        { path: 'y', label: 'Y 轴字段', section: 'data', kind: 'string', placeholder: '例如：[1] 或 销售额', chartTypes: ['bar', 'line', 'scatter', 'heatmap'] },
        { path: 'itemName', label: '扇区名称字段', section: 'data', kind: 'string', placeholder: '例如：0 或 月份', chartTypes: ['pie'] },
        { path: 'value', label: '扇区数值字段', section: 'data', kind: 'string', placeholder: '例如：2 或 销售额', chartTypes: ['pie'] },
        { path: 'tooltip', label: '提示框字段', section: 'data', kind: 'string' },
        { path: 'seriesName', label: '系列名字段', section: 'data', kind: 'string' },
      ],
    },
  ],
}

export const globalSections = [globalSection, globalDataSection]
export { prefixFields }
