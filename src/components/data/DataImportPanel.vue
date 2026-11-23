<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { FileSpreadsheet, UploadCloud, Sparkles, AlertCircle, Loader2 } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useFileImport } from '@/composables/useFileImport'
import DataTablePreview from './DataTablePreview.vue'
import DatasetActions from './DatasetActions.vue'

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const { state } = useWorkspaceStore()
const { isDragging, onFileChange, onDrop, loadDemo, headerRow, setHeaderRow } = useFileImport()

function onHeaderRowChange(event: Event) {
  setHeaderRow(Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <aside class="flex w-[286px] shrink-0 flex-col gap-3 border-r border-white/[0.08] bg-ink-900/45 p-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <FileSpreadsheet :size="14" />
        </div>
        <div>
          <div class="text-[12px] font-semibold text-ink-50">数据源</div>
          <div class="text-[9px] text-ink-500">CSV / TSV / Excel</div>
        </div>
      </div>
      <Badge :variant="state.table ? 'success' : 'neutral'">
        {{ state.table ? '已载入' : '等待导入' }}
      </Badge>
    </div>

    <input ref="fileInput" type="file" accept=".csv,.tsv,.txt,.xlsx,.xlsm,.xls" class="hidden" @change="onFileChange" />

    <button
      type="button"
      class="group relative overflow-hidden rounded-xl border border-dashed p-4 text-left transition-all duration-200"
      :class="
        isDragging
          ? 'border-primary/70 bg-primary/10 shadow-glow'
          : 'border-white/12 bg-white/[0.025] hover:border-primary/40 hover:bg-primary/[0.06]'
      "
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
    >
      <div class="absolute inset-0 bg-panel-glow opacity-60" />
      <div class="relative flex items-start gap-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-ink-950/70 text-primary">
          <Loader2 v-if="state.ui.isImporting" :size="17" class="animate-spin" />
          <UploadCloud v-else :size="17" />
        </div>
        <div>
          <div class="text-[11px] font-medium text-ink-100">
            {{ state.ui.isImporting ? '正在解析文件…' : '拖放文件到这里' }}
          </div>
          <div class="mt-1 text-[10px] leading-relaxed text-ink-500">或点击选择本地表格文件，数据仅在浏览器内处理。</div>
        </div>
      </div>
    </button>

    <div class="flex gap-2">
      <Button size="sm" variant="soft" class="flex-1" @click="fileInput?.click()">
        <UploadCloud :size="12" /> 选择文件
      </Button>
      <Button size="sm" class="flex-1" @click="loadDemo">
        <Sparkles :size="12" /> 示例数据
      </Button>
    </div>

    <div class="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-2">
      <span class="shrink-0 text-[10px] text-ink-500">Excel 表头行</span>
      <input
        type="number"
        min="1"
        max="20"
        :value="headerRow"
        class="h-6 w-12 rounded border border-white/10 bg-ink-950/60 px-1 text-center text-[11px] text-ink-100 outline-none focus:border-primary/50"
        @change="onHeaderRowChange"
      />
      <span class="text-[9px] leading-tight text-ink-500">两行表头填 2，改完立即重新解析</span>
    </div>

    <div
      v-if="state.ui.errorMessage"
      class="flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-500/10 px-2.5 py-2 text-[10px] text-rose-700 dark:text-rose-200"
    >
      <AlertCircle :size="12" class="mt-0.5 shrink-0" />
      <span class="break-all">{{ state.ui.errorMessage }}</span>
    </div>

    <DatasetActions />
    <DataTablePreview />
  </aside>
</template>
