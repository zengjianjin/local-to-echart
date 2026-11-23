<script setup lang="ts">
import { computed } from 'vue'
import Select from '@/components/ui/Select.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

const props = defineProps<{ groupIndex: number }>()

const {
  state,
  currentSeriesNameFields,
  currentSeriesValueField,
  currentSeriesGroupLimit,
  currentSeriesCategoryLimit,
  currentSeriesAggregate,
  currentSeriesGroupValueOptions,
  currentSeriesGroupValues,
  currentSeriesStackMode,
  setSeriesNameFields,
  setSeriesValueField,
  setSeriesStackMode,
  setSeriesGroupLimit,
  setSeriesCategoryLimit,
  setSeriesAggregate,
  setSeriesGroupValues,
} = useWorkspaceStore()

const columnOptions = computed(() => (
  state.table?.columns.map((column, index) => ({ label: column, value: index })) ?? []
))
const numericOptions = computed(() => (
  state.table
    ? columnOptions.value.filter((option) => state.table?.inferredTypes[Number(option.value)] === 'number')
    : []
))
const nameFields = computed(() => currentSeriesNameFields(props.groupIndex))
const nameField = computed(() => nameFields.value[0] ?? '')
const valueField = computed(() => currentSeriesValueField(props.groupIndex))
const nameFieldOptions = computed(() => [
  { label: '不分组（单一系列）', value: '' },
  ...columnOptions.value,
])
const stackMode = computed(() => currentSeriesStackMode(props.groupIndex))
const stackOptions = [
  { label: '不堆叠（并列）', value: 'none' },
  { label: '累加堆叠', value: 'stack' },
  { label: '百分比堆叠', value: 'percent' },
  { label: '同号堆叠 samesign', value: 'samesign' },
  { label: '全值堆叠 all', value: 'all' },
]
const groupLimit = computed(() => currentSeriesGroupLimit(props.groupIndex))
const categoryLimit = computed(() => currentSeriesCategoryLimit(props.groupIndex))
const aggregate = computed(() => currentSeriesAggregate(props.groupIndex))
const groupValueOptions = computed(() => currentSeriesGroupValueOptions(props.groupIndex))
const activeGroupValues = computed(() => currentSeriesGroupValues(props.groupIndex))
const allValuesSelected = computed(
  () => groupValueOptions.value.length > 0 && activeGroupValues.value.length === groupValueOptions.value.length,
)
const aggregateOptions = [
  { label: '求和', value: 'sum' },
  { label: '平均', value: 'avg' },
  { label: '首条值', value: 'first' },
]

function onNameFieldChange(value: string | number) {
  setSeriesNameFields(props.groupIndex, value === '' ? [] : [Number(value)])
}

function onValueFieldChange(value: string | number) {
  if (value !== '') setSeriesValueField(props.groupIndex, Number(value))
}

function onNumberChange(event: Event, apply: (value: number) => void) {
  apply(Number((event.target as HTMLInputElement).value))
}

function onAggregateChange(value: string | number) {
  if (value === 'sum' || value === 'avg' || value === 'first') setSeriesAggregate(props.groupIndex, value)
}

function toggleGroupValue(value: string) {
  const next = [...activeGroupValues.value]
  const position = next.indexOf(value)
  if (position >= 0) next.splice(position, 1)
  else next.push(value)
  setSeriesGroupValues(props.groupIndex, next)
}

function toggleAllGroupValues() {
  setSeriesGroupValues(props.groupIndex, allValuesSelected.value ? [] : [...groupValueOptions.value])
}

function updateGroupLimit(value: number) {
  setSeriesGroupLimit(props.groupIndex, value)
}

function updateCategoryLimit(value: number) {
  setSeriesCategoryLimit(props.groupIndex, value)
}

function updateStackMode(value: string | number) {
  setSeriesStackMode(
    props.groupIndex,
    String(value) as 'none' | 'stack' | 'percent' | 'samesign' | 'all',
  )
}
</script>

<template>
  <div v-if="state.table">
    <div class="mb-2 flex items-center justify-between">
      <span class="text-[10px] font-semibold text-ink-300">系列名称分组</span>
      <span class="text-[9px] text-ink-600">tooltip 按字段拆分系列</span>
    </div>

    <label class="mb-1 block text-[9px] text-ink-500">数值字段</label>
    <Select
      :model-value="valueField >= 0 ? valueField : ''"
      :options="numericOptions"
      placeholder="请选择数值列"
      @update:model-value="onValueFieldChange"
    />

    <div class="mt-2">
      <label class="mb-1 block text-[9px] text-ink-500">名称分组字段</label>
      <Select
        :model-value="nameField"
        :options="nameFieldOptions"
        @update:model-value="onNameFieldChange"
      />
    </div>

    <div v-if="groupValueOptions.length" class="mt-2">
      <div class="mb-1 flex items-center justify-between">
        <span class="text-[9px] text-ink-500">
          参与分组的取值（默认前 4 个，已选 {{ activeGroupValues.length }}/{{ groupValueOptions.length }}）
        </span>
        <button type="button" class="text-[9px] text-primary hover:underline" @click="toggleAllGroupValues">
          {{ allValuesSelected ? '恢复默认' : '全选' }}
        </button>
      </div>
      <div class="scrollbar-slim flex max-h-[76px] flex-wrap gap-1 overflow-auto rounded border border-white/[0.08] bg-ink-950/40 p-1">
        <button
          v-for="value in groupValueOptions"
          :key="value"
          type="button"
          class="rounded border px-1.5 py-0.5 text-[9px] transition-colors"
          :class="activeGroupValues.includes(value)
            ? 'border-primary/60 bg-primary/15 text-primary'
            : 'border-white/10 text-ink-500 hover:border-white/25'"
          @click="toggleGroupValue(value)"
        >
          {{ value }}
        </button>
      </div>
    </div>

    <div class="mt-2">
      <span class="mb-1 block text-[9px] text-ink-500">堆叠方式</span>
      <Select
        :model-value="stackMode"
        :options="stackOptions"
        @update:model-value="updateStackMode"
      />
    </div>

    <div class="mt-2 grid grid-cols-2 gap-2">
      <label class="block">
        <span class="mb-1 block text-[9px] text-ink-500">最多系列数</span>
        <input
          type="number"
          min="1"
          max="200"
          class="field-shell w-full text-[10px]"
          :value="groupLimit"
          @change="onNumberChange($event, updateGroupLimit)"
        />
      </label>
      <label class="block">
        <span class="mb-1 block text-[9px] text-ink-500">最多类目数</span>
        <input
          type="number"
          min="1"
          max="500"
          class="field-shell w-full text-[10px]"
          :value="categoryLimit"
          @change="onNumberChange($event, updateCategoryLimit)"
        />
      </label>
    </div>

    <div class="mt-2 flex items-center justify-between gap-2">
      <span class="shrink-0 text-[9px] text-ink-500">同组同值聚合</span>
      <Select
        :model-value="aggregate"
        :options="aggregateOptions"
        @update:model-value="onAggregateChange"
      />
    </div>

    <p class="mt-2 text-[9px] leading-relaxed text-ink-600">
      按所选字段把行拆成多个系列，每个系列名就是该字段的值；取值太多时会拖慢渲染，默认只取前 24 个系列、100 个类目。
      例如数值字段选「实际用电量」、名称分组字段选「时段」并开启堆叠，30 天的 96 个时段会在 tooltip 里分开显示，同一天的柱叠成一根。
    </p>
  </div>
</template>
