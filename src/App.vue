<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { parseFile } from './utils/parse'
import { loadDemo } from './utils/demo'
import { buildOption } from './utils/chart'
import { exportCSV, exportJSON, safeFilename } from './utils/download'
import FileDrop from './components/FileDrop.vue'
import ChartOptions from './components/ChartOptions.vue'
import ChartPanel from './components/ChartPanel.vue'
import DataTable from './components/DataTable.vue'
import type { ChartConfig, Dataset, ViewMode } from './types'

const dataset = ref<Dataset | null>(loadDemo())
const error = ref('')
const busy = ref(false)
// split (default) | chart | data -- which pane fills the content area.
const view = ref<ViewMode>('split')
const config = reactive<ChartConfig>({
  type: 'bar',
  xFields: ['月份'],
  xSeparator: ' / ',
  yFields: ['销售额'],
  stackField: '',
  stackValues: [],
  stacked: true,
  excludedRows: [],
  aggregate: 'sum',
  limit: 12,
  palette: 'ocean',
  title: '月度销售额趋势',
  height: 420,
})

const viewOptions: { v: ViewMode; label: string }[] = [
  { v: 'chart', label: '图表' },
  { v: 'split', label: '分屏' },
  { v: 'data', label: '数据' },
]

// Reset the mapping whenever a new file (or the demo data) is loaded.
watch(dataset, (data) => {
  if (!data) return
  config.xFields = data.columns.slice(0, 1)
  config.yFields = data.numericColumns.slice(0, 1)
  config.stackField = ''
  config.stackValues = []
  config.stacked = true
  config.excludedRows = []
  config.title = `${data.name.replace(/\.[^.]+$/, '')} · 概览`
  error.value = ''
})

// Excluded rows leave the chart and exports, but stay visible (marked) in the
// preview table so they can be brought back.
const activeDataset = computed<Dataset | null>(() => {
  const data = dataset.value
  if (!data || !config.excludedRows.length) return data
  const rows = data.rows.filter((_, index) => !config.excludedRows.includes(index))
  return { ...data, rows, rowCount: rows.length }
})

function toggleRow(index: number): void {
  const excluded = new Set(config.excludedRows)
  if (excluded.has(index)) excluded.delete(index)
  else excluded.add(index)
  config.excludedRows = [...excluded]
}

function resetRows(): void { config.excludedRows = [] }

const option = computed(() => buildOption(activeDataset.value, config))
const baseName = computed(() => (
  dataset.value ? safeFilename(dataset.value.name.replace(/\.[^.]+$/, '')) : 'chart'
))

async function handleFile(file: File): Promise<void> {
  error.value = ''
  busy.value = true
  try {
    dataset.value = await parseFile(file)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '文件解析失败，请检查文件内容'
  } finally {
    busy.value = false
  }
}

function loadSample(): void { dataset.value = loadDemo() }

function downloadData(kind: 'csv' | 'json'): void {
  if (!dataset.value || !activeDataset.value) return
  if (kind === 'csv') {
    exportCSV(activeDataset.value, `${baseName.value}.csv`)
    return
  }
  exportJSON({
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    config: {
      ...config,
      xFields: [...config.xFields],
      yFields: [...config.yFields],
      stackValues: [...config.stackValues],
      excludedRows: [...config.excludedRows],
    },
    dataset: {
      name: dataset.value.name,
      columns: activeDataset.value.columns,
      numericColumns: activeDataset.value.numericColumns,
      rows: activeDataset.value.rows,
    },
  }, `${baseName.value}.json`)
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">L→E</div>
        <div>
          <h1>local-to-echarts</h1>
          <p>拖入数据，几秒钟出图。数据不出本机。</p>
        </div>
      </div>
      <div class="top-actions">
        <span class="pill">🔒 本地优先 · 无上传</span>
        <button class="btn" type="button" @click="downloadData('csv')">导出数据 CSV</button>
        <button class="btn" type="button" @click="downloadData('json')">导出配置</button>
      </div>
    </header>

    <main class="layout">
      <aside class="sidebar">
        <FileDrop :busy="busy" @file="handleFile" @demo="loadSample" />
        <div v-if="error" class="error-box">{{ error }}</div>
        <ChartOptions v-if="activeDataset" v-model="config" :dataset="activeDataset" />
        <details class="tip-card">
          <summary>使用提示</summary>
          <div class="tip-body">
            1. 拖入 CSV / Excel，或点「试用示例数据」<br />
            2. 选分类字段和数值字段，切换图表类型<br />
            3. 导出 PNG / SVG / PDF 用于报告或演示
          </div>
        </details>
      </aside>

      <section class="content">
        <div class="view-toolbar">
          <div class="view-tabs" role="tablist" aria-label="视图模式">
            <button
              v-for="item in viewOptions"
              :key="item.v"
              type="button"
              role="tab"
              :aria-selected="view === item.v"
              :class="{ active: view === item.v }"
              @click="view = item.v"
            >{{ item.label }}</button>
          </div>
          <span class="view-hint">
            {{ view === 'chart' ? '图表占满，专注看趋势' : view === 'data' ? '表格占满，方便逐行核对' : '上下分屏，图表与数据同时可见' }}
          </span>
        </div>

        <div class="view-body" :class="`view-${view}`">
          <div v-show="view !== 'data'" class="pane pane-chart">
            <ChartPanel v-if="option" :option="option" :filename="baseName" fill />
            <div v-else class="empty-chart">没有可绘制的数值列，请换一个文件试试</div>
          </div>
          <div v-show="view !== 'chart'" class="pane pane-data">
            <DataTable
              v-if="activeDataset"
              :dataset="activeDataset"
              :excluded-rows="config.excludedRows"
              fill
              @toggle-row="toggleRow"
              @reset-rows="resetRows"
            />
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
