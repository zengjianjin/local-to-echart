<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { FileCode2, FileJson, FileText, Image as ImageIcon, Upload } from 'lucide-vue-next'
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

const configInput = useTemplateRef<HTMLInputElement>('configInput')
const { exportImage, exportConfig, importConfig } = useExport()
const presetOptions = exportSizePresets.map((item) => ({ label: item.label, value: String(item.value) }))
</script>

<template>
  <div class="flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.08] px-4">
    <div class="flex items-center gap-2">
      <span class="text-[12px] font-semibold text-ink-50">图表预览</span>
      <Badge variant="success"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400" /> 实时</Badge>
    </div>

    <div class="ml-auto flex items-center gap-1.5">
      <input ref="configInput" type="file" accept="application/json,.json" class="hidden" @change="importConfig" />
      <Button size="sm" title="导入配置 JSON" @click="configInput?.click()">
        <Upload :size="12" /> 导入配置
      </Button>
      <Button size="sm" title="导出完整项目配置" @click="exportConfig('full')">
        <FileJson :size="12" /> 项目配置
      </Button>
      <Button size="sm" title="导出仅配置 JSON" @click="exportConfig('option')">
        <FileCode2 :size="12" /> 仅 Option
      </Button>
      <span class="mx-1 h-5 w-px bg-white/10" />
      <div class="flex items-center gap-1" title="导出分辨率：PNG/PDF 按此尺寸输出，SVG 使用相同 viewBox">
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
      <Button size="sm" title="导出 PNG" @click="exportImage('png')">
        <ImageIcon :size="12" /> PNG
      </Button>
      <Button size="sm" title="导出 SVG" @click="exportImage('svg')">
        <FileCode2 :size="12" /> SVG
      </Button>
      <Button size="sm" variant="primary" title="导出 PDF" @click="exportImage('pdf')">
        <FileText :size="12" /> PDF
      </Button>
    </div>
  </div>
</template>
