<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Info } from 'lucide-vue-next'
import Tooltip from './Tooltip.vue'

defineProps<{ label: string; path?: string; description?: string; help?: string }>()
const { t } = useI18n()
</script>

<template>
  <div class="flex items-center gap-1.5">
    <label
      class="min-w-0 flex-1 truncate text-[11px] font-medium text-ink-200"
      :title="path ? t('settings.pathTitle', { path }) : undefined"
    >
      {{ label }}
    </label>
    <Tooltip
      v-if="help"
      :text="[help, path ? t('settings.pathTitle', { path }) : ''].filter(Boolean).join('\n')"
    >
      <button
        type="button"
        :aria-label="t('settings.viewHelp')"
        class="shrink-0 rounded p-0.5 text-ink-600 transition hover:bg-white/5 hover:text-ink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Info :size="11" />
      </button>
    </Tooltip>
  </div>
</template>
