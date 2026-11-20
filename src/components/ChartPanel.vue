<script setup>
import * as echarts from 'echarts'
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { exportPNG, exportSVG, exportPDF } from '../utils/download.js'

const props = defineProps({
  option: { type: Object, default: null },
  filename: { type: String, default: 'chart' },
  height: { type: Number, default: 420 },
  fill: { type: Boolean, default: false },
})

const canvas = ref(null)
const exporting = ref(false)
let chart = null
let observer = null

function resize() {
  const el = canvas.value
  if (chart && el && el.clientWidth > 0 && el.clientHeight > 0) chart.resize()
}

onMounted(() => {
  chart = echarts.init(canvas.value)
  if (props.option) chart.setOption(props.option, true)
  observer = new ResizeObserver(resize)
  observer.observe(canvas.value)
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', resize)
  chart?.dispose()
  chart = null
})

watch(() => props.option, (option) => {
  if (chart && option) chart.setOption(option, true)
})

function titleText() {
  const title = props.option?.title
  if (!title) return ''
  return Array.isArray(title) ? title[0]?.text || '' : title.text || ''
}

function savePNG() { if (chart) exportPNG(chart, `${props.filename}.png`) }
function saveSVG() { if (chart) exportSVG(chart, `${props.filename}.svg`) }
async function savePDF() {
  if (!chart) return
  exporting.value = true
  try {
    await exportPDF(chart, titleText(), `${props.filename}.pdf`)
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="card chart-card" :class="{ fill }">
    <div class="chart-toolbar">
      <h2>图表预览</h2>
      <div class="chart-actions">
        <button class="btn" type="button" @click="savePNG">PNG</button>
        <button class="btn" type="button" @click="saveSVG">SVG</button>
        <button class="btn primary" type="button" :disabled="exporting" @click="savePDF">
          {{ exporting ? '生成中…' : '导出 PDF' }}
        </button>
      </div>
    </div>
    <div ref="canvas" class="chart-canvas" :style="fill ? undefined : { height: `${height}px` }"></div>
  </div>
</template>
