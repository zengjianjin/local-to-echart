<script setup lang="ts">
import { computed } from 'vue'
import type { SerializableNode } from '@/types'
import { Check, RefreshCw, Trash2, DatabaseZap, Plus } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { summarizeDatasetSize } from '@/utils/optionClone'
import { getOptionValue } from '@/utils/optionPath'

const { state, applyTable, setOptionValueAt, syncXFieldYAxes } = useWorkspaceStore()

const numericColumns = computed(() => {
  const table = state.table
  if (!table) return []
  return table.inferredTypes
    .map((type, index) => ({ type, index, name: table.columns[index] }))
    .filter((column) => column.type === 'number')
})

const seriesList = computed<SerializableNode[]>(() => {
  const value = getOptionValue(state.project.option, 'series')
  return Array.isArray(value) ? (value as SerializableNode[]) : []
})

function axisReady(key: 'xAxis' | 'yAxis'): boolean {
  const axes = getOptionValue(state.project.option, key)
  return Array.isArray(axes) ? axes.length > 0 : Boolean(axes)
}

function dimensionIndex(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string' && /^\d+$/.test(raw)) return Number(raw)
  return -1
}

function originalColumnIndex(index: number): number {
  const datasets = getOptionValue(state.project.option, 'dataset')
  if (Array.isArray(datasets)) {
    const node = datasets.find((item) => Boolean(item) && typeof item === 'object' && (item as Record<string, unknown>).id === 'workspace-dataset')
    const source = node && typeof node === 'object' ? (node as Record<string, unknown>).source : undefined
    const header = Array.isArray(source) && Array.isArray(source[0]) ? source[0] : null
    const name = header?.[index]
    if (typeof name === 'string') {
      const match = name.match(/^__workspace_xfield_\d+_(\d+)$/)
      if (match) return Number(match[1])
    }
  }
  return index
}

const usedColumns = computed(() => {
  const used = new Set<number>()
  for (const raw of seriesList.value) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || '__templateFormatter' in raw) continue
    const series = raw as Record<string, SerializableNode>
    const encode = series.encode
    if (!encode || typeof encode !== 'object' || Array.isArray(encode)) continue
    const record = encode as Record<string, unknown>
    const index = originalColumnIndex(dimensionIndex(record.value ?? record.y))
    if (index >= 0) used.add(index)
  }
  return used
})

function addSeries(column: { index: number; name: string }) {
  if (!axisReady('xAxis')) setOptionValueAt('xAxis', [{ type: 'category', splitLine: { show: false } }])
  if (!axisReady('yAxis')) setOptionValueAt('yAxis', [{ type: 'value', splitLine: { show: false } }])

  const xField = state.project.meta.xFields?.[0] ?? 0
  const series: SerializableNode = {
    id: `series-column-${column.index}`,
    name: column.name,
    type: 'bar',
    datasetIndex: 0,
    xAxisIndex: 0,
    yAxisIndex: 0,
    encode: { x: xField, y: [column.index] },
  }
  setOptionValueAt('series', [...seriesList.value, series])
  syncXFieldYAxes()
}

function reapply() {
  if (state.table) applyTable(state.table)
}

function clearDataset() {
  setOptionValueAt('dataset', [])
  setOptionValueAt('series', [])
  syncXFieldYAxes()
}
</script>

<template>
  <div class="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
    <div class="mb-2.5 flex items-center justify-between">
      <div class="flex items-center gap-2 text-[11px] font-semibold text-ink-100">
        <DatabaseZap :size="13" class="text-primary" /> 数据节点
      </div>
      <Badge :variant="state.table ? 'success' : 'neutral'">
        {{ state.table ? '已绑定' : '未绑定' }}
      </Badge>
    </div>

    <div class="rounded-lg bg-ink-950/60 px-3 py-2 font-mono text-[10px] text-ink-400">
      dataset[0].source
    </div>
    <div class="mt-2 text-[10px] text-ink-500">{{ summarizeDatasetSize(state.table) }}</div>

    <div class="mt-3 flex gap-2">
      <Button size="sm" class="flex-1" :disabled="!state.table" @click="reapply">
        <RefreshCw :size="12" /> 重新生成
      </Button>
      <Button size="sm" variant="danger" :disabled="!state.table" @click="clearDataset">
        <Trash2 :size="12" /> 清空
      </Button>
    </div>

    <div v-if="numericColumns.length" class="mt-3 border-t border-white/[0.06] pt-2.5">
      <div class="mb-1.5 text-[10px] font-medium text-ink-400">快速添加数值系列</div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="column in numericColumns"
          :key="column.index"
          type="button"
          :disabled="usedColumns.has(column.index)"
          :class="
            usedColumns.has(column.index)
              ? 'cursor-default border-primary/40 bg-primary/15 text-primary-100'
              : 'border-white/[0.08] bg-white/[0.025] text-ink-200 hover:border-primary/40 hover:bg-primary/10 hover:text-primary-100'
          "
          class="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition"
          @click="addSeries(column)"
        >
          <Check v-if="usedColumns.has(column.index)" :size="10" />
          <Plus v-else :size="10" />
          {{ column.name }}
        </button>
      </div>
      <div class="mt-1.5 text-[9px] leading-relaxed text-ink-600">
        带勾选的列已创建系列；点击其他列可追加。清空坐标轴会移除依赖轴的系列，可在这里重新添加。
      </div>
    </div>
  </div>
</template>
