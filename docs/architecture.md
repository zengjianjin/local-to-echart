# 架构说明

## 目标

右侧设置区的目标不是维护另一套“图表配置模型”，而是直接编辑完整 ECharts Option。表单只是 option 的可视化入口，JSON 是完整逃生通道。

## 状态模型

`src/stores/useWorkspaceStore.ts` 暴露模块级响应式工作区状态：

- `project`：包含 `formatVersion`、`meta`、`option` 和可选 `table`。
- `table`：当前导入的数据表，用于预览与重新写入 dataset。
- `ui`：左右面板折叠、编辑器模式、搜索、active section、主题、语言 `locale`、全量预览弹窗开关与错误状态等。
- `runtimeOption`：由 `materializeRuntimeOption` 将模板描述转换为运行时函数的 computed 结果。

`src/utils/optionNormalize.ts` 在 JSON 应用、数据导入与项目导入时把兼容修正持久化回 option（例如饼图 `encode.itemName/value`、`dataset.sourceHeader: 1`、饼图图例布局），因此表单、JSON 与渲染看到的是同一份配置。`runtimeOption` 只负责模板函数化，不再偷偷改写字段。

## 数据流

1. 文件解析得到 `TableData`。
2. `applyTable` 将表格写入 `option.dataset[0].source`；若没有 series，则按第一个数值列创建默认 series 与 `encode`。
3. 表单通过 `optionPath` 对 option 做路径级写入。
4. JSON 模式通过防抖校验后整体替换 option。
5. `runtimeOption` 传给 `ChartCanvas.vue` 中直接创建的 ECharts 实例，使用 `notMerge: true` 与 `lazyUpdate: true` 更新。

## 关键目录

- `src/schema/`：ECharts 字段元数据、分区、源中文标签、枚举值；展示文案由 `src/i18n/schema.ts` 按语言解析。
- `src/i18n/`：vue-i18n 实例、语言检测与持久化、翻译入口、按模块组织的语言资源。
- `electron/`：主进程、语言字典与只暴露 `setLocale` 的 preload 桥。
- `src/components/settings/`：右侧属性检查器、字段控件、数组编辑、JSON 编辑器。
- `src/components/data/`：文件导入、数据预览、数据节点操作。
- `src/components/chart/`：图表预览与导出工具栏。
- `src/utils/`：路径操作、option 归一化、合并/克隆、校验、字段输入归一化、运行时适配、导出工具。

## 兼容性

当前项目为重建版本，不读取旧配置，不保留旧 `ChartConfig`、旧 `buildOption` 或旧 `schemaVersion: 1`。导入非 `formatVersion: 1` 文件会直接报错。
