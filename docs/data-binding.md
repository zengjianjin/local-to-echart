# 数据绑定

## 数据进入图表

导入的 CSV/TSV 使用 PapaParse 解析，Excel 使用 SheetJS。Excel 含多个工作表时会弹出选择框，用户选定后按表名读取；单工作表文件直接读取首个工作表。解析后生成 `TableData`：

```ts
interface TableData {
  name: string
  columns: string[]
  rows: Array<Array<string | number | boolean | null>>
  inferredTypes: Array<'number' | 'boolean' | 'date' | 'text'>
  rowCount: number
}
```

点击“重新生成”会把当前表格写入：

```json
{
  "dataset": [
    {
      "id": "workspace-dataset",
      "sourceHeader": 1,
      "source": [
        ["月份", "销售额"],
        ["1月", 128.5]
      ]
    }
  ],
  "series": [
    {
      "type": "bar",
      "encode": { "x": 0, "y": [1] }
    }
  ]
}
```

## 字段映射

字段映射完全使用 ECharts 标准字段：

- `dataset.source` 提供数据。
- `dataset.sourceHeader` 表示表头行数：`1` 表示首行为表头，`0` 表示没有表头；它不是从 0 开始的行索引。
- `seriesLayoutBy` 控制按列或按行布局。
- `series.encode` 控制维度到坐标轴、提示框和系列名的映射。
- `series.datasetIndex` 选择数据节点。

项目不再维护 `categoryField`、`valueField`、`stackField` 或 `aggregate` 等自定义字段。

## 类型转换

CSV 文本会按推断类型转换为数字或布尔值。首行为表头，后续行为数据。Excel 日期会转成 `YYYY-MM-DD` 字符串。空值保存为 `null`。

## 数据预览

左侧列表是速览，只显示前 12 行与前 5 列，表头带字段类型标识。点击「全量」打开弹窗后可查看所有行列、按任意单元格搜索，并通过滚动分批加载更多数据（每批 500 行）。弹窗支持 `Esc` 关闭。

## 导出策略

- “项目配置”导出包含 option 与当前 table。
- “仅 Option”导出不包含大表格数据；再次导入时需要重新导入数据文件。
- “导入配置”可恢复此前导出的项目配置，旧 `formatVersion` 会被拒绝。
- PNG / SVG / PDF 支持分辨率选择：跟随预览、1920×1080、2560×1440、3840×2160 或自定义宽高。图片一律使用深色背景 `#0F172A`，与当前界面主题无关。
