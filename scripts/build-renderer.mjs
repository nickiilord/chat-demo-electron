import { spawnSync } from 'node:child_process'
import { rm } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
await rm(path.join(root, 'dist'), { recursive: true, force: true })
const result = spawnSync('pnpm exec rspack build -c rspack.config.ts', {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'production' },
})
process.exit(result.status ?? 1)
