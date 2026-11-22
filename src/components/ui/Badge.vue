<script setup lang="ts">
import { cn } from '@/utils/cn'

const props = withDefaults(
  defineProps<{ variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' }>(),
  { variant: 'neutral' },
)

const variants = {
  neutral: 'border-white/10 bg-white/5 text-ink-200',
  primary: 'border-primary/25 bg-primary/12 text-primary-100',
  success: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200',
  warning: 'border-amber-400/25 bg-amber-400/10 text-amber-700 dark:text-amber-200',
  danger: 'border-rose-400/25 bg-rose-400/10 text-rose-700 dark:text-rose-200',
}
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
        variants[props.variant],
      )
    "
  >
    <slot />
  </span>
</template>
