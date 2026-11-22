<script setup lang="ts">
import { watchEffect } from 'vue'
import WorkspaceShell from '@/components/layout/WorkspaceShell.vue'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

const { state } = useWorkspaceStore()

watchEffect(() => {
  document.documentElement.classList.toggle('dark', state.ui.theme === 'dark')
})
</script>

<template>
  <WorkspaceShell />
</template>
