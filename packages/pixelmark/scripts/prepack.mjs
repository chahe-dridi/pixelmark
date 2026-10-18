// npm shows the package folder's README: publish the repo's README and LICENSE
import { copyFileSync } from 'node:fs'

copyFileSync('../../README.md', 'README.md')
copyFileSync('../../LICENSE', 'LICENSE')
