<script setup lang="ts">
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-[12px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-primary to-violet-500 text-pure shadow-[0_8px_24px_-12px_rgba(79,140,255,0.9)] hover:brightness-110 active:scale-[0.98]',
        ghost: 'border border-white/10 bg-white/[0.04] text-ink-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-ink-50',
        soft: 'bg-primary/12 text-primary-100 hover:bg-primary/20',
        danger: 'border border-rose-400/25 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-200',
      },
      size: {
        sm: 'h-7 px-2.5',
        md: 'h-8 px-3',
        icon: 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  },
)

type Props = {
  variant?: 'primary' | 'ghost' | 'soft' | 'danger'
  size?: 'sm' | 'md' | 'icon'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'ghost',
  size: 'md',
  disabled: false,
})
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    :class="cn(buttonVariants({ variant: props.variant, size: props.size }))"
    :aria-disabled="props.disabled"
  >
    <slot />
  </button>
</template>
