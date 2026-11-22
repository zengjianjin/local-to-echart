# Local to ECharts Studio

一个本地优先的数据到图表工作台。左侧导入并预览表格数据，中间实时渲染 ECharts 图表，右侧提供完整的属性检查器：默认使用 schema 驱动的可视化表单，也可切换到 JSON 直接编辑任意 ECharts 字段。

## 核心能力

- 在浏览器进程内解析 CSV、TSV 与 Excel 文件，数据不上传。
- 速览表头、字段类型与前 12 行数据，并可打开全量预览弹窗查看所有行。
- 将表格写入标准 ECharts `dataset.source`，通过 `series.encode` 完成字段映射。
- 可视化编辑完整 option 的已知字段，JSON 模式编辑所有字段与未知字段。
- 支持 `series`、`xAxis`、`dataZoom`、`graphic` 等数组项的新增、复制、排序和删除。
- 表单与 JSON 双向同步，未知字段不会被表单清理。
- 使用可序列化的模板描述表达 `formatter`，不执行任意 JavaScript。
- 导出 PNG、SVG、PDF 与 JSON 项目文件，支持自定义导出分辨率。
- 表单、JSON 与渲染使用同一份配置；表单不会伪造 option 中未设置的默认值。
- 浅色（默认）与深色主题切换，界面配色不影响图片导出的深色背景。
- 支持浏览器和 Electron 桌面运行。

## 架构

项目不保留任何旧配置层。可序列化的完整 ECharts option 是唯一配置来源。

```text
导入文件 -> TableData -> dataset.source -> 运行时 option -> ECharts
右侧编辑 -> 路径写入 / JSON 草稿 -> option -> 实时预览
```

## 开发

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
pnpm dev:electron
pnpm dist
```

浏览器开发端口为 `1420`；Electron 开发模式使用 `1422`，并通过 `VLE_DEV_URL` 传给主进程。`pnpm dist` 使用 electron-builder 生成安装包。

## 配置格式

项目文件使用 `formatVersion: 1`，包含 `meta`、`option` 和可选的 `table`。旧配置格式会被明确拒绝，项目不提供兼容或迁移分支。

## 文档

- [使用指南](docs/getting-started.md)：安装启动、数据导入、界面操作、导出与主题切换的完整入门流程。
- [全属性编辑器](docs/option-editor.md)：表单/JSON 双模式与字段类型说明。
- [数据绑定](docs/data-binding.md)：CSV/TSV/Excel 解析与 `dataset` / `encode` 映射。
- [架构](docs/architecture.md)：状态模型与运行时数据流。
- [验收清单](docs/qa-checklist.md)：功能验收与回归项。

示例文件：`examples/sample.csv`、`examples/sample-chart-project.json`。

## 说明

- 项目使用全量 ECharts，确保 `dataZoom`、`visualMap`、`toolbox`、`graphic` 等高级组件无需手动注册即可使用。
- 函数型字段使用模板描述对象表达，不会执行用户输入的脚本。
- Electron 保持 `nodeIntegration` 关闭、`contextIsolation` 开启。
