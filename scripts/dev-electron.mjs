import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const port = 1422
const url = `http://localhost:${port}`
const viteBin = path.join(root, 'node_modules/vite/bin/vite.js')
const electronBin = path.join(
  root,
  'node_modules/electron/dist',
  process.platform === 'win32' ? 'electron.exe' : 'electron',
)

function waitForServer(timeoutMs = 30000) {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const response = await fetch(url)
        if (response.ok) {
          resolve()
          return
        }
      } catch {
        // Vite 尚未就绪，继续轮询。
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('Vite 开发服务器启动超时'))
        return
      }
      setTimeout(tick, 300)
    }
    tick()
  })
}

const vite = spawn(process.execPath, [viteBin, '--host', '0.0.0.0', '--port', String(port), '--strictPort'], {
  cwd: root,
  stdio: 'inherit',
})

const cleanEnv = { ...process.env, VLE_DEV_URL: url }
delete cleanEnv.ELECTRON_RUN_AS_NODE

let electron = null

async function start() {
  await waitForServer()
  electron = spawn(electronBin, [root], {
    cwd: root,
    env: cleanEnv,
    stdio: 'inherit',
  })
}

function shutdown() {
  if (electron && !electron.killed) electron.kill()
  if (!vite.killed) vite.kill()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

start().catch((error) => {
  console.error('[dev-electron] 启动失败:', error)
  shutdown()
})
