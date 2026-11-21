export type CellValue = string | number | null

export type DataRow = Record<string, CellValue>

export interface Table {
  columns: string[]
  rows: DataRow[]
  numericColumns: string[]
}

export interface Dataset extends Table {
  name: string
  rowCount: number
}

export type ChartType = 'bar' | 'line' | 'pie'

export type AggregateMethod = 'sum' | 'avg' | 'count' | 'max' | 'min' | 'first'

export type PaletteKey = 'ocean' | 'forest' | 'sunset'

export type ViewMode = 'split' | 'chart' | 'data'

export interface ChartConfig {
  type: ChartType
  xFields: string[]
  xSeparator: string
  yFields: string[]
  stackField: string
  stackValues: string[]
  stacked: boolean
  excludedRows: number[]
  aggregate: AggregateMethod
  limit: number
  palette: PaletteKey
  title: string
  height: number
  /** Legacy single X field, kept as a fallback for older saved configs. */
  xField?: string
}
