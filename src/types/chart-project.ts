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

export interface ChartProjectFile {
  formatVersion: 1
  meta: {
    name: string
    updatedAt?: string
  }
  option: SerializableEchartsOption
  table?: TableData
}

export interface OptionValidationIssue {
  path: string
  message: string
  severity: 'error' | 'warning'
}
