<script setup lang="ts">
import { computed } from 'vue'
import type { SchemaSection } from '@/types'
import { cn } from '@/utils/cn'

const props = defineProps<{ sections: SchemaSection[]; active: string }>()
const emit = defineEmits<{ (event: 'select', value: string): void }>()

const groups = [
  { label: '基础', ids: ['global', 'data', 'title', 'legend', 'tooltip'] },
  { label: '布局', ids: ['grid', 'xAxis', 'yAxis', 'otherAxes', 'axisPointer', 'toolbox'] },
  { label: '系列', ids: ['series'] },
  { label: '扩展', ids: ['dataZoom', 'visualMap', 'graphic', 'geo', 'timeline', 'brush', 'unknown'] },
]

const visibleGroups = computed(() =>
  groups
    .map((group) => ({
      label: group.label,
      sections: group.ids
        .map((id) => props.sections.find((section) => section.id === id))
        .filter((section): section is SchemaSection => Boolean(section)),
    }))
    .filter((group) => group.sections.length > 0),
)
</script>

<template>
  <div class="space-y-1">
    <div v-for="group in visibleGroups" :key="group.label" class="flex items-start gap-2">
      <span class="w-7 shrink-0 pt-1 text-[9px] leading-4 text-ink-600">{{ group.label }}</span>
      <div class="flex min-w-0 flex-wrap gap-1">
        <button
          v-for="section in group.sections"
          :key="section.id"
          type="button"
          :class="
            cn(
              'rounded-md border px-2 py-0.5 text-[10px] leading-4 font-medium transition-colors',
              active === section.id
                ? 'border-primary/40 bg-primary/15 text-primary-100'
                : 'border-white/[0.08] bg-white/[0.025] text-ink-400 hover:border-white/20 hover:text-ink-100',
            )
          "
          @click="emit('select', section.id)"
        >
          {{ section.label }}
        </button>
      </div>
    </div>
  </div>
</template>
