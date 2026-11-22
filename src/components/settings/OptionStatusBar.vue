<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Clock3, Crosshair } from 'lucide-vue-next'
import Badge from '@/components/ui/Badge.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { countSchemaFields } from '@/schema'
import { summarizeDatasetSize } from '@/utils/optionClone'

const { state } = useWorkspaceStore()
</script>

<template>
  <footer class="flex h-8 shrink-0 items-center gap-3 border-t border-white/[0.08] bg-ink-950/85 px-3 text-[10px] text-ink-500">
    <Badge :variant="state.ui.jsonError || state.ui.errorMessage ? 'danger' : 'success'">
      <CheckCircle2 v-if="!state.ui.jsonError && !state.ui.errorMessage" :size="10" />
      <AlertTriangle v-else :size="10" />
      {{ state.ui.jsonError || state.ui.errorMessage || '配置有效' }}
    </Badge>

    <span class="flex min-w-0 items-center gap-1">
      <Crosshair :size="10" />
      <code class="truncate text-ink-400">{{ state.ui.selectedPath || '未选择字段' }}</code>
    </span>

    <span class="ml-auto hidden truncate xl:inline">{{ summarizeDatasetSize(state.table) }}</span>
    <span>{{ countSchemaFields() }} 个 schema 字段</span>
    <span class="flex items-center gap-1">
      <Clock3 :size="10" />
      {{ state.project.meta.updatedAt ? new Date(state.project.meta.updatedAt).toLocaleTimeString('zh-CN') : '—' }}
    </span>
  </footer>
</template>
