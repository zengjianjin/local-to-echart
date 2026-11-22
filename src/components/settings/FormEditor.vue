<script setup lang="ts">
import type { SchemaSection } from '@/types'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import FieldControl from './FieldControl.vue'

defineProps<{ section: SchemaSection }>()
const { state } = useWorkspaceStore()
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <div class="text-[12px] font-semibold text-ink-50">{{ section.label }}</div>
        <div class="mt-0.5 line-clamp-2 text-[9px] leading-relaxed text-ink-500" :title="section.description">
          {{ section.description }}
        </div>
      </div>
      <span class="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-ink-500">
        {{ section.fields.length }}
      </span>
    </div>

    <div v-if="!section.fields.length" class="rounded-lg border border-dashed border-white/10 px-3 py-5 text-center text-[10px] text-ink-500">
      没有匹配的字段，试试其他关键词或切换到 JSON 模式。
    </div>

    <div :class="state.ui.rightExpanded ? 'grid grid-cols-2 gap-2' : 'space-y-2'">
      <div
        v-for="field in section.fields"
        :key="field.path"
        class="rounded-lg border border-white/[0.07] bg-white/[0.025] p-2.5"
      >
        <FieldControl :field="field" />
      </div>
    </div>
  </div>
</template>
