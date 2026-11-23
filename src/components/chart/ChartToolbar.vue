<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Contrast, FileCode2, FileJson, FileText, Grid3x3, Image as ImageIcon, Upload } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import {
  applyExportPreset,
  exportSize,
  exportSizePresets,
  useExport,
} from '@/composables/useExport'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { getOptionValue } from '@/utils/optionPath'

const configInput = useTemplateRef<HTMLInputElement>('configInput')
const { t } = useI18n()
const { exportImage, exportConfig, importConfig } = useExport()
const { state, currentChartTheme, setChartTheme, setSplitLineVisibility } = useWorkspaceStore()
const presetOptions = computed(() =>
  exportSizePresets.map((item) => ({
    label: 'labelKey' in item ? t(item.labelKey) : item.label,
    value: String(item.value),
  })),
)
const chartTheme = computed(() => currentChartTheme())
const splitLineOn = computed(() => getOptionValue(state.project.option, 'xAxis[0].splitLine.show') === true)
</script>

<template>
  <div class="scrollbar-toolbar flex h-12 min-w-0 shrink-0 items-center gap-2 overflow-x-auto border-b border-white/[0.08] px-3">
    <div class="flex shrink-0 items-center gap-2">
      <span class="text-[12px] font-semibold text-ink-50">{{ t('chart.preview') }}</span>
      <Badge variant="success"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {{ t('chart.realtime') }}</Badge>
    </div>

    <div class="ml-1 flex shrink-0 items-center gap-1 border-l border-white/10 pl-2">
      <Button
        size="sm"
        :title="chartTheme === 'light' ? t('chart.darkBgTooltip') : t('chart.lightBgTooltip')"
        @click="setChartTheme(chartTheme === 'light' ? 'dark' : 'light')"
      >
        <Contrast :size="12" />
        <span class="hidden 2xl:inline">{{ chartTheme === 'light' ? t('chart.darkChart') : t('chart.lightChart') }}</span>
      </Button>
      <Button
        size="sm"
        :title="splitLineOn ? t('chart.hideGridTooltip') : t('chart.showGridTooltip')"
        @click="setSplitLineVisibility(!splitLineOn)"
      >
        <Grid3x3 :size="12" />
        <span class="hidden 2xl:inline">{{ t('chart.gridLabel', { state: splitLineOn ? t('chart.gridOn') : t('chart.gridOff') }) }}</span>
      </Button>
    </div>

    <div class="ml-auto flex shrink-0 items-center gap-1.5">
      <input ref="configInput" type="file" accept="application/json,.json" class="hidden" @change="importConfig" />
      <Button size="sm" :title="t('chart.importConfigTitle')" @click="configInput?.click()">
        <Upload :size="12" /> <span class="hidden 2xl:inline">{{ t('chart.importConfig') }}</span>
      </Button>
      <Button size="sm" :title="t('chart.exportProjectTitle')" @click="exportConfig('full')">
        <FileJson :size="12" /> <span class="hidden 2xl:inline">{{ t('chart.exportProject') }}</span>
      </Button>
      <Button size="sm" :title="t('chart.exportOptionTitle')" @click="exportConfig('option')">
        <FileCode2 :size="12" /> <span class="hidden 2xl:inline">{{ t('chart.exportOption') }}</span>
      </Button>
      <span class="mx-1 h-5 w-px shrink-0 bg-white/10" />
      <div class="flex shrink-0 items-center gap-1" :title="t('chart.exportSizeTitle')">
        <Select
          :model-value="exportSize.preset"
          :options="presetOptions"
          class="w-[112px]"
          @update:model-value="applyExportPreset"
        />
        <template v-if="exportSize.preset === 'custom'">
          <Input
            :model-value="exportSize.width ?? ''"
            type="number"
            :min="64"
            :max="8192"
            class="w-[70px]"
            @update:model-value="exportSize.width = Number($event) || null"
          />
          <span class="text-[10px] text-ink-600">×</span>
          <Input
            :model-value="exportSize.height ?? ''"
            type="number"
            :min="64"
            :max="8192"
            class="w-[70px]"
            @update:model-value="exportSize.height = Number($event) || null"
          />
        </template>
      </div>
      <Button size="sm" :title="t('chart.exportPngTitle')" @click="exportImage('png')">
        <ImageIcon :size="12" /> <span class="hidden 2xl:inline">PNG</span>
      </Button>
      <Button size="sm" :title="t('chart.exportSvgTitle')" @click="exportImage('svg')">
        <FileCode2 :size="12" /> <span class="hidden 2xl:inline">SVG</span>
      </Button>
      <Button size="sm" variant="primary" :title="t('chart.exportPdfTitle')" @click="exportImage('pdf')">
        <FileText :size="12" /> <span class="hidden 2xl:inline">PDF</span>
      </Button>
    </div>
  </div>
</template>
