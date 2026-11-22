<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter, lintGutter } from '@codemirror/lint'
import { indentWithTab } from '@codemirror/commands'
import { useOptionEditor } from '@/composables/useOptionEditor'

const { jsonDraft, jsonError, onJsonInput, applyDraft, syncDraft } = useOptionEditor()

let view: EditorView | null = null

onMounted(() => {
  syncDraft()
  const parent = document.getElementById('json-editor-host')
  if (!parent) return
  view = new EditorView({
    parent,
    state: EditorState.create({
      doc: jsonDraft.value,
      extensions: [
        basicSetup,
        json(),
        linter(jsonParseLinter()),
        lintGutter(),
        keymap.of([indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onJsonInput(update.state.doc.toString())
        }),
      ],
    }),
  })
})

watch(
  jsonDraft,
  (value) => {
    if (!view || view.state.doc.toString() === value) return
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
  },
  { flush: 'sync' },
)

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-ink-950/70">
    <div class="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 py-2">
      <span class="text-[10px] font-medium text-ink-300">完整 ECharts Option</span>
      <span class="text-[9px] text-ink-600">未知字段会原样保留</span>
      <div class="ml-auto flex gap-1.5">
        <button
          type="button"
          class="rounded-md border border-white/10 px-2 py-1 text-[10px] text-ink-300 transition hover:border-primary/40 hover:text-ink-50"
          @click="syncDraft"
        >
          重新载入
        </button>
        <button
          type="button"
          class="rounded-md bg-primary/15 px-2 py-1 text-[10px] text-primary-100 transition hover:bg-primary/25"
          @click="applyDraft"
        >
          立即应用
        </button>
      </div>
    </div>

    <div id="json-editor-host" class="min-h-0 flex-1 overflow-hidden" />

    <div
      v-if="jsonError"
      class="shrink-0 border-t border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-[10px] text-rose-700 dark:text-rose-200"
    >
      {{ jsonError }}
    </div>
  </div>
</template>
