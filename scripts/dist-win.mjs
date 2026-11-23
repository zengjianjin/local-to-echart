import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const env = {
  ...process.env,
  ELECTRON_MIRROR: process.env.ELECTRON_MIRROR || 'https://npmmirror.com/mirrors/electron/',
  ELECTRON_BUILDER_BINARIES_MIRROR:
    process.env.ELECTRON_BUILDER_BINARIES_MIRROR || 'https://npmmirror.com/mirrors/electron-builder-binaries/',
}

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const unpackedDir = path.join(process.cwd(), 'release', 'win-unpacked')
let outputDir = 'release'

if (process.platform === 'win32') {
  spawnSync('taskkill', ['/F', '/IM', 'Local to ECharts Studio.exe'], { stdio: 'ignore' })
}

let cleaned = false
for (let attempt = 1; attempt <= 3 && !cleaned; attempt++) {
  try {
    rmSync(unpackedDir, { recursive: true, force: true })
    cleaned = true
  } catch (error) {
    if (attempt === 3) {
      outputDir = `release-${Date.now()}`
      console.warn(`警告：无法清理 ${unpackedDir}（${error.message}），改用 ${outputDir} 输出。`)
    } else {
      await delay(500)
    }
  }
}

function run(args) {
  const result = spawnSync(pnpm, args, {
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(['run', 'build'])
run(['exec', 'electron-builder', '--win', `-c.directories.output=${outputDir}`])
