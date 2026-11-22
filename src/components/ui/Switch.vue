<script setup lang="ts">
import { cn } from '@/utils/cn'

const props = withDefaults(defineProps<{ modelValue: boolean; disabled?: boolean; indeterminate?: boolean }>(), {
  disabled: false,
  indeterminate: false,
})
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>()

function onClick() {
  emit('update:modelValue', props.indeterminate ? false : !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="props.indeterminate ? 'mixed' : props.modelValue"
    :data-state="props.indeterminate ? 'indeterminate' : props.modelValue ? 'checked' : 'unchecked'"
    :disabled="props.disabled"
    :class="
      cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        props.indeterminate
          ? 'cursor-pointer border-dashed border-white/40 bg-slate-600/80'
          : props.modelValue
            ? 'cursor-pointer border-primary bg-primary shadow-[0_0_12px_rgba(79,140,255,0.25)]'
            : 'cursor-pointer border-white/20 bg-slate-700',
        props.disabled && 'cursor-not-allowed opacity-45',
      )
    "
    @click="onClick"
  >
    <span
      :class="
        cn(
          'pointer-events-none absolute left-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150',
          props.indeterminate ? 'translate-x-2 opacity-70' : props.modelValue ? 'translate-x-4' : 'translate-x-0',
        )
      "
    />
  </button>
</template>
