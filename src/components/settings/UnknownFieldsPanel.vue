<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { Braces, Save } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import { knownRootKeys } from '@/schema'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { stringifyOption } from '@/utils/optionValidator'
import { logError } from '@/utils/logger'
import type { SerializableNode } from '@/types'

const { t } = useI18n()
const { state, setOptionValueAt } = useWorkspaceStore()
const drafts = reactive<Record<string, string>>({})

const unknownKeys = computed(() => {
  const known = knownRootKeys()
  return Object.keys(state.project.option).filter((key) => !known.has(key))
})

function preview(key: string) {
  return stringifyOption({ [key]: state.project.option[key] }).slice(0, 320)
}

function draftFor(key: string) {
  if (!drafts[key]) drafts[key] = preview(key)
  return drafts[key]
}

function save(key: string) {
  try {
    const parsed = JSON.parse(drafts[key]) as Record<string, SerializableNode>
    setOptionValueAt(key, parsed[key] ?? null)
  } catch (error) {
    state.ui.errorMessage = logError('unknownFields', error)
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-[11px] font-semibold text-ink-100">
        <Braces :size="13" class="text-primary" /> {{ t('settings.unknownTitle') }}
      </div>
      <Badge :variant="unknownKeys.length ? 'warning' : 'neutral'">{{ t('settings.unknownCount', { count: unknownKeys.length }) }}</Badge>
    </div>

    <div v-if="!unknownKeys.length" class="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-6 text-center">
      <p class="text-[11px] leading-relaxed text-ink-400">
        {{ t('settings.unknownEmpty') }}
      </p>
    </div>

    <div v-for="key in unknownKeys" :key="key" class="space-y-2 rounded-xl border border-amber-300/15 bg-amber-400/[0.04] p-3">
      <div class="flex items-center justify-between">
        <code class="text-[11px] font-medium text-amber-800 dark:text-amber-100">{{ key }}</code>
        <Badge variant="warning">{{ t('settings.unknownBadge') }}</Badge>
      </div>
      <textarea
        v-model="drafts[key]"
        rows="6"
        spellcheck="false"
        class="field-shell w-full resize-y font-mono text-[10px] leading-relaxed"
        :aria-label="t('settings.unknownEdit', { key })"
      />
      <div class="flex justify-end">
        <Button size="sm" variant="soft" @click="save(key)">
          <Save :size="12" /> {{ t('common.save') }}
        </Button>
      </div>
    </div>
  </div>
</template>
