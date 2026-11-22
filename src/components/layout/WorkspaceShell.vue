<script setup lang="ts">
import { Database, Moon, PanelLeftClose, PanelLeftOpen, SlidersHorizontal, Sun } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import DataImportPanel from '@/components/data/DataImportPanel.vue'
import DataPreviewDialog from '@/components/data/DataPreviewDialog.vue'
import SheetPickerDialog from '@/components/data/SheetPickerDialog.vue'
import ChartCanvas from '@/components/chart/ChartCanvas.vue'
import ChartToolbar from '@/components/chart/ChartToolbar.vue'
import OptionPanel from '@/components/settings/OptionPanel.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

const { state, toggleTheme } = useWorkspaceStore()
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <header class="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.08] bg-ink-950/80 px-4 backdrop-blur-xl">
      <Button size="icon" :title="state.ui.leftCollapsed ? '展开数据面板' : '折叠数据面板'" @click="state.ui.leftCollapsed = !state.ui.leftCollapsed">
        <PanelLeftOpen v-if="state.ui.leftCollapsed" :size="14" />
        <PanelLeftClose v-else :size="14" />
      </Button>

      <img src="/favicon.svg" alt="" class="h-8 w-8 rounded-xl shadow-glow" />
      <div>
        <div class="text-[13px] font-semibold tracking-tight text-ink-50">Local to ECharts Studio</div>
        <div class="text-[9px] text-ink-500">完整 ECharts Option 本地编辑器</div>
      </div>

      <div class="mx-3 h-7 w-px bg-white/10" />

      <div class="flex min-w-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5">
        <Database :size="12" class="text-primary" />
        <span class="max-w-[240px] truncate text-[11px] text-ink-200">{{ state.project.meta.name }}</span>
      </div>

      <div class="ml-auto flex items-center gap-2 text-[10px] text-ink-500">
        <span class="hidden md:inline">数据本地处理 · 不上传</span>
        <span class="h-1.5 w-1.5 rounded-full bg-mint-500 animate-pulse-soft" />
      </div>

      <Button
        size="icon"
        :title="state.ui.theme === 'light' ? '切换到深色外观' : '切换到浅色外观'"
        @click="toggleTheme"
      >
        <Sun v-if="state.ui.theme === 'light'" :size="14" />
        <Moon v-else :size="14" />
      </Button>
      <Button size="icon" title="展开右侧设置" @click="state.ui.rightCollapsed = false">
        <SlidersHorizontal :size="14" />
      </Button>
    </header>

    <main class="flex min-h-0 flex-1">
      <DataImportPanel v-if="!state.ui.leftCollapsed" />

      <button
        v-else
        type="button"
        title="展开数据面板"
        class="flex w-9 shrink-0 flex-col items-center gap-2 border-r border-white/[0.08] bg-ink-900/40 py-4 text-ink-500 transition hover:text-primary"
        @click="state.ui.leftCollapsed = false"
      >
        <Database :size="14" />
        <span class="text-[10px] [writing-mode:vertical-rl]">数据</span>
      </button>

      <section class="flex min-w-0 flex-1 flex-col">
        <ChartToolbar />
        <div class="min-h-0 flex-1 p-4">
          <ChartCanvas />
        </div>
        <div class="flex h-8 shrink-0 items-center gap-3 border-t border-white/[0.06] px-4 text-[10px] text-ink-600">
          <span>Option 即唯一配置来源</span>
          <span class="h-3 w-px bg-white/10" />
          <span>schema 负责可视化，JSON 保留完整能力</span>
          <span class="ml-auto font-mono">{{ state.ui.selectedPath || '未选择字段' }}</span>
        </div>
      </section>

      <OptionPanel @toggle="state.ui.rightCollapsed = !state.ui.rightCollapsed" />

      <button
        v-if="state.ui.rightCollapsed"
        type="button"
        title="展开图表设置"
        class="flex w-9 shrink-0 flex-col items-center gap-2 border-l border-white/[0.08] bg-ink-900/40 py-4 text-ink-500 transition hover:text-primary"
        @click="state.ui.rightCollapsed = false"
      >
        <SlidersHorizontal :size="14" />
        <span class="text-[10px] [writing-mode:vertical-rl]">设置</span>
      </button>
    </main>

    <DataPreviewDialog />
    <SheetPickerDialog />
  </div>
</template>
