<script setup lang="ts">
import { computed } from 'vue'
import type { CellValue, Dataset } from '../types'

const props = withDefaults(defineProps<{
  dataset: Dataset
  excludedRows?: number[]
  fill?: boolean
}>(), {
  excludedRows: () => [],
  fill: false,
})
const emit = defineEmits<{
  'toggle-row': [index: number]
  'reset-rows': []
}>()

const excluded = computed(() => new Set(props.excludedRows))
const visibleRows = computed(() => props.dataset.rows.slice(0, 100))
const numeric = computed(() => new Set(props.dataset.numericColumns))

function display(value: CellValue): string | number {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'number') return Number(value.toFixed(4)).toLocaleString('zh-CN')
  return value
}
</script>

<template>
  <div class="card table-card" :class="{ fill }">
    <div class="table-head">
      <h2>数据预览</h2>
      <span>
        {{ dataset.rowCount }} 行 · {{ dataset.columns.length }} 列
        <template v-if="excludedRows.length"> · 已剔除 {{ excludedRows.length }} 行</template>
        <template v-if="dataset.rowCount > 100"> · 仅显示前 100 行</template>
      </span>
      <button v-if="excludedRows.length" class="btn" type="button" @click="emit('reset-rows')">恢复全部行</button>
    </div>
    <p class="table-hint">点击行首复选框剔除该行；剔除后不参与图表和导出，但仍显示在这里以便恢复。</p>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th class="row-check"></th>
            <th v-for="col in dataset.columns" :key="col" :class="{ num: numeric.has(col) }">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in visibleRows" :key="i" :class="{ 'row-excluded': excluded.has(i) }">
            <td class="row-check">
              <input type="checkbox" :checked="!excluded.has(i)" @change="emit('toggle-row', i)" />
            </td>
            <td v-for="col in dataset.columns" :key="col" :class="{ num: numeric.has(col) }">{{ display(row[col]) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
