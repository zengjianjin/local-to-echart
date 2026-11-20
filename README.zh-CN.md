# local-to-echarts

[English](README.md) | 简体中文

**本地优先的数据看图工具 —— 拖入 CSV / Excel，点几下配置出图，导出 PNG / SVG / PDF。数据不出本机。**

> 当前状态：**v0.1 MVP 可运行**。浏览器预览和桌面应用都基于同一套 Vue 代码，桌面壳用 Electron，全程不需要 Rust。

![界面预览](docs/screenshot.png)

## 为什么做这个

市面上不缺数据可视化工具，但常见组合总有点别扭：RAWGraphs / DataEase / GoView 是 Web 应用，用起来要开浏览器，不在本地文件流里；MadY / DataAnalyzerApp 是 Python/Qt 栈，界面观感老旧；Data Formulator 依赖 LLM API，要配 key。

这个项目的定位是把缺口补上：**一个断网可用、拖进来就会出图的现代桌面小工具**，并且整套界面用 Vue 3 + ECharts 写，改起来没有门槛。桌面壳选 Electron——业务逻辑 100% 是前端 JS，主进程只有几行创建窗口的代码，不需要碰 Rust。

## 功能

- **数据导入**：拖入或选择 `.csv` / `.tsv` / `.txt` / `.xlsx` / `.xls`；自动识别分隔符、BOM、引号转义和数值列，**支持合并单元格与两级表头**（自动拼成「中长期合同/省内净合同电量」这样的唯一列名）
- **表格预览**：列名自动去重，数值右对齐，超过 100 行只展示前 100 行
- **三种图表**：柱状图、折线图、饼图；X 轴 / 分类字段支持**多字段拼接**（如「月份 / 地区」→ `1月 / 华东`，分隔符可自定义），数值字段可多选，聚合方式 6 种（求和 / 平均值 / 计数 / 最大 / 最小 / 首条值）
- **按字段堆叠**：把某字段的唯一值拆成系列，X 轴保持另一字段——例如 X 轴「时段」+ 堆叠「结算日期」，同一时段刻度上就堆叠出 06-01 与 06-02 的数据；参与取值默认前 4 项，可逐个勾选或一键「全选 / 恢复默认」，列表不套内部滚动条（由侧栏统一滚动）；可切换累加堆叠/并排显示
- **行剔除**：在数据预览表格里勾选掉不需要的行，剔除后不参与图表和导出，但仍划线显示在表格中，可随时恢复
- **可视化配置**：标题、配色主题、显示分类数；配置项按「基础 / 堆叠 / 外观与聚合」分组折叠，默认只展开基础项
- **三种视图模式**：顶部切换「图表 / 分屏 / 数据」——图表独占一屏、表格独占一屏，或上下分屏同时查看；页面本身不滚动，只有侧栏和图表/表格区域内部滚动，图表不会被滚走
- **导出**：PNG（2 倍像素）、SVG（矢量）、PDF，以及原始数据 CSV / 完整配置 JSON
- **零上传**：没有后端接口、没有埋点、没有网络请求

## 快速开始

### 方式一：浏览器预览（最快）

需要 Node.js 20.19+ 或 22.12+（Vite 8 的最低要求；开发时用 Node 22.22 验证）：

```bash
npm install
npm run dev
```

打开 <http://localhost:1420>。首次进入会自动加载示例数据，直接就能看到图表。

> `xlsx` 依赖指向 [SheetJS 官方 CDN 的 0.20.3](https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz)，而不是 npm registry 上停更在 0.18.5 的同名包——后者有已知安全问题，这也是 SheetJS 官方推荐的安装方式。

构建静态文件：

```bash
npm run build
```

### 方式二：Electron 桌面应用

不需要 Rust、WebView2 或 MSVC。`npm install` 时会下载 Electron 二进制；若网络受限，可设置镜像后重装。

```bash
# 开发模式：一条命令同时启动 Vite（1422 端口）和桌面窗口
npm run dev:electron

# 单独打开桌面窗口（需先另开终端跑 npm run dev，窗口会加载 1420）
npm run electron

# 打包：产物在 release/ 目录（Windows 为 NSIS 安装包）
npm run dist
```

`dev:electron` 用的是 1422 端口，和浏览器预览的 1420 不冲突，可以同时跑。

## 使用说明

1. 打开应用后，直接拖入数据文件，或点击「试用示例数据」
2. 选图表类型、分类字段（可多选拼接）和一个或多个数值字段；需要时在数据预览表格里剔除行
3. 同一分类有多行时，选择聚合方式；分类太多可调「最多显示分类数」
4. 用内容区顶部的「图表 / 分屏 / 数据」切换视图：想专心看趋势就用图表模式，逐行核对用数据模式，平时默认分屏
5. 图表右上角按钮导出 PNG / SVG / PDF；顶部可把当前数据和配置一起导出为 JSON，方便复现

**数值列判定规则**：非空值中至少 80% 能解析为数字，即视为数值列；解析时会去掉千分位逗号、空格、`%`、`¥`、`$` 等符号。

**按日期堆叠示例**（电力清分账单场景）：导入账单 → X 轴字段只选「时段」→ 数值字段选「实际用电量」→ 按字段堆叠选「结算日期」→ 在参与堆叠的取值里勾选 06-01 和 06-02。这样一个时段刻度上就会堆叠两根日期柱；若数值字段选多个，会按字段分组堆叠（电量与电费不会混在一起）。

## 数据隐私

所有解析、聚合和渲染都发生在渲染进程内。项目没有后端服务，`electron/main.cjs` 关掉了 `nodeIntegration`、开启 `contextIsolation`，渲染页拿不到 Node API；外链一律交给系统浏览器。唯一的联网场景是你首次执行 `npm install` 下载依赖。

## 技术栈与架构

| 层 | 技术 | 说明 |
|---|---|---|
| 界面 | Vue 3.5 + Vite 8 | 组合式 API，无 UI 框架依赖 |
| 图表 | ECharts 6 | 配置在 `src/utils/chart.js` 统一生成 |
| Excel 解析 | SheetJS 0.20.3（官方 CDN） | 纯前端读取首个 sheet |
| PDF 导出 | jsPDF 4 | 动态导入，首屏不加载 |
| 桌面壳 | Electron 45 | 主进程 `electron/main.cjs` 仅创建窗口，业务逻辑 100% 在渲染进程 |

Electron 的主进程负责窗口和系统集成，业务代码不需要感知它。以后要加「保存到指定路径」「原生文件对话框」等能力，直接用 Electron 的 `dialog` / `ipcMain` API（同为 Node JS），或继续用浏览器下载。

```text
src/
  App.vue                    状态编排：数据集、图表配置、导出
  components/
    FileDrop.vue             拖拽 / 选择文件 / 示例数据
    ChartOptions.vue         图表配置表单
    ChartPanel.vue           ECharts 实例与导出按钮
    DataTable.vue            数据表格预览
  utils/
    parse.js                 CSV/TSV/Excel 解析与类型推断
    chart.js                 ECharts option 生成、聚合逻辑
    download.js              PNG/SVG/PDF/CSV/JSON 导出
    demo.js                  内置示例数据
electron/main.cjs            Electron 主进程：窗口、菜单、外链处理
scripts/dev-electron.mjs     一条命令启动 Vite + Electron
examples/sample.csv          示例数据（与内置一致）
```

## 路线图

- [x] CSV/TSV/Excel 导入与表格预览
- [x] 柱状/折线/饼图 + 字段映射 + 聚合
- [x] PNG / SVG / PDF / CSV / JSON 导出
- [ ] 原生文件保存对话框（Electron dialog + ipcMain）
- [ ] 图表配置另存为模板、配置导入
- [ ] 分组字段（多系列按列拆分）
- [ ] 深色主题
- [ ] ECharts 按需引入，减小安装包体积
- [ ] macOS / Linux 打包实测

## 参与贡献

Fork 本仓库 → 新建 `feat/xxx` 分支 → 提交代码 → 新建 Pull Request。修 bug 或加图表类型都欢迎，改动前建议先跑一次 `npm run build` 确认能构建。

## License

[MIT](LICENSE) © 2026 zengjianjin0920
