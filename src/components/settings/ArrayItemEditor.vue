<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Copy, Trash2, ArrowUp, ArrowDown, GripVertical, X } from 'lucide-vue-next'
import type { FieldSchema, SerializableNode } from '@/types'
import Button from '@/components/ui/Button.vue'
import Collapsible from '@/components/ui/Collapsible.vue'
import Input from '@/components/ui/Input.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { getOptionValue } from '@/utils/optionPath'
import { cloneOption } from '@/utils/optionPath'

const FieldControl = defineAsyncComponent(() => import('./FieldControl.vue'))

const props = defineProps<{ field: FieldSchema; basePath?: string }>()
const { t } = useI18n()
const { state } = useWorkspaceStore()
const { setOptionValueAt } = useWorkspaceStore()

const arrayPath = computed(() => {
  const path = props.field.path
  if (!props.basePath || !path) return path || props.basePath || ''
  if (path.startsWith(props.basePath + '.') || path.startsWith(props.basePath + '[')) return path
  return `${props.basePath}.${path}`
})

const items = computed<SerializableNode[]>(() => {
  const value = getOptionValue(state.project.option, arrayPath.value)
  return Array.isArray(value) ? value : []
})

const isPrimitiveArray = computed(
  () => props.field.itemFields?.length === 1 && props.field.itemFields[0].path === '',
)

const isColorPalette = computed(
  () => isPrimitiveArray.value && props.field.itemFields?.[0]?.kind === 'color',
)

const colorDrafts = ref<Record<number, string>>({})
const colorTimers = new Map<number, ReturnType<typeof setTimeout>>()

function paletteValue(index: number, item: SerializableNode): string {
  const draft = colorDrafts.value[index]
  if (draft !== undefined) return draft
  return typeof item === 'string' ? item : '#4F8CFF'
}

function commitPaletteColor(index: number) {
  const timer = colorTimers.get(index)
  if (timer) {
    clearTimeout(timer)
    colorTimers.delete(index)
  }
  const draft = colorDrafts.value[index]
  if (draft === undefined) return
  delete colorDrafts.value[index]
  updatePrimitive(index, draft)
}

function queuePaletteColor(index: number, value: string) {
  colorDrafts.value[index] = value
  const existing = colorTimers.get(index)
  if (existing) clearTimeout(existing)
  colorTimers.set(
    index,
    setTimeout(() => {
      colorTimers.delete(index)
      commitPaletteColor(index)
    }, 120),
  )
}

function flushPaletteColors(): SerializableNode[] {
  const next = [...items.value]
  let changed = false
  for (const index of colorTimers.keys()) {
    const draft = colorDrafts.value[index]
    if (draft !== undefined) {
      next[index] = draft
      changed = true
    }
  }
  colorTimers.forEach((timer) => clearTimeout(timer))
  colorTimers.clear()
  colorDrafts.value = {}
  if (changed) write(next)
  return next
}

function removePaletteColor(index: number) {
  const next = flushPaletteColors()
  write(next.filter((_, itemIndex) => itemIndex !== index))
}

onBeforeUnmount(() => {
  flushPaletteColors()
})

function defaultForField(field: FieldSchema): SerializableNode | undefined {
  return field.default === undefined ? undefined : (field.default as SerializableNode)
}

function createItem(): SerializableNode {
  const fields = props.field.itemFields ?? []
  if (isPrimitiveArray.value) {
    const value = defaultForField(fields[0])
    return value ?? (fields[0]?.kind === 'color' ? '#4F8CFF' : '')
  }
  const seed = Array.isArray(props.field.default) ? props.field.default[0] : undefined
  if (seed !== undefined && seed !== null && typeof seed === 'object' && !Array.isArray(seed)) {
    return cloneOption(seed as SerializableNode)
  }
  const item: Record<string, SerializableNode> = {}
  for (const field of fields) {
    if (!field.path || field.path.includes('.')) continue
    const value = defaultForField(field)
    if (value !== undefined) item[field.path] = value
  }
  return item
}

function visibleFields(index: number): FieldSchema[] {
  const item = items.value[index]
  const type =
    item && typeof item === 'object' && !Array.isArray(item)
      ? String((item as Record<string, unknown>).type ?? '')
      : ''
  return (props.field.itemFields ?? []).filter(
    (field) => !field.chartTypes || (type && field.chartTypes.includes(type)),
  )
}

function itemTitle(item: SerializableNode, index: number): string {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    const record = item as Record<string, unknown>
    return String(record.name ?? record.type ?? record.id ?? t('settings.itemIndex', { index: index + 1 }))
  }
  return t('settings.itemIndex', { index: index + 1 })
}

function write(next: SerializableNode[]) {
  setOptionValueAt(arrayPath.value, next)
}

function addItem() {
  write([...items.value, createItem()])
}

function duplicateItem(index: number) {
  const next = [...items.value]
  next.splice(index + 1, 0, cloneOption(next[index]))
  write(next)
}

function removeItem(index: number) {
  write(items.value.filter((_, itemIndex) => itemIndex !== index))
}

function moveItem(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= items.value.length) return
  const next = [...items.value]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  write(next)
}

function updatePrimitive(index: number, value: string) {
  const next = [...items.value]
  next[index] = value
  write(next)
}
</script>

<template>
  <div class="space-y-2">
    <template v-if="isColorPalette">
      <div class="text-[11px] font-medium text-ink-200">{{ field.label }}</div>

      <div v-if="items.length" class="flex flex-wrap items-center gap-2.5">
        <div
          v-for="(item, index) in items"
          :key="`${arrayPath}-swatch-${index}`"
          class="group relative"
        >
          <input
            type="color"
            :value="paletteValue(index, item)"
            :aria-label="`${field.label} ${index + 1}`"
            class="h-8 w-8 cursor-pointer rounded-lg border border-white/15 bg-transparent p-0.5 transition hover:border-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            @input="queuePaletteColor(index, ($event.target as HTMLInputElement).value)"
            @change="commitPaletteColor(index)"
          />
          <button
            type="button"
            class="absolute -right-1.5 -top-1.5 z-10 hidden h-4 w-4 items-center justify-center rounded-full bg-ink-950 text-ink-400 ring-1 ring-white/15 transition hover:text-rose-400 group-hover:flex"
            :title="t('common.delete')"
            @click="removePaletteColor(index)"
          >
            <X :size="9" />
          </button>
        </div>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-white/15 text-ink-500 transition hover:border-primary/50 hover:text-primary"
          :title="t('settings.addItem')"
          @click="addItem"
        >
          <Plus :size="14" />
        </button>
      </div>
      <div
        v-else
        class="flex items-center justify-between rounded-lg border border-dashed border-white/10 px-3 py-2 text-[10px] text-ink-500"
      >
        <span>{{ t('settings.emptyItems') }}</span>
        <Button size="sm" variant="soft" @click="addItem">
          <Plus :size="12" />
          <span>{{ t('settings.addItem') }}</span>
        </Button>
      </div>
    </template>

    <template v-else>
      <div class="flex items-center justify-between">
        <div class="text-[11px] font-medium text-ink-200">{{ field.label }}</div>
        <Button size="icon" variant="soft" :title="t('settings.addItem')" @click="addItem">
          <Plus :size="13" />
        </Button>
      </div>

      <div v-if="!items.length" class="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-[10px] text-ink-500">
        {{ t('settings.emptyItems') }}
      </div>

      <div v-for="(item, index) in items" :key="`${arrayPath}-${index}`" class="space-y-2">
        <Collapsible :title="itemTitle(item, index)" :description="t('settings.itemDetailIndex', { index })" :open="index === 0">
          <template #actions>
            <Button size="icon" :title="t('common.moveUp')" :disabled="index === 0" @click="moveItem(index, -1)">
              <ArrowUp :size="12" />
            </Button>
            <Button size="icon" :title="t('common.moveDown')" :disabled="index === items.length - 1" @click="moveItem(index, 1)">
              <ArrowDown :size="12" />
            </Button>
            <Button size="icon" :title="t('common.copy')" @click="duplicateItem(index)">
              <Copy :size="12" />
            </Button>
            <Button size="icon" variant="danger" :title="t('common.delete')" @click="removeItem(index)">
              <Trash2 :size="12" />
            </Button>
          </template>
          <template #default>
            <div v-if="isPrimitiveArray" class="flex items-center gap-2">
              <GripVertical :size="12" class="text-ink-600" />
              <Input
                :model-value="String(item ?? '')"
                @update:model-value="updatePrimitive(index, $event)"
              />
            </div>

            <div v-else class="space-y-3">
              <FieldControl
                v-for="itemField in visibleFields(index)"
                :key="itemField.path"
                :field="itemField"
                :base-path="`${arrayPath}[${index}]`"
              />
            </div>
          </template>
        </Collapsible>
      </div>
    </template>
  </div>
</template>
