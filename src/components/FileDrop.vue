<script setup>
import { ref } from 'vue'

defineProps({ busy: { type: Boolean, default: false } })
const emit = defineEmits(['file', 'demo'])

const dragging = ref(false)
const fileInput = ref(null)

function onDrop(event) {
  dragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) emit('file', file)
}

function onChange(event) {
  const file = event.target.files?.[0]
  if (file) emit('file', file)
  event.target.value = ''
}
</script>

<template>
  <div class="card">
    <h2 class="card-title">数据来源</h2>
    <div
      class="dropzone"
      :class="{ dragging }"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
    >
      <div class="dropzone-icon">📥</div>
      <strong>{{ busy ? '正在解析文件…' : '拖入 CSV / Excel 文件' }}</strong>
      <span>或点击选择 · 支持 .csv / .tsv / .xlsx / .xls</span>
      <button class="btn" type="button" @click.stop="emit('demo')">试用示例数据</button>
    </div>
    <input ref="fileInput" type="file" accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm" hidden @change="onChange" />
  </div>
</template>
