<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Search, Table2, X } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { summarizeDatasetSize } from '@/utils/optionClone'

const { state } = useWorkspaceStore()
const query = ref('')
const renderLimit = ref(500)
const scroller = ref<HTMLDivElement | null>(null)

const columns = computed(() => state.table?.columns ?? [])
const rows = computed(() => state.table?.rows ?? [])
const filteredRows = computed(() => {
  const text = query.value.trim().toLowerCase()
  if (!text) return rows.value
  return rows.value.filter((row) => row.some((cell) => String(cell ?? '').toLowerCase().includes(text)))
})
const visibleRows = computed(() => filteredRows.value.slice(0, renderLimit.value))

watch([query, () => state.ui.dataPreviewOpen], () => {
  renderLimit.value = 500
})

function typeLabel(type: string) {
  return { number: '#', boolean: 'B', date: 'D', text: 'T' }[type] ?? 'T'
}

function onScroll() {
  const element = scroller.value
  if (!element) return
  if (element.scrollTop + element.clientHeight >= element.scrollHeight - 240) {
    renderLimit.value = Math.min(renderLimit.value + 500, filteredRows.value.length)
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && state.ui.dataPreviewOpen) state.ui.dataPreviewOpen = false
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="state.ui.dataPreviewOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm"
      @click.self="state.ui.dataPreviewOpen = false"
    >
      <div class="flex h-[88vh] w-[95vw] max-w-[1680px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-panel">
        <div class="flex shrink-0 items-center gap-3 border-b border-white/[0.08] px-4 py-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Table2 :size="16" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-[13px] font-semibold text-ink-50">数据全量预览</div>
            <div class="truncate text-[10px] text-ink-500">
              {{ state.table?.name ?? '未导入数据' }} · {{ summarizeDatasetSize(state.table) }}
            </div>
          </div>
          <div class="relative w-[260px]">
            <Search :size="12" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <Input v-model="query" class="pl-7" placeholder="搜索任意单元格" />
          </div>
          <Button size="icon" title="关闭 (Esc)" @click="state.ui.dataPreviewOpen = false">
            <X :size="14" />
          </Button>
        </div>

        <div v-if="!state.table" class="flex flex-1 items-center justify-center text-[11px] text-ink-500">
          请先导入表格数据。
        </div>

        <template v-else>
          <div ref="scroller" class="scrollbar-slim min-h-0 flex-1 overflow-auto" @scroll="onScroll">
            <table class="w-full min-w-max border-collapse text-left font-mono text-[11px]">
              <thead class="sticky top-0 z-10 bg-ink-900/95 backdrop-blur">
                <tr>
                  <th class="sticky left-0 z-20 border-b border-r border-white/10 bg-ink-900/95 px-3 py-2 text-ink-500">#</th>
                  <th
                    v-for="(column, index) in columns"
                    :key="`${column}-${index}`"
                    class="whitespace-nowrap border-b border-r border-white/[0.06] px-3 py-2 font-sans text-[11px] font-medium text-ink-200"
                  >
                    <span>{{ column }}</span>
                    <span class="ml-1.5 inline-block rounded bg-primary/12 px-1 text-[8px] text-primary">
                      {{ typeLabel(state.table.inferredTypes[index] ?? 'text') }}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in visibleRows" :key="rowIndex" class="hover:bg-white/[0.03]">
                  <td class="sticky left-0 z-10 border-b border-r border-white/[0.06] bg-ink-900 px-3 py-1.5 text-ink-600">
                    {{ rowIndex + 1 }}
                  </td>
                  <td
                    v-for="(cell, cellIndex) in columns.map((_, index) => row[index])"
                    :key="cellIndex"
                    class="max-w-[280px] whitespace-nowrap border-b border-r border-white/[0.04] px-3 py-1.5 text-ink-200"
                    :title="String(cell ?? '')"
                  >
                    {{ cell === null ? '—' : cell }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="visibleRows.length < filteredRows.length" class="px-4 py-3 text-center text-[10px] text-ink-500">
              继续向下滚动以加载更多（已显示 {{ visibleRows.length }} / {{ filteredRows.length }} 行）
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-3 border-t border-white/[0.08] px-4 py-2 text-[10px] text-ink-500">
            <span>显示 {{ visibleRows.length }} / {{ filteredRows.length }} 行</span>
            <span class="h-3 w-px bg-white/10" />
            <span>{{ columns.length }} 列</span>
            <span class="ml-auto">Esc 或点击空白处关闭</span>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>
