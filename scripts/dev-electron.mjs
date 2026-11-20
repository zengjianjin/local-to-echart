// One-command Electron dev: start Vite on 1422, wait until it answers, then
// open Electron pointed at it. Uses only Node built-ins + the electron package.
// Port 1422 keeps this clear of the plain browser preview on 1420.
import { spawn } from 'node:child_process'
import electronPath from 'electron'

const PORT = 1422
const URL = `http://localhost:${PORT}`

const vite = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js',
  '--port', String(PORT),
  '--strictPort',
], { stdio: 'inherit', shell: process.platform === 'win32' })

let electron = null

async function waitForServer(timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(URL, { signal: AbortSignal.timeout(1000) })
      if (res.ok) return true
    } catch { /* not ready yet */ }
    await new Promise((r) => setTimeout(r, 300))
  }
  return false
}

function shutdown(code = 0) {
  if (electron && !electron.killed) electron.kill()
  if (!vite.killed) vite.kill()
  process.exit(code)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

vite.on('exit', (code) => {
  if (code && code !== 0) shutdown(code)
})

const ready = await waitForServer()
if (!ready) {
  console.error(`[dev-electron] Vite did not start on ${URL}`)
  shutdown(1)
}

// Some sandboxed/embedded shells preset ELECTRON_RUN_AS_NODE=1, which makes
// electron.exe behave as plain node and breaks the main process. Drop it.
const cleanEnv = { ...process.env, VLE_DEV_URL: URL }
delete cleanEnv.ELECTRON_RUN_AS_NODE

electron = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  env: cleanEnv,
  shell: process.platform === 'win32',
})

electron.on('exit', (code) => shutdown(code ?? 0))
