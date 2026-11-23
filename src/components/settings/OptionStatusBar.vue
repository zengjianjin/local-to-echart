<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertTriangle, CheckCircle2, Database } from 'lucide-vue-next'
import Badge from '@/components/ui/Badge.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { summarizeDatasetSize } from '@/utils/optionClone'

const { t } = useI18n()
const { state } = useWorkspaceStore()
</script>

<template>
  <footer class="flex h-8 shrink-0 items-center gap-2 overflow-hidden whitespace-nowrap border-t border-white/[0.08] bg-ink-950/85 px-3 text-[10px] text-ink-500">
    <span :title="t('settings.validationTitle')">
      <Badge :variant="state.ui.jsonError || state.ui.errorMessage ? 'danger' : 'success'">
        <CheckCircle2 v-if="!state.ui.jsonError && !state.ui.errorMessage" :size="10" />
        <AlertTriangle v-else :size="10" />
        {{ state.ui.jsonError || state.ui.errorMessage || t('settings.valid') }}
      </Badge>
    </span>

    <span class="ml-auto flex shrink-0 items-center gap-1" :title="t('settings.datasetTitle')">
      <Database :size="10" />
      {{ summarizeDatasetSize(state.table) }}
    </span>
  </footer>
</template>
