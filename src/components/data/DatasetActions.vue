<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RefreshCw, Trash2, DatabaseZap } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { summarizeDatasetSize } from '@/utils/optionClone'

const { t } = useI18n()
const { state, applyTable, setOptionValueAt, syncXFieldYAxes } = useWorkspaceStore()

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
        <DatabaseZap :size="13" class="text-primary" /> {{ t('data.datasetNode') }}
      </div>
      <Badge :variant="state.table ? 'success' : 'neutral'">
        {{ state.table ? t('data.bound') : t('data.unbound') }}
      </Badge>
    </div>

    <div class="rounded-lg bg-ink-950/60 px-3 py-2 font-mono text-[10px] text-ink-400">
      dataset[0].source
    </div>
    <div class="mt-2 text-[10px] text-ink-500">{{ summarizeDatasetSize(state.table) }}</div>

    <div class="mt-3 flex gap-2">
      <Button size="sm" class="flex-1" :disabled="!state.table" @click="reapply">
        <RefreshCw :size="12" /> {{ t('data.regenerate') }}
      </Button>
      <Button size="sm" variant="danger" :disabled="!state.table" @click="clearDataset">
        <Trash2 :size="12" /> {{ t('common.clear') }}
      </Button>
    </div>
  </div>
</template>
