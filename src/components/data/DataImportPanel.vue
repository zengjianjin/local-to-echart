<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ClipboardPaste, FileSpreadsheet, UploadCloud, Sparkles, AlertCircle, Loader2 } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Tooltip from '@/components/ui/Tooltip.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useFileImport } from '@/composables/useFileImport'
import { FILE_ACCEPT } from '@/utils/fileParse'
import DataTablePreview from './DataTablePreview.vue'
import DatasetActions from './DatasetActions.vue'

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const { t } = useI18n()
const { state } = useWorkspaceStore()
const { isDragging, onFileChange, onDrop, pasteFromClipboard, loadDemo, headerRow, setHeaderRow } = useFileImport()

function onHeaderRowChange(event: Event) {
  setHeaderRow(Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <aside class="flex min-w-0 w-[clamp(220px,20vw,286px)] shrink-0 flex-col gap-3 border-r border-white/[0.08] bg-ink-900/45 p-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <FileSpreadsheet :size="14" />
        </div>
        <div>
          <div class="text-[12px] font-semibold text-ink-50">{{ t('data.source') }}</div>
          <div class="text-[9px] text-ink-500">{{ t('data.formatSummary') }}</div>
        </div>
      </div>
      <Badge :variant="state.table ? 'success' : 'neutral'">
        {{ state.table ? t('data.loaded') : t('data.waiting') }}
      </Badge>
    </div>

    <input ref="fileInput" type="file" :accept="FILE_ACCEPT" class="hidden" @change="onFileChange" />

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
            {{ state.ui.isImporting ? t('data.parsing') : t('data.dropHere') }}
          </div>
          <div class="mt-1 text-[10px] leading-relaxed text-ink-500">{{ t('data.dropDescription') }}</div>
        </div>
      </div>
    </button>

    <div class="flex flex-col gap-2">
      <Button size="sm" variant="soft" class="w-full" :title="t('data.chooseFileTitle')" @click="fileInput?.click()">
        <UploadCloud :size="12" /> {{ t('data.chooseFile') }}
      </Button>
      <div class="grid grid-cols-2 gap-2">
        <Button size="sm" class="w-full" :title="t('data.pasteTitle')" @click="pasteFromClipboard">
          <ClipboardPaste :size="12" /> {{ t('data.paste') }}
        </Button>
        <Button size="sm" class="w-full" :title="t('data.demoTitle')" @click="loadDemo">
          <Sparkles :size="12" /> {{ t('data.demoData') }}
        </Button>
      </div>
    </div>

    <div class="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-2">
      <span class="shrink-0 text-[10px] text-ink-500">{{ t('data.headerRow') }}</span>
      <input
        type="number"
        min="1"
        max="20"
        :value="headerRow"
        class="h-6 w-12 rounded border border-white/10 bg-ink-950/60 px-1 text-center text-[11px] text-ink-100 outline-none focus:border-primary/50"
        @change="onHeaderRowChange"
      />
      <span class="text-[9px] leading-tight text-ink-500">{{ t('data.headerRowHint') }}</span>
    </div>

    <div
      v-if="state.ui.errorMessage"
      class="flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-500/10 px-2.5 py-2 text-[10px] text-rose-700 dark:text-rose-200"
    >
      <Tooltip :text="state.ui.errorMessage" side="top">
        <button type="button" :aria-label="t('common.viewDetails')" class="mt-0.5 shrink-0 rounded text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50">
          <AlertCircle :size="12" />
        </button>
      </Tooltip>
      <span class="break-all">{{ state.ui.errorMessage }}</span>
    </div>

    <DatasetActions />
    <DataTablePreview />
  </aside>
</template>
