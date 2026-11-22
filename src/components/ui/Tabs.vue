<script setup lang="ts">
import { cn } from '@/utils/cn'

const props = defineProps<{
  modelValue: string
  options: Array<{ label: string; value: string }>
}>()
const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()
</script>

<template>
  <div class="inline-flex rounded-lg border border-white/10 bg-ink-950/60 p-0.5">
    <button
      v-for="option in props.options"
      :key="option.value"
      type="button"
      :class="
        cn(
          'rounded-md px-2.5 py-1 text-[11px] font-medium transition-all',
          props.modelValue === option.value
            ? 'bg-gradient-to-r from-primary/90 to-violet-500/90 text-pure shadow-sm'
            : 'text-ink-400 hover:text-ink-100',
        )
      "
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
