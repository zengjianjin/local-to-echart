<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { FileSpreadsheet, X } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import { cancelSheetImport, confirmSheetImport, pendingWorkbook, selectedSheet } from '@/composables/useFileImport'

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && pendingWorkbook.value) cancelSheetImport()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="pendingWorkbook"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm"
      @click.self="cancelSheetImport"
    >
      <div class="w-full max-w-[520px] overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-panel">
        <div class="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <FileSpreadsheet :size="16" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-[13px] font-semibold text-ink-50">选择 Excel 工作表</div>
            <div class="truncate text-[10px] text-ink-500" :title="pendingWorkbook.fileName">
              {{ pendingWorkbook.fileName }} · 共 {{ pendingWorkbook.sheets.length }} 个工作表
            </div>
          </div>
          <Button size="icon" title="取消" @click="cancelSheetImport">
            <X :size="14" />
          </Button>
        </div>

        <div class="scrollbar-slim max-h-[52vh] space-y-1.5 overflow-auto p-3">
          <button
            v-for="sheet in pendingWorkbook.sheets"
            :key="sheet.name"
            type="button"
            :class="
              selectedSheet === sheet.name
                ? 'border-primary/50 bg-primary/10'
                : 'border-white/[0.08] bg-white/[0.025] hover:border-white/20'
            "
            class="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors"
            @click="selectedSheet = sheet.name"
            @dblclick="confirmSheetImport"
          >
            <span
              :class="selectedSheet === sheet.name ? 'border-primary bg-primary' : 'border-white/20'"
              class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
            >
              <span v-if="selectedSheet === sheet.name" class="h-1.5 w-1.5 rounded-full bg-pure" />
            </span>
            <span class="min-w-0 flex-1 truncate text-[12px] text-ink-50">{{ sheet.name }}</span>
            <span class="shrink-0 font-mono text-[10px] text-ink-500">{{ sheet.rowCount }} 行</span>
          </button>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-white/[0.08] px-4 py-3">
          <span class="mr-auto text-[10px] text-ink-500">双击工作表可直接载入，Esc 取消</span>
          <Button size="sm" variant="soft" @click="cancelSheetImport">取消</Button>
          <Button size="sm" variant="primary" @click="confirmSheetImport">载入工作表</Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
