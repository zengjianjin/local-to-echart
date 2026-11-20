<script setup>
import { computed, reactive, watch } from 'vue'
import { CHART_TYPES, AGGREGATES, PALETTE_LABELS, PALETTES } from '../utils/chart.js'

const model = defineModel({ type: Object, required: true })
const props = defineProps({ dataset: { type: Object, required: true } })

// Which option groups are expanded. Basic stays open; advanced groups are
// collapsed by default so the sidebar does not push the chart off screen.
const open = reactive({ basic: true, stack: false, style: false })

// Candidate fields for the stacking dimension: non-numeric ones are the usual
// choice (dates, regions, units), but any column can be used.
const stackCandidates = computed(() => props.dataset.columns)
const stackValueOptions = computed(() => {
  const field = model.value.stackField
  if (!field || !props.dataset.columns.includes(field)) return []
  return [...new Set(props.dataset.rows.map((r) => String(r[field] ?? '')).filter((v) => v !== ''))]
})
// The generator treats an empty selection as "first 4 by default", so the UI
// mirrors that: active values are the stored ones, or the default first four.
const activeStackValues = computed(() => (
  model.value.stackValues.length ? model.value.stackValues : stackValueOptions.value.slice(0, 4)
))
const allStackSelected = computed(() => (
  stackValueOptions.value.length > 0 && activeStackValues.value.length === stackValueOptions.value.length
))

watch(() => model.value.stackField, (field) => {
  model.value.stackValues = []
  if (field) open.stack = true
})

function toggleAllStackValues() {
  // Toggling back to empty restores the generator's "first 4" default.
  model.value.stackValues = allStackSelected.value ? [] : [...stackValueOptions.value]
}

function toggleStackValue(value) {
  const set = new Set(activeStackValues.value)
  if (set.has(value)) set.delete(value)
  else set.add(value)
  model.value.stackValues = stackValueOptions.value.filter((v) => set.has(v))
}

function toggleXField(field) {
  const current = model.value.xFields || []
  if (current.includes(field)) {
    if (current.length > 1) model.value.xFields = current.filter((f) => f !== field)
  } else {
    model.value.xFields = [...current, field]
  }
}

function toggleField(field) {
  const current = model.value.yFields
  if (current.includes(field)) {
    if (current.length > 1) model.value.yFields = current.filter((f) => f !== field)
  } else {
    model.value.yFields = [...current, field]
  }
}
</script>

<template>
  <div class="card options-card">
    <div class="options-head">
      <h2 class="card-title">图表配置</h2>
      <span class="options-summary">{{ model.type === 'bar' ? '柱状图' : model.type === 'line' ? '折线图' : '饼图' }} · {{ model.yFields.length }} 个数值字段</span>
    </div>

    <section class="opt-group">
      <button type="button" class="opt-head" :class="{ open: open.basic }" @click="open.basic = !open.basic">
        <span>基础</span><span class="chev">›</span>
      </button>
      <div v-show="open.basic" class="opt-body">
        <div class="field">
          <label class="field-label">图表类型</label>
          <div class="segmented">
            <button
              v-for="item in CHART_TYPES"
              :key="item.value"
              type="button"
              :class="{ active: model.type === item.value }"
              @click="model.type = item.value"
            >{{ item.label }}</button>
          </div>
        </div>

        <div class="field">
          <label class="field-label">{{ model.type === 'pie' ? '分类字段（可多选拼接）' : 'X 轴字段（可多选拼接）' }}</label>
          <div class="check-list">
            <button
              v-for="col in dataset.columns"
              :key="col"
              type="button"
              class="check-chip"
              :class="{ on: model.xFields?.includes(col) }"
              @click="toggleXField(col)"
            >{{ model.xFields?.includes(col) ? '✓' : '+' }} {{ col }}</button>
          </div>
          <p class="field-hint">按表中列顺序拼接，例如「月份 / 地区」→ 1月 / 华东</p>
        </div>

        <div v-if="model.xFields?.length > 1" class="field">
          <label class="field-label">拼接分隔符</label>
          <input v-model="model.xSeparator" type="text" placeholder=" / " />
        </div>

        <div class="field">
          <label class="field-label">数值字段（可多选，至少 1 个）</label>
          <div v-if="dataset.numericColumns.length" class="check-list">
            <button
              v-for="col in dataset.numericColumns"
              :key="col"
              type="button"
              class="check-chip"
              :class="{ on: model.yFields.includes(col) }"
              @click="toggleField(col)"
            >{{ model.yFields.includes(col) ? '✓' : '+' }} {{ col }}</button>
          </div>
          <p v-else class="field-hint">没有检测到数值列，请检查数据格式</p>
        </div>
      </div>
    </section>

    <section class="opt-group">
      <button type="button" class="opt-head" :class="{ open: open.stack }" @click="open.stack = !open.stack">
        <span>堆叠 <em v-if="model.stackField" class="opt-badge">{{ model.stackField }}</em></span><span class="chev">›</span>
      </button>
      <div v-show="open.stack" class="opt-body">
        <div class="field">
          <label class="field-label">按字段堆叠（可选）</label>
          <select v-model="model.stackField">
            <option value="">不堆叠</option>
            <option v-for="col in stackCandidates" :key="col" :value="col">{{ col }}</option>
          </select>
          <p class="field-hint">若 X 轴是「时段」，可选「结算日期」让同一时段刻度上堆叠多个日期</p>
        </div>

        <div v-if="model.stackField && stackValueOptions.length" class="field">
          <div class="field-label-row">
            <label class="field-label">参与堆叠的取值（{{ activeStackValues.length }}/{{ stackValueOptions.length }} 项）</label>
            <button type="button" class="mini-link" @click="toggleAllStackValues">
              {{ allStackSelected ? '恢复默认' : '全选' }}
            </button>
          </div>
          <!-- No inner scroll: the sidebar is already scrollable. A nested
               scroll area was hard to reach and hid most of the values. -->
          <div class="check-list stacked-values">
            <button
              v-for="value in stackValueOptions"
              :key="value"
              type="button"
              class="check-chip"
              :class="{ on: activeStackValues.includes(value) }"
              @click="toggleStackValue(value)"
            >{{ activeStackValues.includes(value) ? '✓' : '+' }} {{ value }}</button>
          </div>
        </div>

        <div v-if="model.stackField" class="field">
          <label class="check-line"><input v-model="model.stacked" type="checkbox" /> 累加堆叠（关闭则同刻度并排显示）</label>
        </div>
      </div>
    </section>

    <section class="opt-group">
      <button type="button" class="opt-head" :class="{ open: open.style }" @click="open.style = !open.style">
        <span>外观与聚合</span><span class="chev">›</span>
      </button>
      <div v-show="open.style" class="opt-body">
        <div class="field">
          <label class="field-label">聚合方式</label>
          <select v-model="model.aggregate">
            <option v-for="item in AGGREGATES" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <p class="field-hint">同一分类下有多行时，按此方式合并数值</p>
        </div>

        <div class="field">
          <label class="field-label">最多显示分类数</label>
          <input v-model.number="model.limit" type="number" min="1" max="100" />
        </div>

        <div class="field">
          <label class="field-label">标题</label>
          <input v-model="model.title" type="text" placeholder="留空则自动生成" />
        </div>

        <div class="field">
          <label class="field-label">配色</label>
          <div class="swatches">
            <button
              v-for="(colors, key) in PALETTES"
              :key="key"
              type="button"
              class="swatch"
              :class="{ on: model.palette === key }"
              :title="PALETTE_LABELS[key]"
              :style="{ background: `linear-gradient(90deg, ${colors.join(',')})` }"
              @click="model.palette = key"
            ></button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
