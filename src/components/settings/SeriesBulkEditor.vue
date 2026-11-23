<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Select from '@/components/ui/Select.vue'
import { cn } from '@/utils/cn'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { getOptionValue } from '@/utils/optionPath'
import { lineStyleOptions, positionOptions, seriesTypeOptions, symbolOptions } from '@/schema/fieldKinds'
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
  return [{ label: '不修改', value: '' }, ...options.map((option) => ({ label: option.label, value: String(option.value) }))]
}

const boolItems: BulkItem[] = []
const boolOptions = withNone([
  { label: '开启', value: 'true' },
  { label: '关闭', value: 'false' },
])

const sections: BulkSection[] = [
  {
    label: '通用 / 轴',
    items: [
      { path: 'type', label: '系列类型', kind: 'enum', options: withNone(seriesTypeOptions.map((option) => ({ label: option.label, value: String(option.value) }))) },
      { path: 'xAxisIndex', label: 'X 轴索引', kind: 'number', placeholder: '不修改' },
      { path: 'yAxisIndex', label: 'Y 轴索引', kind: 'number', placeholder: '不修改' },
      { path: 'z', label: '图形层级', kind: 'number', placeholder: '不修改' },
      { path: 'zlevel', label: '画布层级', kind: 'number', placeholder: '不修改' },
      { path: 'silent', label: '不响应交互', kind: 'boolean', options: boolOptions },
      { path: 'legendHoverLink', label: '图例联动高亮', kind: 'boolean', options: boolOptions },
      { path: 'coordinateSystem', label: '坐标系', kind: 'string', placeholder: '不修改' },
    ],
  },
  {
    label: '柱图',
    items: [
      { path: 'barWidth', label: '柱宽', kind: 'string', placeholder: '不修改（如 60%）' },
      { path: 'barMaxWidth', label: '最大柱宽', kind: 'string', placeholder: '不修改' },
      { path: 'barMinHeight', label: '最小柱高', kind: 'number', placeholder: '不修改' },
      { path: 'barGap', label: '同系列间距', kind: 'string', placeholder: '不修改（如 30%）' },
      { path: 'barCategoryGap', label: '类目间距', kind: 'string', placeholder: '不修改（如 20%）' },
    ],
  },
  {
    label: '折线 / 散点',
    items: [
      { path: 'smooth', label: '平滑曲线', kind: 'boolean', options: boolOptions },
      { path: 'showSymbol', label: '显示数据点', kind: 'boolean', options: boolOptions },
      { path: 'symbol', label: '数据点形状', kind: 'enum', options: withNone(symbolOptions.map((option) => ({ label: option.label, value: String(option.value) }))) },
      { path: 'symbolSize', label: '数据点大小', kind: 'string', placeholder: '不修改（如 8）' },
      { path: 'step', label: '阶梯线', kind: 'string', placeholder: '不修改（start/middle/end）' },
    ],
  },
  {
    label: '图形样式',
    items: [
      { path: 'itemStyle.color', label: '填充颜色', kind: 'string', placeholder: '不修改（如 #4F8CFF）' },
      { path: 'itemStyle.borderColor', label: '边框颜色', kind: 'string', placeholder: '不修改' },
      { path: 'itemStyle.borderWidth', label: '边框宽度', kind: 'number', placeholder: '不修改' },
      { path: 'itemStyle.borderRadius', label: '圆角', kind: 'number', placeholder: '不修改' },
      { path: 'itemStyle.opacity', label: '填充透明度', kind: 'number', placeholder: '不修改' },
      { path: 'itemStyle.shadowBlur', label: '阴影模糊', kind: 'number', placeholder: '不修改' },
      { path: 'itemStyle.shadowColor', label: '阴影颜色', kind: 'string', placeholder: '不修改' },
    ],
  },
  {
    label: '标签',
    items: [
      { path: 'label.show', label: '显示标签', kind: 'boolean', options: boolOptions },
      { path: 'label.position', label: '标签位置', kind: 'enum', options: withNone(positionOptions) },
      { path: 'label.color', label: '文字颜色', kind: 'string', placeholder: '不修改' },
      { path: 'label.fontSize', label: '字号', kind: 'number', placeholder: '不修改' },
      { path: 'label.rotate', label: '旋转角度', kind: 'number', placeholder: '不修改' },
    ],
  },
  {
    label: '线条 / 面积',
    items: [
      { path: 'lineStyle.color', label: '线条颜色', kind: 'string', placeholder: '不修改' },
      { path: 'lineStyle.width', label: '线条宽度', kind: 'number', placeholder: '不修改' },
      { path: 'lineStyle.type', label: '线条类型', kind: 'enum', options: withNone(lineStyleOptions) },
      { path: 'lineStyle.opacity', label: '线条透明度', kind: 'number', placeholder: '不修改' },
      { path: 'lineStyle.curveness', label: '曲率', kind: 'number', placeholder: '不修改' },
      { path: 'areaStyle.color', label: '区域颜色', kind: 'string', placeholder: '不修改' },
      { path: 'areaStyle.opacity', label: '区域透明度', kind: 'number', placeholder: '不修改' },
    ],
  },
  {
    label: '饼图',
    items: [
      { path: 'radius', label: '饼图半径', kind: 'string', placeholder: '不修改（如 60%）' },
      { path: 'center', label: '饼图圆心', kind: 'string', placeholder: '不修改（如 [50%, 50%]）' },
      { path: 'roseType', label: '玫瑰模式', kind: 'string', placeholder: '不修改（radius/area）' },
      { path: 'minAngle', label: '最小扇区角度', kind: 'number', placeholder: '不修改' },
      { path: 'avoidLabelOverlap', label: '避免标签重叠', kind: 'boolean', options: boolOptions },
    ],
  },
]

void boolItems

function onInput(path: string, event: Event) {
  values[path] = (event.target as HTMLInputElement).value
}

function onSelect(path: string, value: string | number) {
  values[path] = String(value)
}

function apply() {
  const patches: Array<{ path: string; value: SerializableNode }> = []
  sections.forEach((section) => section.items.forEach((item) => {
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
        <span class="text-[10px] font-semibold text-ink-300">批量配置本组系列</span>
      </span>
      <span class="text-[9px] text-ink-600">本组 {{ seriesCount }} 个</span>
    </div>

    <div v-if="expanded" class="animate-fade-in mt-2 space-y-3">
      <div class="sticky top-0 z-10 -mx-3 flex items-center gap-2 border-b border-white/[0.06] bg-ink-900/95 px-3 py-2 backdrop-blur">
        <Button size="sm" @click="apply">应用到本组系列</Button>
        <button type="button" class="text-[9px] text-ink-500 hover:text-ink-200" @click="clearFields">清空输入</button>
        <span class="ml-auto text-[9px] text-ink-600">留空即不修改</span>
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
              :placeholder="item.placeholder ?? '不修改'"
              class="field-shell w-full text-[10px]"
              @input="onInput(item.path, $event)"
            />
          </label>
        </div>
      </div>

      <p class="text-[9px] leading-relaxed text-ink-600">
        只影响当前数据配置生成的系列，并保存为该配置的默认值；重新生成后仍保留。部分字段只对特定图表类型生效。
      </p>
    </div>
  </div>
</template>
