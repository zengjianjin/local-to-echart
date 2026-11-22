<script setup lang="ts">
import { computed } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import type { FieldSchema, FormatterDescriptor, SerializableNode } from '@/types'
import FieldLabel from '@/components/ui/FieldLabel.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Switch from '@/components/ui/Switch.vue'
import Collapsible from '@/components/ui/Collapsible.vue'
import ArrayItemEditor from './ArrayItemEditor.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { getOptionValue, hasOptionValue } from '@/utils/optionPath'
import { normalizeFieldInput } from '@/utils/fieldInput'
import { fieldKindLabels } from '@/schema'

const UNSET_VALUE = '__unset__'
const SCALAR_KINDS = new Set(['string', 'number', 'boolean', 'color', 'enum', 'template'])

const props = defineProps<{ field: FieldSchema; basePath?: string }>()
const { state } = useWorkspaceStore()
const { setOptionValueAt, setGridVisibility, removeOptionValueAt } = useWorkspaceStore()

const resolvedPath = computed(() => {
  const path = props.field.path
  if (!props.basePath) return path
  if (!path) return props.basePath
  if (path.startsWith(props.basePath + '.') || path.startsWith(props.basePath + '[')) return path
  return `${props.basePath}.${path}`
})

const hasValue = computed(() => Boolean(resolvedPath.value) && hasOptionValue(state.project.option, resolvedPath.value))
const rawValue = computed(() => getOptionValue(state.project.option, resolvedPath.value))

function textOf(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const stringValue = computed(() => (hasValue.value ? textOf(rawValue.value) : ''))
const numberValue = computed(() => {
  if (!hasValue.value) return ''
  const value = rawValue.value
  if (typeof value === 'number') return Number.isFinite(value) ? value : ''
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return ''
})
const boolValue = computed(() => rawValue.value === true || rawValue.value === 'true' || rawValue.value === 1)
const isScalar = computed(() => SCALAR_KINDS.has(props.field.kind))

const activeSeriesType = computed(() => {
  const match = (props.basePath ?? resolvedPath.value).match(/series\[(\d+)\]/)
  if (!match) return ''
  const type = getOptionValue(state.project.option, `series[${match[1]}].type`)
  return typeof type === 'string' ? type : ''
})

function visibleChildren(field: FieldSchema): FieldSchema[] {
  return (field.children ?? []).filter(
    (child) => !child.chartTypes || (activeSeriesType.value && child.chartTypes.includes(activeSeriesType.value)),
  )
}

const templateValue = computed(() => {
  const value = rawValue.value as FormatterDescriptor | string | undefined
  if (value && typeof value === 'object' && '__templateFormatter' in value) {
    return value.__templateFormatter.template
  }
  return typeof value === 'string' ? value : ''
})

const selectOptions = computed(() =>
  (props.field.enumValues ?? []).map((item) => ({ label: item.label, value: String(item.value) })),
)
const enumOptions = computed(() => [{ label: '未设置（默认）', value: UNSET_VALUE }, ...selectOptions.value])
const enumValue = computed(() => (hasValue.value ? stringValue.value : UNSET_VALUE))

function reset() {
  if (!resolvedPath.value) return
  removeOptionValueAt(resolvedPath.value)
}

function update(value: SerializableNode) {
  if (resolvedPath.value === 'grid.show' && typeof value === 'boolean') {
    setGridVisibility(value)
    return
  }
  setOptionValueAt(resolvedPath.value, normalizeFieldInput(resolvedPath.value, value))
}

function updateText(value: string) {
  if (value === '') {
    reset()
    return
  }
  update(value)
}

function updateNumber(value: string) {
  if (value.trim() === '') {
    reset()
    return
  }
  const numeric = Number(value)
  if (Number.isFinite(numeric)) update(numeric)
}

function updateEnum(value: string) {
  if (value === UNSET_VALUE) {
    reset()
    return
  }
  const option = props.field.enumValues?.find((item) => String(item.value) === value)
  const nextValue = option ? option.value : value
  update(nextValue as SerializableNode)
  if (/^series\[\d+\]\.type$/.test(resolvedPath.value)) {
    adaptSeriesEncode(resolvedPath.value, String(nextValue))
  }
}

function updateTemplate(value: string) {
  if (value === '') {
    reset()
    return
  }
  update({ __templateFormatter: { template: value, preset: value } } satisfies FormatterDescriptor)
}

function normalizeDimension(value: unknown): SerializableNode {
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  return value as SerializableNode
}

function encodeRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function adaptSeriesEncode(typePath: string, nextType: string) {
  const match = typePath.match(/^series\[(\d+)\]\.type$/)
  if (!match) return
  const base = `series[${match[1]}]`
  const encode = encodeRecord(getOptionValue(state.project.option, `${base}.encode`)) ?? {}
  const cartesianName = encode.itemName ?? encode.x ?? 0
  const cartesianValue = encode.value ?? (Array.isArray(encode.y) ? encode.y[0] : encode.y) ?? 1
  const nameDim = normalizeDimension(cartesianName)
  const valueDim = normalizeDimension(cartesianValue)
  const nextEncode: Record<string, SerializableNode> = {}

  for (const [key, entry] of Object.entries(encode)) {
    if (key !== 'x' && key !== 'y' && key !== 'itemName' && key !== 'value') {
      nextEncode[key] = entry as SerializableNode
    }
  }

  if (nextType === 'pie') {
    nextEncode.itemName = nameDim
    nextEncode.value = valueDim
    setOptionValueAt('legend.type', 'scroll')
    setOptionValueAt('legend.top', 44)
  } else {
    nextEncode.x = nameDim
    nextEncode.y = [valueDim]
    setOptionValueAt('legend.type', 'plain')
    setOptionValueAt('legend.top', 12)
  }

  setOptionValueAt(`${base}.encode`, nextEncode)
  state.ui.selectedPath = typePath
}

function childBasePath(child: FieldSchema): string | undefined {
  if (!resolvedPath.value) return props.basePath
  if (child.path.startsWith(resolvedPath.value)) return undefined
  return resolvedPath.value
}

const colorValue = computed(() => (/^#[0-9a-fA-F]{6}$/.test(stringValue.value) ? stringValue.value : '#4F8CFF'))
</script>

<template>
  <div class="space-y-1">
    <div class="flex items-center gap-1">
      <FieldLabel
        class="min-w-0 flex-1"
        :label="field.label"
        :path="resolvedPath"
        :description="field.description"
      />
      <button
        v-if="isScalar && hasValue"
        type="button"
        title="恢复默认"
        class="shrink-0 rounded p-0.5 text-ink-600 transition hover:bg-white/5 hover:text-ink-200"
        @click="reset"
      >
        <RotateCcw :size="11" />
      </button>
    </div>

    <div v-if="field.kind === 'boolean'" class="flex items-center gap-2">
      <Switch :model-value="boolValue" :indeterminate="!hasValue" @update:model-value="update" />
      <span v-if="!hasValue" class="text-[9px] text-ink-600">默认（未设置）</span>
    </div>

    <Input
      v-else-if="field.kind === 'number'"
      type="number"
      :model-value="numberValue"
      :placeholder="field.placeholder ?? '未设置（默认）'"
      :min="field.min"
      :max="field.max"
      :step="field.step ?? 1"
      @update:model-value="updateNumber"
    />

    <Select
      v-else-if="field.kind === 'enum'"
      :model-value="enumValue"
      :options="enumOptions"
      @update:model-value="updateEnum"
    />

    <div v-else-if="field.kind === 'color'" class="flex items-center gap-2">
      <input
        type="color"
        :value="colorValue"
        class="h-8 w-9 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5"
        @input="update(($event.target as HTMLInputElement).value)"
      />
      <Input :model-value="stringValue" placeholder="未设置（自动）" @update:model-value="updateText" />
    </div>

    <div v-else-if="field.kind === 'template'" class="space-y-2">
      <Select
        :model-value="templateValue"
        :options="selectOptions"
        placeholder="选择安全模板"
        @update:model-value="updateTemplate"
      />
      <Input :model-value="templateValue" placeholder="{b}: {c}" @update:model-value="updateTemplate" />
      <p class="text-[9px] leading-relaxed text-ink-600">模板不会被当作代码执行，仅替换 ECharts 提供的参数变量。</p>
    </div>

    <ArrayItemEditor
      v-else-if="field.kind === 'array'"
      :field="field"
      :base-path="props.basePath"
    />

    <Collapsible
      v-else-if="field.kind === 'object' && field.children?.length"
      :title="field.label"
      :description="field.description"
      :count="visibleChildren(field).length"
      :open="true"
    >
      <div class="space-y-3">
        <FieldControl
          v-for="child in visibleChildren(field)"
          :key="child.path"
          :field="child"
          :base-path="childBasePath(child)"
        />
      </div>
    </Collapsible>

    <div
      v-else-if="field.kind === 'unknown'"
      class="rounded-lg border border-dashed border-white/10 px-3 py-2 text-[10px] leading-relaxed text-ink-500"
    >
      该字段保留在配置中，请在 JSON 模式查看或编辑。
    </div>

    <Input
      v-else
      :model-value="stringValue"
      :placeholder="field.placeholder ?? '未设置（默认）'"
      @update:model-value="updateText"
    />

    <p v-if="!field.description && field.kind === 'array'" class="sr-only">{{ fieldKindLabels.array }}</p>
  </div>
</template>
