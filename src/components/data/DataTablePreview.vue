<script setup lang="ts">
import { computed } from 'vue'
import { Maximize2, Table2 } from 'lucide-vue-next'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

const { state } = useWorkspaceStore()
const visibleColumns = computed(() => state.table?.columns.slice(0, 5) ?? [])
const visibleRows = computed(() => state.table?.rows.slice(0, 12) ?? [])

function typeLabel(type: string) {
  return { number: '#', boolean: 'B', date: 'D', text: 'T' }[type] ?? 'T'
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col rounded-xl border border-white/[0.08] bg-ink-950/45">
    <div class="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
      <div class="flex items-center gap-2 text-[11px] font-semibold text-ink-50">
        <Table2 :size="13" class="text-primary" /> 数据预览
      </div>
      <button
        type="button"
        title="打开全量预览弹窗"
        class="flex items-center gap-1 rounded-md border border-white/[0.08] px-1.5 py-0.5 text-[9px] text-ink-400 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!state.table"
        @click="state.ui.dataPreviewOpen = true"
      >
        <Maximize2 :size="10" /> 全量
      </button>
    </div>

    <div v-if="!state.table" class="flex flex-1 items-center justify-center p-6 text-center">
      <div>
        <div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-ink-500">
          <Table2 :size="18" />
        </div>
        <p class="text-[11px] text-ink-400">导入文件后，这里会显示表头、字段类型与前 12 行数据。</p>
      </div>
    </div>

    <div v-else class="scrollbar-slim min-h-0 flex-1 overflow-auto">
      <table class="w-full border-collapse text-left font-mono text-[10px]">
        <thead class="sticky top-0 z-10 bg-ink-900/95 backdrop-blur">
          <tr>
            <th class="border-b border-white/10 px-2 py-2 text-ink-500">#</th>
            <th
              v-for="(column, index) in visibleColumns"
              :key="`${column}-${index}`"
              class="border-b border-white/10 px-2 py-2 font-sans text-[10px] font-medium text-ink-200"
            >
              <span class="block truncate" :title="column">{{ column }}</span>
              <span class="mt-0.5 inline-block rounded bg-primary/12 px-1 text-[8px] text-primary">
                {{ typeLabel(state.table.inferredTypes[index] ?? 'text') }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in visibleRows" :key="rowIndex" class="hover:bg-white/[0.03]">
            <td class="border-b border-white/[0.04] px-2 py-1.5 text-ink-600">{{ rowIndex + 1 }}</td>
            <td
              v-for="(cell, cellIndex) in visibleColumns.map((_, index) => row[index])"
              :key="cellIndex"
              class="max-w-[120px] truncate border-b border-white/[0.04] px-2 py-1.5 text-ink-200"
              :title="String(cell ?? '')"
            >
              {{ cell === null ? '—' : cell }}
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-3 py-2 text-center text-[9px] text-ink-500">
        仅预览前 12 行 · <button type="button" class="text-primary hover:underline" @click="state.ui.dataPreviewOpen = true">查看全部 {{ state.table.rowCount }} 行</button>
      </div>
    </div>
  </div>
</template>
