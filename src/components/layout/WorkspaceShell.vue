<script setup lang="ts">
import { computed } from 'vue'
import { Languages, Database, Moon, PanelLeftClose, PanelLeftOpen, SlidersHorizontal, Sun, UploadCloud } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/Button.vue'
import DataImportPanel from '@/components/data/DataImportPanel.vue'
import DataPreviewDialog from '@/components/data/DataPreviewDialog.vue'
import SheetPickerDialog from '@/components/data/SheetPickerDialog.vue'
import ChartCanvas from '@/components/chart/ChartCanvas.vue'
import ChartToolbar from '@/components/chart/ChartToolbar.vue'
import OptionPanel from '@/components/settings/OptionPanel.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { isDragging, onDrop } from '@/composables/useFileImport'
import type { Locale } from '@/i18n/types'

const { state, toggleTheme, setLocale } = useWorkspaceStore()
const { t } = useI18n()

const localeOrder: Locale[] = ['zh-CN', 'zh-TW', 'en-US']
const localeLabels: Record<Locale, string> = {
  'zh-CN': '简体',
  'zh-TW': '繁體',
  'en-US': 'EN',
}
const currentLocaleLabel = computed(() => localeLabels[state.ui.locale])
const nextLocale = computed(() => localeOrder[(localeOrder.indexOf(state.ui.locale) + 1) % localeOrder.length])

function toggleLocale() {
  setLocale(nextLocale.value)
}

function onChartDragLeave(event: globalThis.DragEvent) {
  const next = event.relatedTarget as Node | null
  const section = (event.currentTarget as HTMLElement)
  if (next && section.contains(next)) return
  isDragging.value = false
}
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <header class="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.08] bg-ink-950/80 px-4 backdrop-blur-xl">
      <Button class="shrink-0" size="icon" :title="state.ui.leftCollapsed ? t('workspace.expandDataPanel') : t('workspace.collapseDataPanel')" @click="state.ui.leftCollapsed = !state.ui.leftCollapsed">
        <PanelLeftOpen v-if="state.ui.leftCollapsed" :size="14" />
        <PanelLeftClose v-else :size="14" />
      </Button>

      <img src="/favicon.svg" alt="" class="h-8 w-8 shrink-0 rounded-xl shadow-glow" />
      <div class="min-w-0 shrink-0">
        <div class="truncate text-[13px] font-semibold tracking-tight text-ink-50">{{ t('common.appName') }}</div>
        <div class="hidden text-[9px] text-ink-500 xl:block">{{ t('workspace.tagline') }}</div>
      </div>

      <div class="mx-1 hidden h-7 w-px shrink-0 bg-white/10 lg:block" />

      <div class="hidden min-w-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 lg:flex">
        <Database :size="12" class="shrink-0 text-primary" />
        <span class="max-w-[160px] truncate text-[11px] text-ink-200 2xl:max-w-[240px]">{{ state.project.meta.name }}</span>
      </div>

      <div class="ml-auto flex shrink-0 items-center gap-2 text-[10px] text-ink-500">
        <span class="hidden 2xl:inline">{{ t('workspace.localOnlyBadge') }}</span>
        <span class="h-1.5 w-1.5 rounded-full bg-mint-500 animate-pulse-soft" />
      </div>

      <Button class="shrink-0" size="sm" :title="`${t('common.language')} · ${currentLocaleLabel}`" @click="toggleLocale">
        <Languages :size="12" />
        <span>{{ localeLabels[nextLocale] }}</span>
      </Button>
      <Button
        class="shrink-0"
        size="icon"
        :title="state.ui.theme === 'light' ? t('workspace.toggleDarkTheme') : t('workspace.toggleLightTheme')"
        @click="toggleTheme"
      >
        <Sun v-if="state.ui.theme === 'light'" :size="14" />
        <Moon v-else :size="14" />
      </Button>
      <Button class="shrink-0" size="icon" :title="t('workspace.expandRightSettings')" @click="state.ui.rightCollapsed = false">
        <SlidersHorizontal :size="14" />
      </Button>
    </header>

    <main class="flex min-h-0 flex-1">
      <DataImportPanel v-if="!state.ui.leftCollapsed" />

      <button
        v-else
        type="button"
        :title="t('workspace.expandDataPanel')"
        class="flex w-9 shrink-0 flex-col items-center gap-2 border-r border-white/[0.08] bg-ink-900/40 py-4 text-ink-500 transition hover:text-primary"
        @click="state.ui.leftCollapsed = false"
      >
        <Database :size="14" />
        <span class="text-[10px] [writing-mode:vertical-rl]">{{ t('workspace.data') }}</span>
      </button>

      <section
        class="relative flex min-w-0 flex-1 flex-col"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="onChartDragLeave"
        @drop.prevent="onDrop"
      >
        <ChartToolbar />
        <div class="min-h-0 flex-1 p-3 2xl:p-4">
          <ChartCanvas />
        </div>
        <div class="flex h-8 shrink-0 items-center gap-3 overflow-hidden whitespace-nowrap border-t border-white/[0.06] px-4 text-[10px] text-ink-600">
          <span>{{ t('workspace.localOnlyLong') }}</span>
          <span class="ml-auto min-w-0 truncate font-mono" :title="t('workspace.selectedPathTitle')">{{ state.ui.selectedPath || t('workspace.noSelectedPath') }}</span>
        </div>
        <div
          v-if="isDragging"
          class="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm"
        >
          <div class="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/70 bg-ink-900/80 px-12 py-10 text-center shadow-glow">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <UploadCloud :size="28" />
            </div>
            <div class="text-[15px] font-semibold text-ink-50">{{ t('workspace.dropToImport') }}</div>
            <div class="text-[11px] text-ink-400">{{ t('workspace.dropSupport') }}</div>
          </div>
        </div>
      </section>

      <OptionPanel @toggle="state.ui.rightCollapsed = !state.ui.rightCollapsed" />

      <button
        v-if="state.ui.rightCollapsed"
        type="button"
        :title="t('workspace.expandChartSettings')"
        class="flex w-9 shrink-0 flex-col items-center gap-2 border-l border-white/[0.08] bg-ink-900/40 py-4 text-ink-500 transition hover:text-primary"
        @click="state.ui.rightCollapsed = false"
      >
        <SlidersHorizontal :size="14" />
        <span class="text-[10px] [writing-mode:vertical-rl]">{{ t('workspace.settings') }}</span>
      </button>
    </main>

    <DataPreviewDialog />
    <SheetPickerDialog />
  </div>
</template>
