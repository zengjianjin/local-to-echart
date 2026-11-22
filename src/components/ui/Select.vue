<script setup lang="ts">
import { cn } from '@/utils/cn'

const props = defineProps<{
  modelValue?: string | number
  options: Array<{ label: string; value: string | number }>
  placeholder?: string
  disabled?: boolean
  class?: string
}>()

const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <select
    :value="props.modelValue"
    :disabled="props.disabled"
    :class="cn('field-shell w-full cursor-pointer appearance-none pr-7', props.class)"
    @change="onChange"
  >
    <option v-if="props.placeholder" value="" disabled>{{ props.placeholder }}</option>
    <option v-for="option in props.options" :key="String(option.value)" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>
