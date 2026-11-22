<script setup lang="ts">
import { cn } from '@/utils/cn'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    placeholder?: string
    type?: string
    min?: number | string
    max?: number | string
    step?: number | string
    disabled?: boolean
    class?: string
  }>(),
  { type: 'text', disabled: false },
)

const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()

function onChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <input
    v-bind="$attrs"
    :type="props.type"
    :value="props.modelValue"
    :placeholder="props.placeholder"
    :min="props.min"
    :max="props.max"
    :step="props.step"
    :disabled="props.disabled"
    :class="cn('field-shell w-full', props.class)"
    @input="onChange"
  />
</template>
