<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Info } from 'lucide-vue-next'
import Select from '@/components/ui/Select.vue'
import Tooltip from '@/components/ui/Tooltip.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

const { t } = useI18n()
const { state, currentXFields, setXFieldAt } = useWorkspaceStore()

const columnOptions = computed(() => (
  state.table?.columns.map((column, index) => ({ label: column, value: index })) ?? []
))
const xFields = computed(() => currentXFields())
</script>

<template>
  <div class="mb-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-2.5">
    <div class="mb-2 flex items-center justify-between">
      <span class="text-[10px] font-semibold text-ink-200">{{ t('settings.axisMapperTitle') }}</span>
      <Tooltip :text="t('settings.axisMapperTooltip')">
        <button type="button" :aria-label="t('settings.axisMapperAria')" class="rounded p-0.5 text-ink-600 transition hover:text-ink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          <Info :size="11" />
        </button>
      </Tooltip>
      <span class="text-[9px] text-ink-500">{{ t('settings.axisMapperHeading') }}</span>
    </div>
    <template v-if="xFields.length">
      <div v-for="(field, index) in xFields" :key="index" class="mb-1.5 last:mb-0">
        <label class="mb-1 block text-[9px] text-ink-500">{{ t('settings.axisLabel', { index: index + 1 }) }}</label>
        <Select
          :model-value="field"
          :options="columnOptions"
          @update:model-value="(value) => setXFieldAt(index, Number(value))"
        />
      </div>
      <p v-if="!state.table" class="mt-1 text-[9px] text-ink-600">{{ t('settings.axisEmpty') }}</p>
      <p v-else class="mt-1.5 text-[9px] leading-relaxed text-ink-600">
        {{ t('settings.axisHint') }}
      </p>
    </template>
    <p v-else class="rounded-md border border-dashed border-white/10 px-2 py-3 text-center text-[9px] text-ink-600">
      {{ t('settings.axisNoAxis') }}
    </p>
  </div>
</template>
