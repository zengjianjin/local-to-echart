<script setup lang="ts">
import { Info } from 'lucide-vue-next'

defineProps<{ label: string; path?: string; description?: string }>()
</script>

<template>
  <div class="flex items-center gap-1.5">
    <label
      class="min-w-0 flex-1 truncate text-[11px] font-medium text-ink-200"
      :title="[path, description].filter(Boolean).join('\n')"
    >
      {{ label }}
    </label>
    <Info v-if="description" :size="11" class="shrink-0 text-ink-600" :title="description" />
  </div>
</template>
