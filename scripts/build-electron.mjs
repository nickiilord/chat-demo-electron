import { rm } from 'node:fs/promises'
import path from 'node:path'
import { build } from 'esbuild'

const root = path.resolve(import.meta.dirname, '..')
const outdir = path.join(root, 'electron-dist')

await rm(outdir, { recursive: true, force: true })

await build({
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['electron'],
  sourcemap: false,
  legalComments: 'none',
  logLevel: 'info',
  entryPoints: [path.join(root, 'electron/main.ts')],
  outfile: path.join(outdir, 'main.cjs'),
})
