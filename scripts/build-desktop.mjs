import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')

for (const script of ['build:renderer', 'build:electron']) {
  const result = spawnSync(`pnpm run ${script}`, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
