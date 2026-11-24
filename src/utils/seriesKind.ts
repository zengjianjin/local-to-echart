import type { SerializableNode } from '@/types'

const NON_CARTESIAN_TYPES = new Set([
  'pie',
  'gauge',
  'radar',
  'treemap',
  'graph',
  'sankey',
  'funnel',
  'sunburst',
  'themeRiver',
  'boxplot',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export function isNonCartesianType(type: unknown): boolean {
  return typeof type === 'string' && NON_CARTESIAN_TYPES.has(type)
}

export function isCartesianSeries(value: SerializableNode): boolean {
  if (!isRecord(value)) return false
  const coordinateSystem = value.coordinateSystem
  if (typeof coordinateSystem === 'string' && coordinateSystem && coordinateSystem !== 'cartesian2d') return false
  const type = typeof value.type === 'string' ? value.type : ''
  if (NON_CARTESIAN_TYPES.has(type)) return false
  return true
}

export function keepNonCartesianSeries(series: SerializableNode[]): SerializableNode[] {
  return series.filter((item) => !isCartesianSeries(item))
}
