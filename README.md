# local-to-echarts

English | [简体中文](README.zh-CN.md)

**A local-first charting tool: drop in a CSV / Excel file, configure a chart in a few clicks, export PNG / SVG / PDF. Your data never leaves the machine.**

> Status: **v0.1 MVP is runnable**. Browser preview and desktop app share one Vue codebase; the desktop shell is Electron, so no Rust is involved anywhere.

![Screenshot](docs/screenshot.png)

## Why

Data visualization tools are not in short supply, but the usual combinations have rough edges: RAWGraphs, DataEase and GoView are web apps that live in a browser instead of your local file workflow; MadY and DataAnalyzerApp use a Python/Qt stack with a dated UI; Data Formulator depends on an LLM API key.

This project fills the gap: **an offline-capable, modern desktop tool that produces a chart as soon as you drop a file in**. The entire UI is Vue 3 + ECharts, so it is easy to modify. The desktop shell is Electron — all product logic is front-end JavaScript, and the main process is only a few lines that create a window. You never have to touch Rust.

## Features

- **Data import**: drag & drop or pick `.csv` / `.tsv` / `.txt` / `.xlsx` / `.xls`; auto-detects delimiters, BOM, quoted fields and numeric columns, and **supports merged cells and two-level Excel headers** (joined into unique names such as `Medium & Long-term Contract / Provincial Net Contract Energy`)
- **Table preview**: deduplicated column names, right-aligned numbers, first 100 rows shown
- **Three chart types**: bar, line and pie; the X / category axis supports **joining multiple fields** (e.g. `Month / Region` → `Jan / East`, with a custom separator), multiple value fields, and six aggregation modes (sum / average / count / max / min / first value)
- **Stack by field**: split the unique values of one field into series while the X axis stays on another — e.g. X = `Time Slot`, stack = `Settlement Date` puts multiple dates on the same tick. Participating values default to the first four and can be toggled individually or with **Select all / Reset to default**; the list has no nested scrollbar (the sidebar scrolls once), and cumulative stacking can be switched to side-by-side
- **Row exclusion**: untick unwanted rows in the preview table; excluded rows are skipped in charts and exports but remain visible with a strikethrough, so they can be restored at any time
- **Visual options**: title, color palette and category limit; settings are grouped into collapsible **Basic / Stack / Appearance & Aggregation** sections, with only Basic expanded by default
- **Three view modes**: switch between **Chart / Split / Data** from the toolbar — chart-only, table-only, or both stacked. The page itself never scrolls; only the sidebar and the active panes scroll, so the chart cannot be scrolled away
- **Export**: PNG (2× pixel density), SVG (vector), PDF, plus raw data as CSV and the full configuration as JSON
- **Zero uploads**: no backend endpoints, no telemetry, no network calls at runtime

## Quick start

### Browser preview (fastest)

Requires Node.js 20.19+ or 22.12+ (Vite 8 minimum; verified on Node 22.22):

```bash
npm install
npm run dev
```

Open <http://localhost:1420>. Sample data loads automatically, so a chart is visible immediately.

> The `xlsx` dependency points to [SheetJS official CDN 0.20.3](https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz), not the same-name npm registry package stuck at 0.18.5 (which has known security issues). This is the installation method recommended by SheetJS.

Build static files:

```bash
npm run build   # output in dist/
```

### Electron desktop app

No Rust, WebView2 or MSVC needed. `npm install` downloads the Electron binary; if the network is restricted, set a mirror before reinstalling.

```bash
# Dev mode: one command starts Vite (port 1422) and the desktop window together
npm run dev:electron

# Open the desktop window alone (run `npm run dev` in another terminal first; the window loads port 1420)
npm run electron

# Package the app (NSIS installer on Windows); output in release/
npm run dist
```

`dev:electron` uses port 1422 so it never conflicts with the browser preview on 1420 — both can run at the same time.

## Usage

1. Open the app, then drag in a data file or click **Try sample data**.
2. Pick a chart type, one or more category fields (joined together), and one or more value fields; exclude unwanted rows in the preview table if needed.
3. When a category has multiple rows, choose an aggregation mode; if there are too many categories, lower **Max categories**.
4. Use **Chart / Split / Data** in the content toolbar to switch views: Chart for trends, Data for row-by-row checks, Split (the default) for both.
5. Export PNG / SVG / PDF from the buttons at the top-right of the chart; the toolbar can also export the current data and configuration together as JSON for reproducibility.

**Numeric column rule**: a column is treated as numeric when at least 80% of its non-empty values parse as numbers. Thousands separators, spaces, `%`, `¥`, `$` and similar symbols are stripped while parsing.

**Stacking by date example** (electricity settlement bill): import the bill → select only `Time Slot` as the X field → select `Actual Energy Consumption` as the value field → choose `Settlement Date` as the stack field → tick the two dates (e.g. 06-01 and 06-02) among the participating values. Each time-slot tick now shows two stacked bars for the two dates. If you select multiple value fields, series are grouped by field, so energy and cost never get mixed together.

## Privacy

All parsing, aggregation and rendering happen inside the renderer process. There is no backend; `electron/main.cjs` disables `nodeIntegration` and enables `contextIsolation`, so the renderer has no access to Node APIs, and external links are handed to the system browser. The only network activity is `npm install` when you fetch development dependencies.

## Tech stack and architecture

| Layer | Stack | Notes |
|---|---|---|
| UI | Vue 3.5 + Vite 8 | Composition API, no UI framework dependency |
| Charts | ECharts 6 | Options built centrally in `src/utils/chart.js` |
| Excel parsing | SheetJS 0.20.3 (official CDN) | Reads the first worksheet in-browser |
| PDF export | jsPDF 4 | Dynamically imported, not loaded on first paint |
| Desktop shell | Electron 45 | Main process `electron/main.cjs` only creates the window; 100% of product logic is in the renderer |

The Electron main process owns windows and OS integration; business code never needs to know about it. Native features such as "save to a chosen path" or a system file dialog can be added with Electron's `dialog` / `ipcMain` APIs (still Node.js), or you can keep using browser downloads.

```text
src/
  App.vue                    State orchestration: dataset, chart config, exports
  components/
    FileDrop.vue             Drag & drop / file picker / sample data
    ChartOptions.vue         Chart configuration form
    ChartPanel.vue           ECharts instance and export buttons
    DataTable.vue            Data table preview
  utils/
    parse.js                 CSV/TSV/Excel parsing and type inference
    chart.js                 ECharts option generation and aggregation
    download.js              PNG/SVG/PDF/CSV/JSON export
    demo.js                  Built-in sample data
electron/main.cjs            Electron main process: window, menu, external links
scripts/dev-electron.mjs     One command to start Vite + Electron
examples/sample.csv          Sample data (same as the built-in set)
```

## Roadmap

- [x] CSV/TSV/Excel import and table preview
- [x] Bar/line/pie charts, field mapping and aggregation
- [x] PNG / SVG / PDF / CSV / JSON export
- [ ] Native save dialog (Electron dialog + ipcMain)
- [ ] Save/load chart config presets
- [ ] Group-by series (split series by a column)
- [ ] Dark theme
- [ ] Tree-shake ECharts to shrink the installer
- [ ] macOS / Linux packaging checks

## Contributing

Fork the repository → create a `feat/xxx` branch → commit → open a Pull Request. Bug fixes and new chart types are both welcome; please run `npm run build` once before submitting to confirm the build still passes.

## License

[MIT](LICENSE) © 2026 zengjianjin0920
