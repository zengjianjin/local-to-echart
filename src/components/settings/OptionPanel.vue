<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Maximize2, Minimize2, PanelRightClose, RotateCcw, Search, SlidersHorizontal } from 'lucide-vue-next'
import Tabs from '@/components/ui/Tabs.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import ScrollArea from '@/components/ui/ScrollArea.vue'
import { filterSections } from '@/schema'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useOptionEditor } from '@/composables/useOptionEditor'
import { cn } from '@/utils/cn'
import FormEditor from './FormEditor.vue'
import XAxisFieldMapper from './XAxisFieldMapper.vue'
import SeriesGroupsEditor from './SeriesGroupsEditor.vue'
import JsonEditor from './JsonEditor.vue'
import SectionNav from './SectionNav.vue'
import UnknownFieldsPanel from './UnknownFieldsPanel.vue'
import OptionStatusBar from './OptionStatusBar.vue'

const emit = defineEmits<{ (event: 'toggle'): void }>()
const { t } = useI18n()
const { state } = useWorkspaceStore()
const { resetAll } = useOptionEditor()

const sections = computed(() => filterSections(state.ui.search))
const activeSection = computed(() => sections.value.find((section) => section.id === state.ui.activeSection) ?? sections.value[0])
const panelWidthClass = computed(() => (
  state.ui.editorMode === 'json'
    ? (state.ui.rightExpanded ? 'w-[clamp(480px,46vw,720px)]' : 'w-[clamp(420px,36vw,560px)]')
    : (state.ui.rightExpanded ? 'w-[clamp(360px,36vw,560px)]' : 'w-[clamp(320px,28vw,420px)]')
))

const quickSections = computed(() => [
  { id: 'title', label: t('settings.quickTitle') },
  { id: 'legend', label: t('settings.quickLegend') },
  { id: 'grid', label: t('settings.quickGrid') },
  { id: 'xAxis', label: t('settings.quickXAxis') },
  { id: 'series', label: t('settings.quickSeries') },
])

function jumpTo(id: string) {
  state.ui.search = ''
  state.ui.activeSection = id
}

watch(sections, (value) => {
  if (!value.some((section) => section.id === state.ui.activeSection)) {
    state.ui.activeSection = value[0]?.id ?? 'global'
  }
})
</script>

<template>
  <aside
    :class="
      cn(
        'flex min-w-0 shrink-0 flex-col border-l border-white/[0.08] bg-ink-900/55 transition-[width] duration-200',
        panelWidthClass,
        state.ui.rightCollapsed && 'w-0 overflow-hidden border-l-0',
      )
    "
  >
    <template v-if="!state.ui.rightCollapsed">
      <header class="shrink-0 border-b border-white/[0.08] px-3 py-2.5">
        <div class="mb-2 flex items-center gap-2">
          <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-500">
            <SlidersHorizontal :size="14" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-[12px] font-semibold text-ink-50">{{ t('settings.settingsTitle') }}</div>
            <div class="truncate text-[9px] text-ink-500">{{ t('settings.editorTitle') }}</div>
          </div>
          <Button size="icon" :title="state.ui.rightExpanded ? t('settings.narrowPanel') : t('settings.widenPanel')" @click="state.ui.rightExpanded = !state.ui.rightExpanded">
            <Minimize2 v-if="state.ui.rightExpanded" :size="13" />
            <Maximize2 v-else :size="13" />
          </Button>
          <span class="mx-0.5 h-5 w-px bg-white/10" />
          <Button size="icon" :title="t('settings.collapseRightPanel')" @click="emit('toggle')">
            <PanelRightClose :size="13" />
          </Button>
        </div>

        <div class="flex items-center gap-2">
          <Tabs
            :model-value="state.ui.editorMode"
            :options="[{ label: t('settings.formMode'), value: 'form' }, { label: t('settings.jsonMode'), value: 'json' }]"
            @update:model-value="state.ui.editorMode = $event as 'form' | 'json'"
          />
          <Button size="icon" :title="t('common.restoreDefault')" @click="resetAll">
            <RotateCcw :size="12" />
          </Button>
        </div>

        <div v-if="state.ui.editorMode === 'form'" class="relative mt-2">
          <Search :size="12" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
          <Input v-model="state.ui.search" class="pl-7" :placeholder="t('settings.searchPlaceholder')" />
        </div>
      </header>

      <div v-if="state.ui.editorMode === 'form'" class="flex shrink-0 flex-wrap items-center gap-1 border-b border-white/[0.06] px-3 py-1.5">
        <span class="mr-0.5 text-[9px] text-ink-600">{{ t('settings.quick') }}</span>
        <button
          v-for="item in quickSections"
          :key="item.id"
          type="button"
          :class="
            cn(
              'rounded-md border px-1.5 py-0.5 text-[10px] leading-4 transition-colors',
              activeSection?.id === item.id
                ? 'border-primary/40 bg-primary/15 text-primary-100'
                : 'border-white/[0.08] bg-white/[0.025] text-ink-400 hover:border-white/20 hover:text-ink-100',
            )
          "
          @click="jumpTo(item.id)"
        >
          {{ item.label }}
        </button>
      </div>

      <div v-if="state.ui.editorMode === 'form'" class="shrink-0 border-b border-white/[0.06] px-3 py-2">
        <SectionNav
          :sections="sections"
          :active="activeSection?.id ?? 'global'"
          @select="state.ui.activeSection = $event"
        />
      </div>

      <div :class="state.ui.editorMode === 'json' ? 'min-h-0 flex-1 p-2' : 'min-h-0 flex-1 p-3'">
        <ScrollArea v-if="state.ui.editorMode === 'form'">
          <XAxisFieldMapper v-if="activeSection?.id === 'xAxis'" />
          <SeriesGroupsEditor v-if="activeSection?.id === 'series'" />
          <FormEditor v-if="activeSection && activeSection.id !== 'unknown'" :section="activeSection" />
          <UnknownFieldsPanel v-else />
        </ScrollArea>
        <JsonEditor v-else />
      </div>

      <OptionStatusBar />
    </template>
  </aside>
</template>
