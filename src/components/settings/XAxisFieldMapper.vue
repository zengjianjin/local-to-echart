<script setup lang="ts">
import { computed } from 'vue'
import Select from '@/components/ui/Select.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

const { state, currentXFields, setXFieldAt } = useWorkspaceStore()

const columnOptions = computed(() => (
  state.table?.columns.map((column, index) => ({ label: column, value: index })) ?? []
))
const xFields = computed(() => currentXFields())
</script>

<template>
  <div class="mb-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-2.5">
    <div class="mb-2 flex items-center justify-between">
      <span class="text-[10px] font-semibold text-ink-200">轴字段映射</span>
      <span class="text-[9px] text-ink-500">每个 X 轴独立选择字段</span>
    </div>
    <template v-if="xFields.length">
      <div v-for="(field, index) in xFields" :key="index" class="mb-1.5 last:mb-0">
        <label class="mb-1 block text-[9px] text-ink-500">X 轴 {{ index + 1 }}</label>
        <Select
          :model-value="field"
          :options="columnOptions"
          @update:model-value="(value) => setXFieldAt(index, Number(value))"
        />
      </div>
      <p v-if="!state.table" class="mt-1 text-[9px] text-ink-600">导入数据后即可选择字段</p>
      <p v-else class="mt-1.5 text-[9px] leading-relaxed text-ink-600">
        系列通过右侧「系列 → X 轴索引」绑定到对应轴；数值列会自动生成系列。若 X 轴字段同时也是某个系列的数值列，会使用复制维度避免系列丢失；柱高按真实数值展示，不新建 Y 轴。
      </p>
    </template>
    <p v-else class="rounded-md border border-dashed border-white/10 px-2 py-3 text-center text-[9px] text-ink-600">
      当前没有 X 轴。请在下方「X 轴列表」新增后选择字段。
    </p>
  </div>
</template>
