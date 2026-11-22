import type { FieldSchema, SchemaSection } from '@/types'
import { positionOptions, verticalPositionOptions } from './fieldKinds'

const commonPositionFields: FieldSchema[] = [
  { path: 'left', label: '水平位置', section: 'advanced', kind: 'enum', enumValues: positionOptions },
  { path: 'top', label: '垂直位置', section: 'advanced', kind: 'enum', enumValues: verticalPositionOptions },
  { path: 'width', label: '宽度', section: 'advanced', kind: 'string' },
  { path: 'height', label: '高度', section: 'advanced', kind: 'string' },
  { path: 'show', label: '显示组件', section: 'advanced', kind: 'boolean' },
]

const dataZoomFields: FieldSchema[] = [
  ...commonPositionFields,
  { path: 'type', label: '缩放类型', section: 'advanced', kind: 'enum', enumValues: [{ label: '内部', value: 'inside' }, { label: '滑块', value: 'slider' }], default: 'inside' },
  { path: 'xAxisIndex', label: 'X 轴索引', section: 'advanced', kind: 'string', placeholder: '例如：0 或 [0, 1]' },
  { path: 'yAxisIndex', label: 'Y 轴索引', section: 'advanced', kind: 'string' },
  { path: 'start', label: '起始百分比', section: 'advanced', kind: 'number', min: 0, max: 100, default: 0 },
  { path: 'end', label: '结束百分比', section: 'advanced', kind: 'number', min: 0, max: 100, default: 100 },
  { path: 'startValue', label: '起始值', section: 'advanced', kind: 'string' },
  { path: 'endValue', label: '结束值', section: 'advanced', kind: 'string' },
  { path: 'zoomOnMouseWheel', label: '滚轮缩放', section: 'advanced', kind: 'boolean' },
  { path: 'moveOnMouseMove', label: '拖动平移', section: 'advanced', kind: 'boolean' },
]

const visualMapFields: FieldSchema[] = [
  ...commonPositionFields,
  { path: 'type', label: '映射类型', section: 'advanced', kind: 'enum', enumValues: [{ label: '连续', value: 'continuous' }, { label: '离散', value: 'piecewise' }], default: 'continuous' },
  { path: 'min', label: '最小值', section: 'advanced', kind: 'number' },
  { path: 'max', label: '最大值', section: 'advanced', kind: 'number' },
  { path: 'dimension', label: '映射维度', section: 'advanced', kind: 'string', placeholder: '例如：2 或 利润率' },
  { path: 'calculable', label: '显示拖拽手柄', section: 'advanced', kind: 'boolean' },
  { path: 'realtime', label: '实时刷新', section: 'advanced', kind: 'boolean' },
  { path: 'inRange.color', label: '范围内颜色', section: 'advanced', kind: 'string', placeholder: '例如：["#4F8CFF", "#22C55E"]' },
  { path: 'outOfRange.color', label: '范围外颜色', section: 'advanced', kind: 'string' },
]

const graphicFields: FieldSchema[] = [
  { path: 'type', label: '图形类型', section: 'advanced', kind: 'enum', enumValues: [{ label: '文本', value: 'text' }, { label: '矩形', value: 'rect' }, { label: '圆形', value: 'circle' }, { label: '图片', value: 'image' }], default: 'text' },
  { path: 'left', label: '水平位置', section: 'advanced', kind: 'string' },
  { path: 'top', label: '垂直位置', section: 'advanced', kind: 'string' },
  { path: 'style.text', label: '文本内容', section: 'advanced', kind: 'string' },
  { path: 'style.fill', label: '填充颜色', section: 'advanced', kind: 'color' },
  { path: 'style.stroke', label: '描边颜色', section: 'advanced', kind: 'color' },
  { path: 'style.fontSize', label: '字号', section: 'advanced', kind: 'number', min: 8, max: 72 },
  { path: 'z', label: '层级', section: 'advanced', kind: 'number', min: -100, max: 1000 },
]

const geoFields: FieldSchema[] = [
  ...commonPositionFields,
  { path: 'map', label: '地图名称', section: 'advanced', kind: 'string', placeholder: '例如：china' },
  { path: 'roam', label: '允许缩放漫游', section: 'advanced', kind: 'boolean' },
  { path: 'zoom', label: '缩放比例', section: 'advanced', kind: 'number', min: 0.1, max: 10, step: 0.1 },
  { path: 'itemStyle.areaColor', label: '区域颜色', section: 'advanced', kind: 'color' },
  { path: 'itemStyle.borderColor', label: '边界颜色', section: 'advanced', kind: 'color' },
]

const polarFields: FieldSchema[] = [
  { path: 'center', label: '圆心', section: 'advanced', kind: 'string', placeholder: '例如：[50%, 50%]' },
  { path: 'radius', label: '半径', section: 'advanced', kind: 'string', placeholder: '例如：70%' },
  { path: 'startAngle', label: '起始角度', section: 'advanced', kind: 'number', min: -360, max: 360 },
  { path: 'endAngle', label: '结束角度', section: 'advanced', kind: 'number', min: -360, max: 360 },
]

const timelineFields: FieldSchema[] = [
  ...commonPositionFields,
  { path: 'realtime', label: '实时刷新', section: 'advanced', kind: 'boolean' },
  { path: 'loop', label: '循环播放', section: 'advanced', kind: 'boolean' },
  { path: 'autoPlay', label: '自动播放', section: 'advanced', kind: 'boolean' },
  { path: 'playInterval', label: '播放间隔', section: 'advanced', kind: 'number', min: 100, max: 10000, step: 100 },
  { path: 'symbolSize', label: '节点大小', section: 'advanced', kind: 'number', min: 2, max: 30 },
  { path: 'lineStyle.color', label: '轴线颜色', section: 'advanced', kind: 'color' },
]

export const advancedSections: SchemaSection[] = [
  {
    id: 'dataZoom',
    label: '数据缩放',
    description: '内部滚轮缩放与滑块筛选',
    fields: [{ path: 'dataZoom', label: '数据缩放组件', section: 'dataZoom', kind: 'array', itemFields: dataZoomFields }],
  },
  {
    id: 'visualMap',
    label: '视觉映射',
    description: '把数据维度映射为颜色、大小等视觉通道',
    fields: [{ path: 'visualMap', label: '视觉映射组件', section: 'visualMap', kind: 'array', itemFields: visualMapFields }],
  },
  {
    id: 'graphic',
    label: '图形元素',
    description: '在图表上叠加文本、形状与图片',
    fields: [{ path: 'graphic', label: '图形元素', section: 'graphic', kind: 'array', itemFields: graphicFields }],
  },
  {
    id: 'geo',
    label: '地理坐标系',
    description: '地图与地理坐标组件',
    fields: [
      { path: 'geo', label: '地理组件', section: 'geo', kind: 'array', itemFields: geoFields },
      { path: 'polar', label: '极坐标组件', section: 'geo', kind: 'array', itemFields: polarFields },
    ],
  },
  {
    id: 'timeline',
    label: '时间线',
    description: '按时间点切换多组图表配置',
    fields: [{ path: 'timeline', label: '时间线组件', section: 'timeline', kind: 'array', itemFields: timelineFields }],
  },
  {
    id: 'brush',
    label: '区域选择',
    description: '框选、多边形选择与数据联动',
    fields: [
      {
        path: 'brush',
        label: '区域选择组件',
        section: 'brush',
        kind: 'array',
        itemFields: [
          { path: 'toolbox', label: '工具箱按钮', section: 'brush', kind: 'string', placeholder: '例如：["rect", "clear"]' },
          { path: 'xAxisIndex', label: 'X 轴索引', section: 'brush', kind: 'string' },
          { path: 'yAxisIndex', label: 'Y 轴索引', section: 'brush', kind: 'string' },
          { path: 'brushStyle.borderColor', label: '选框边框', section: 'brush', kind: 'color' },
          { path: 'brushStyle.color', label: '选框颜色', section: 'brush', kind: 'color' },
          { path: 'brushStyle.opacity', label: '选框透明度', section: 'brush', kind: 'number', min: 0, max: 1, step: 0.05 },
        ],
      },
    ],
  },
]
