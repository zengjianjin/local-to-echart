import rawCsv from '../../examples/sample.csv?raw'
import { parseCsvText } from './csv'

export function loadDemoTable() {
  return parseCsvText(rawCsv, 'sample.csv')
}
