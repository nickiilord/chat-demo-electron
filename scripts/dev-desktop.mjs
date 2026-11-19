import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import electronPath from 'electron'

const root = path.resolve(import.meta.dirname, '..')
const isWindows = process.platform === 'win32'

/** 开发时先编译主进程，再启动 rspack 开发服务器和 Electron。 */
const build = spawnSync('pnpm run build:electron', {
  cwd: root,
  stdio: 'inherit',
  shell: true,
})
if (build.status !== 0) {
  process.exit(build.status ?? 1)
}

const server = spawn('pnpm exec rspack serve -c rspack.config.ts', {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' },
})

const waitForServer = async (url, timeoutMs) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status < 500) {
        return true
      }
    } catch {
      // 开发服务器还没开始监听。
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return false
}

const start = async () => {
  if (!(await waitForServer('http://localhost:8090', 60_000))) {
    console.error('开发服务器启动超时')
    server.kill()
    process.exit(1)
  }
  const app = spawn(electronPath, ['.'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, CHAT_DEV_SERVER: 'http://localhost:8090' },
  })
  app.on('exit', (code) => {
    server.kill()
    process.exit(code ?? 0)
  })
}

process.on('SIGINT', () => {
  server.kill()
  process.exit(0)
})

void start()
