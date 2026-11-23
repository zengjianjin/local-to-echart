<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Select from '@/components/ui/Select.vue'
import { cn } from '@/utils/cn'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { getOptionValue } from '@/utils/optionPath'
import { lineStyleOptions, positionOptions, seriesTypeOptions, symbolOptions } from '@/schema/fieldKinds'
import { translateSchemaText } from '@/i18n/schema'
import type { SerializableNode } from '@/types'

type BulkKind = 'enum' | 'boolean' | 'number' | 'string'
interface BulkItem {
  path: string
  label: string
  kind: BulkKind
  options?: Array<{ label: string; value: string | number }>
  placeholder?: string
}
interface BulkSection {
  label: string
  items: BulkItem[]
}

const props = defineProps<{ groupIndex: number }>()
const { t } = useI18n()
const { state, applySeriesBulk } = useWorkspaceStore()

const values = reactive<Record<string, string>>({})
const expanded = ref(false)

const seriesCount = computed(() => {
  const series = getOptionValue(state.project.option, 'series')
  if (!Array.isArray(series)) return 0
  const prefix = `workspace-series-group-${props.groupIndex}-`
  return series.filter((item) => Boolean(item) && typeof item === 'object' && !Array.isArray(item)
    && typeof (item as Record<string, unknown>).id === 'string'
    && String((item as Record<string, unknown>).id).startsWith(prefix)).length
})

function withNone(options: Array<{ label: string; value: string | number | boolean }>) {
  return [
    { label: t('common.noChange'), value: '' },
    ...options.map((option) => ({ label: translateSchemaText(option.label) ?? option.label, value: String(option.value) })),
  ]
}

const boolItems: BulkItem[] = []
const boolOptions = computed(() => withNone([
  { label: t('common.enabled'), value: 'true' },
  { label: t('common.disabled'), value: 'false' },
]))

const noChange = () => t('common.noChange')

const sections = computed<BulkSection[]>(() => [
  {
    label: t('settings.sectionCommonAxis'),
    items: [
      { path: 'type', label: t('settings.fieldSeriesType'), kind: 'enum', options: withNone(seriesTypeOptions.map((option) => ({ label: option.label, value: String(option.value) }))) },
      { path: 'xAxisIndex', label: t('settings.fieldXAxisIndex'), kind: 'number', placeholder: noChange() },
      { path: 'yAxisIndex', label: t('settings.fieldYAxisIndex'), kind: 'number', placeholder: noChange() },
      { path: 'z', label: t('settings.fieldZ'), kind: 'number', placeholder: noChange() },
      { path: 'zlevel', label: t('settings.fieldZlevel'), kind: 'number', placeholder: noChange() },
      { path: 'silent', label: t('settings.fieldSilent'), kind: 'boolean', options: boolOptions.value },
      { path: 'legendHoverLink', label: t('settings.fieldLegendHoverLink'), kind: 'boolean', options: boolOptions.value },
      { path: 'coordinateSystem', label: t('settings.fieldCoordinateSystem'), kind: 'string', placeholder: noChange() },
    ],
  },
  {
    label: t('settings.sectionBar'),
    items: [
      { path: 'barWidth', label: t('settings.fieldBarWidth'), kind: 'string', placeholder: t('settings.phPercent60') },
      { path: 'barMaxWidth', label: t('settings.fieldBarMaxWidth'), kind: 'string', placeholder: noChange() },
      { path: 'barMinHeight', label: t('settings.fieldBarMinHeight'), kind: 'number', placeholder: noChange() },
      { path: 'barGap', label: t('settings.fieldBarGap'), kind: 'string', placeholder: t('settings.phPercent30') },
      { path: 'barCategoryGap', label: t('settings.fieldBarCategoryGap'), kind: 'string', placeholder: t('settings.phPercent20') },
    ],
  },
  {
    label: t('settings.sectionLineScatter'),
    items: [
      { path: 'smooth', label: t('settings.fieldSmooth'), kind: 'boolean', options: boolOptions.value },
      { path: 'showSymbol', label: t('settings.fieldShowSymbol'), kind: 'boolean', options: boolOptions.value },
      { path: 'symbol', label: t('settings.fieldSymbol'), kind: 'enum', options: withNone(symbolOptions.map((option) => ({ label: option.label, value: String(option.value) }))) },
      { path: 'symbolSize', label: t('settings.fieldSymbolSize'), kind: 'string', placeholder: t('settings.phSymbolSize') },
      { path: 'step', label: t('settings.fieldStep'), kind: 'string', placeholder: t('settings.phStep') },
    ],
  },
  {
    label: t('settings.sectionStyle'),
    items: [
      { path: 'itemStyle.color', label: t('settings.fieldItemColor'), kind: 'string', placeholder: t('settings.phColor') },
      { path: 'itemStyle.borderColor', label: t('settings.fieldItemBorderColor'), kind: 'string', placeholder: noChange() },
      { path: 'itemStyle.borderWidth', label: t('settings.fieldItemBorderWidth'), kind: 'number', placeholder: noChange() },
      { path: 'itemStyle.borderRadius', label: t('settings.fieldItemRadius'), kind: 'number', placeholder: noChange() },
      { path: 'itemStyle.opacity', label: t('settings.fieldItemOpacity'), kind: 'number', placeholder: noChange() },
      { path: 'itemStyle.shadowBlur', label: t('settings.fieldItemShadowBlur'), kind: 'number', placeholder: noChange() },
      { path: 'itemStyle.shadowColor', label: t('settings.fieldItemShadowColor'), kind: 'string', placeholder: noChange() },
    ],
  },
  {
    label: t('settings.sectionLabel'),
    items: [
      { path: 'label.show', label: t('settings.fieldLabelShow'), kind: 'boolean', options: boolOptions.value },
      { path: 'label.position', label: t('settings.fieldLabelPosition'), kind: 'enum', options: withNone(positionOptions) },
      { path: 'label.color', label: t('settings.fieldLabelColor'), kind: 'string', placeholder: noChange() },
      { path: 'label.fontSize', label: t('settings.fieldLabelFontSize'), kind: 'number', placeholder: noChange() },
      { path: 'label.rotate', label: t('settings.fieldLabelRotate'), kind: 'number', placeholder: noChange() },
    ],
  },
  {
    label: t('settings.sectionLineArea'),
    items: [
      { path: 'lineStyle.color', label: t('settings.fieldLineColor'), kind: 'string', placeholder: noChange() },
      { path: 'lineStyle.width', label: t('settings.fieldLineWidth'), kind: 'number', placeholder: noChange() },
      { path: 'lineStyle.type', label: t('settings.fieldLineType'), kind: 'enum', options: withNone(lineStyleOptions) },
      { path: 'lineStyle.opacity', label: t('settings.fieldLineOpacity'), kind: 'number', placeholder: noChange() },
      { path: 'lineStyle.curveness', label: t('settings.fieldCurveness'), kind: 'number', placeholder: noChange() },
      { path: 'areaStyle.color', label: t('settings.fieldAreaColor'), kind: 'string', placeholder: noChange() },
      { path: 'areaStyle.opacity', label: t('settings.fieldAreaOpacity'), kind: 'number', placeholder: noChange() },
    ],
  },
  {
    label: t('settings.sectionPie'),
    items: [
      { path: 'radius', label: t('settings.fieldPieRadius'), kind: 'string', placeholder: t('settings.phPercent60') },
      { path: 'center', label: t('settings.fieldPieCenter'), kind: 'string', placeholder: t('settings.phPieCenter') },
      { path: 'roseType', label: t('settings.fieldRoseType'), kind: 'string', placeholder: t('settings.phRose') },
      { path: 'minAngle', label: t('settings.fieldMinAngle'), kind: 'number', placeholder: noChange() },
      { path: 'avoidLabelOverlap', label: t('settings.fieldAvoidLabelOverlap'), kind: 'boolean', options: boolOptions.value },
    ],
  },
])

void boolItems

function onInput(path: string, event: Event) {
  values[path] = (event.target as HTMLInputElement).value
}

function onSelect(path: string, value: string | number) {
  values[path] = String(value)
}

function apply() {
  const patches: Array<{ path: string; value: SerializableNode }> = []
  sections.value.forEach((section) => section.items.forEach((item) => {
    const raw = values[item.path]
    if (raw === undefined || raw === '') return
    let value: SerializableNode
    if (item.kind === 'boolean') value = raw === 'true'
    else if (item.kind === 'number') {
      const parsed = Number(raw)
      if (!Number.isFinite(parsed)) return
      value = parsed
    } else value = raw
    patches.push({ path: item.path, value })
  }))
  if (!patches.length) return
  applySeriesBulk(props.groupIndex, patches)
}

function clearFields() {
  Object.keys(values).forEach((key) => delete values[key])
}
</script>

<template>
  <div class="mt-3 border-t border-white/[0.06] pt-2">
    <div
      role="button"
      tabindex="0"
      :aria-expanded="expanded"
      class="flex w-full cursor-pointer items-center justify-between rounded-lg px-1 py-1 text-left transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      @click="expanded = !expanded"
      @keydown.enter.prevent="expanded = !expanded"
      @keydown.space.prevent="expanded = !expanded"
    >
      <span class="flex items-center gap-1.5">
        <ChevronDown :size="13" :class="cn('text-ink-500 transition-transform duration-200', !expanded && '-rotate-90')" />
        <span class="text-[10px] font-semibold text-ink-300">{{ t('settings.bulkTitle') }}</span>
      </span>
      <span class="text-[9px] text-ink-600">{{ t('settings.bulkGroupCount', { count: seriesCount }) }}</span>
    </div>

    <div v-if="expanded" class="animate-fade-in mt-2 space-y-3">
      <div class="sticky top-0 z-10 -mx-3 flex items-center gap-2 border-b border-white/[0.06] bg-ink-900/95 px-3 py-2 backdrop-blur">
        <Button size="sm" @click="apply">{{ t('settings.bulkApply') }}</Button>
        <button type="button" class="text-[9px] text-ink-500 hover:text-ink-200" @click="clearFields">{{ t('settings.bulkClear') }}</button>
        <span class="ml-auto text-[9px] text-ink-600">{{ t('settings.bulkLeaveEmpty') }}</span>
      </div>

      <div v-for="section in sections" :key="section.label">
        <div class="mb-1 text-[9px] text-ink-500">{{ section.label }}</div>
        <div :class="state.ui.rightExpanded ? 'grid grid-cols-2 gap-2' : 'space-y-1.5'">
          <label v-for="item in section.items" :key="item.path" class="block">
            <span class="mb-0.5 block text-[9px] text-ink-600">{{ item.label }}</span>
            <Select
              v-if="item.kind === 'enum' || item.kind === 'boolean'"
              :model-value="values[item.path] ?? ''"
              :options="item.options ?? []"
              @update:model-value="(value) => onSelect(item.path, value)"
            />
            <input
              v-else
              :value="values[item.path] ?? ''"
              :type="item.kind === 'number' ? 'number' : 'text'"
              :placeholder="item.placeholder ?? t('common.noChange')"
              class="field-shell w-full text-[10px]"
              @input="onInput(item.path, $event)"
            />
          </label>
        </div>
      </div>

      <p class="text-[9px] leading-relaxed text-ink-600">
        {{ t('settings.bulkHelp') }}
      </p>
    </div>
  </div>
</template>
