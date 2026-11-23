export type InferredFieldType = 'number' | 'boolean' | 'date' | 'text'

export interface TableData {
  name: string
  columns: string[]
  rows: Array<Array<string | number | boolean | null>>
  inferredTypes: InferredFieldType[]
  rowCount: number
}

export interface FormatterDescriptor {
  __templateFormatter: {
    template: string
    preset?: string
  }
}

export type SerializableNode =
  | string
  | number
  | boolean
  | null
  | FormatterDescriptor
  | SerializableNode[]
  | { [key: string]: SerializableNode }

export type SerializableEchartsOption = Record<string, SerializableNode>

export interface SeriesGroupConfig {
  id: string
  nameFields: number[]
  nameSeparator: string
  valueField: number
  groupValues: string[]
  stackMode: 'none' | 'stack' | 'percent' | 'samesign' | 'all'
  groupLimit: number
  categoryLimit: number
  aggregate: 'sum' | 'avg' | 'first'
  defaults: Record<string, SerializableNode>
}

export interface ChartProjectFile {
  formatVersion: 1
  meta: {
    name: string
    updatedAt?: string
    xFields?: number[]
    xNameFields?: number[][]
    xNameSeparator?: string
    xNameValues?: string[][]
    seriesNameFields?: number[]
    seriesNameSeparator?: string
    seriesValueField?: number
    seriesStack?: boolean
    seriesStackMode?: 'none' | 'stack' | 'percent' | 'samesign' | 'all'
    seriesStackStrategy?: 'samesign' | 'all' | 'positive' | 'negative'
    seriesGroupLimit?: number
    seriesCategoryLimit?: number
    seriesAggregate?: 'sum' | 'avg' | 'first'
    seriesGroupValues?: string[]
    seriesGroupDefaults?: Record<string, SerializableNode>
    seriesGroups?: SeriesGroupConfig[]
  }
  option: SerializableEchartsOption
  table?: TableData
}

export interface OptionValidationIssue {
  path: string
  message: string
  severity: 'error' | 'warning'
}
