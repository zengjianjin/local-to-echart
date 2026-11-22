<script setup lang="ts">
import { computed } from 'vue'
import type { SerializableNode } from '@/types'
import { RefreshCw, Trash2, DatabaseZap, Plus } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { summarizeDatasetSize } from '@/utils/optionClone'
import { getOptionValue } from '@/utils/optionPath'

const { state, applyTable, setOptionValueAt } = useWorkspaceStore()

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

function dimensionIndex(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string' && /^\d+$/.test(raw)) return Number(raw)
  return -1
}

const usedColumns = computed(() => {
  const used = new Set<number>()
  for (const raw of seriesList.value) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || '__templateFormatter' in raw) continue
    const series = raw as Record<string, SerializableNode>
    const encode = series.encode
    if (!encode || typeof encode !== 'object' || Array.isArray(encode)) continue
    const record = encode as Record<string, unknown>
    const index = dimensionIndex(record.value ?? record.y)
    if (index >= 0) used.add(index)
  }
  return used
})

function addSeries(column: { index: number; name: string }) {
  const series: SerializableNode = {
    id: `series-column-${column.index}`,
    name: column.name,
    type: 'bar',
    datasetIndex: 0,
    encode: { x: 0, y: [column.index] },
  }
  setOptionValueAt('series', [...seriesList.value, series])
}

function reapply() {
  if (state.table) applyTable(state.table)
}

function clearDataset() {
  setOptionValueAt('dataset', [])
  setOptionValueAt('series', [])
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
          class="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] text-primary-100 transition hover:border-primary/40 hover:bg-primary/20 disabled:cursor-not-allowed disabled:border-white/[0.06] disabled:bg-white/[0.03] disabled:text-ink-600"
          @click="addSeries(column)"
        >
          <Plus :size="10" />
          {{ column.name }}
        </button>
      </div>
      <div class="mt-1.5 text-[9px] leading-relaxed text-ink-600">
        默认已按第一个数值列创建系列；点击其他列可追加。
      </div>
    </div>
  </div>
</template>
