<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Trash2 } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Collapsible from '@/components/ui/Collapsible.vue'
import SeriesNameFieldMapper from './SeriesNameFieldMapper.vue'
import SeriesBulkEditor from './SeriesBulkEditor.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

const { t } = useI18n()
const { state, currentSeriesGroups, addSeriesGroup, removeSeriesGroup } = useWorkspaceStore()

const groups = computed(() => currentSeriesGroups())
const openGroups = ref<Record<string, boolean>>({})

function columnName(index: number | undefined): string {
  if (index === undefined || index < 0) return ''
  return state.table?.columns[index] ?? ''
}

function groupTitle(index: number): string {
  const field = columnName(groups.value[index]?.valueField)
  return field
    ? t('settings.groupConfig', { index: index + 1, field })
    : t('settings.groupConfigShort', { index: index + 1 })
}

function groupDescription(index: number): string {
  const group = groups.value[index]
  if (!group) return ''
  const names = group.nameFields.map((field) => columnName(field)).filter(Boolean)
  const parts = [names.length ? t('settings.groupBy', { names: names.join(' / ') }) : t('settings.groupNoNameField')]
  if (group.stackMode !== 'none') parts.push(t('settings.groupStacked'))
  return parts.join(' · ')
}

function isOpen(index: number): boolean {
  const group = groups.value[index]
  return group ? (openGroups.value[group.id] ?? index === 0) : false
}

function setOpen(index: number, value: boolean) {
  const group = groups.value[index]
  if (group) openGroups.value[group.id] = value
}
</script>

<template>
  <div v-if="state.table" class="mb-3 space-y-2">
    <div class="flex items-center justify-between px-0.5">
      <span class="text-[11px] font-medium text-ink-200">{{ t('settings.groupDataConfigs', { count: groups.length }) }}</span>
      <Button size="icon" variant="soft" :title="t('settings.groupAdd')" @click="addSeriesGroup">
        <Plus :size="13" />
      </Button>
    </div>

    <Collapsible
      v-for="(group, index) in groups"
      :key="group.id"
      :title="groupTitle(index)"
      :description="groupDescription(index)"
      :open="isOpen(index)"
      allow-sticky
      @update:open="setOpen(index, $event)"
    >
      <template #actions>
        <Button
          size="icon"
          variant="danger"
          :title="t('settings.groupRemove')"
          :disabled="groups.length <= 1"
          @click="removeSeriesGroup(index)"
        >
          <Trash2 :size="12" />
        </Button>
      </template>
      <SeriesNameFieldMapper :group-index="index" />
      <SeriesBulkEditor :group-index="index" />
    </Collapsible>
  </div>
</template>
