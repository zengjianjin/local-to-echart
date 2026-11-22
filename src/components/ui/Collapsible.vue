<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '@/utils/cn'

const props = withDefaults(
  defineProps<{ title: string; open?: boolean; count?: number; description?: string }>(),
  { open: true },
)
const emit = defineEmits<{ (event: 'update:open', value: boolean): void }>()
const expanded = ref(props.open)

watch(
  () => props.open,
  (value) => {
    expanded.value = value
  },
)

function toggle() {
  expanded.value = !expanded.value
  emit('update:open', expanded.value)
}
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.025]">
    <button
      type="button"
      class="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-white/[0.04]"
      @click="toggle"
    >
      <ChevronDown
        :size="14"
        :class="cn('shrink-0 text-ink-500 transition-transform duration-200', !expanded && '-rotate-90')"
      />
      <span class="min-w-0 flex-1">
        <span class="block truncate text-[12px] font-semibold text-ink-50">{{ title }}</span>
        <span v-if="description" class="block truncate text-[10px] text-ink-500">{{ description }}</span>
      </span>
      <span
        v-if="typeof count === 'number'"
        class="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-400"
      >
        {{ count }}
      </span>
    </button>
    <div v-if="expanded" class="animate-fade-in border-t border-white/[0.06] px-3 py-3">
      <slot />
    </div>
  </section>
</template>
