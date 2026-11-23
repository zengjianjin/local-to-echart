<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Database } from 'lucide-vue-next'
import Badge from '@/components/ui/Badge.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { summarizeDatasetSize } from '@/utils/optionClone'

const { state } = useWorkspaceStore()
</script>

<template>
  <footer class="flex h-8 shrink-0 items-center gap-2 overflow-hidden whitespace-nowrap border-t border-white/[0.08] bg-ink-950/85 px-3 text-[10px] text-ink-500">
    <span title="当前 option 的校验状态；出现错误时会显示错误原因">
      <Badge :variant="state.ui.jsonError || state.ui.errorMessage ? 'danger' : 'success'">
        <CheckCircle2 v-if="!state.ui.jsonError && !state.ui.errorMessage" :size="10" />
        <AlertTriangle v-else :size="10" />
        {{ state.ui.jsonError || state.ui.errorMessage || '配置有效' }}
      </Badge>
    </span>

    <span class="ml-auto flex shrink-0 items-center gap-1" title="当前导入表格的规模">
      <Database :size="10" />
      {{ summarizeDatasetSize(state.table) }}
    </span>
  </footer>
</template>
