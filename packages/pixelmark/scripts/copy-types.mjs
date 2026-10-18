// Ship the hand-written type definitions next to the built files
import { copyFileSync } from 'node:fs'

for (const f of ['index.d.ts', 'vanilla.d.ts']) copyFileSync(`src/${f}`, `dist/${f}`)
