<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { BarChart3 } from 'lucide-vue-next'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

const { state, runtimeOption, setChartInstance } = useWorkspaceStore()
const host = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null

function resize() {
  chart?.resize()
}

onMounted(() => {
  if (!host.value) return
  chart = echarts.init(host.value)
  setChartInstance(chart)
  chart.setOption(runtimeOption.value, { notMerge: true, lazyUpdate: true })
  observer = new ResizeObserver(resize)
  observer.observe(host.value)
  window.addEventListener('resize', resize)
})

watch(runtimeOption, (option) => {
  chart?.setOption(option, { notMerge: true, lazyUpdate: true })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  window.removeEventListener('resize', resize)
  chart?.dispose()
  chart = null
  setChartInstance(null)
})
</script>

<template>
  <div class="relative h-full w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-ink-900/90 via-ink-950/95 to-ink-900/80 shadow-panel">
    <div class="pointer-events-none absolute inset-0 bg-panel-glow opacity-70" />
    <div class="pointer-events-none absolute inset-0 bg-violet-glow opacity-50" />

    <div
      v-if="!state.table && Array.isArray(state.project.option.series) && state.project.option.series.length === 0"
      class="absolute inset-0 z-10 flex items-center justify-center"
    >
      <div class="max-w-[320px] rounded-2xl border border-white/[0.08] bg-ink-950/60 px-8 py-7 text-center backdrop-blur">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
          <BarChart3 :size="23" />
        </div>
        <div class="text-[14px] font-semibold text-ink-50">准备生成图表</div>
        <p class="mt-2 text-[11px] leading-relaxed text-ink-400">
          从左侧导入 CSV 或 Excel，数据会写入标准 dataset；随后可在右侧直接编辑完整 ECharts Option。
        </p>
      </div>
    </div>

    <div ref="host" class="absolute inset-2 z-[1]" />
  </div>
</template>
