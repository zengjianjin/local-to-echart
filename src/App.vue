<script setup lang="ts">
import { onMounted, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import WorkspaceShell from '@/components/layout/WorkspaceShell.vue'
import { notifyElectronLocale } from '@/i18n/electron'
import { currentLocale } from '@/i18n'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

const { state } = useWorkspaceStore()
const { t } = useI18n()

watchEffect(() => {
  document.documentElement.classList.toggle('dark', state.ui.theme === 'dark')
  document.documentElement.lang = currentLocale()
  document.title = t('common.appName')
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('common.description'))
})

onMounted(() => {
  notifyElectronLocale(state.ui.locale)
})
</script>

<template>
  <WorkspaceShell />
</template>
