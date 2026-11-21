import { parseDelimited } from './parse'
import type { Dataset } from '../types'

const DEMO_CSV = `月份,地区,销售额,订单数,利润率
1月,华东,128.5,342,0.18
2月,华东,146.2,389,0.19
3月,华东,159.8,412,0.21
4月,华东,151.3,398,0.20
5月,华东,178.6,457,0.22
6月,华东,193.4,501,0.23
7月,华东,210.8,546,0.24
8月,华东,205.1,528,0.23
9月,华东,226.7,587,0.25
10月,华东,241.3,624,0.26
11月,华东,258.9,671,0.27
12月,华东,276.4,713,0.28`

export function loadDemo(): Dataset {
  return {
    ...parseDelimited(DEMO_CSV),
    name: '示例数据 · 月度销售.csv',
    rowCount: 12,
  }
}
