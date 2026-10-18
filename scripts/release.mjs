// Bump the library version, stamp the changelog and tag the release.
//
//   npm run release -- patch|minor|major
//
// Then `git push --follow-tags`: the Release workflow publishes the tag to npm.
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const level = process.argv[2]
if (!['patch', 'minor', 'major'].includes(level)) {
  console.error('usage: npm run release -- patch|minor|major')
  process.exit(1)
}
const sh = (cmd) => execSync(cmd, { stdio: 'pipe' }).toString().trim()
if (sh('git status --porcelain')) {
  console.error('Commit or stash your changes first.')
  process.exit(1)
}

const pkgPath = 'packages/pixelmark/package.json'
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const [ma, mi, pa] = pkg.version.split('.').map(Number)
const next = level === 'major' ? `${ma + 1}.0.0` : level === 'minor' ? `${ma}.${mi + 1}.0` : `${ma}.${mi}.${pa + 1}`
pkg.version = next
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

// "## [Unreleased]" becomes the new version; a fresh empty one goes on top
const log = readFileSync('CHANGELOG.md', 'utf8')
if (!log.includes('## [Unreleased]')) {
  console.error('CHANGELOG.md has no "## [Unreleased]" section.')
  process.exit(1)
}
const date = new Date().toISOString().slice(0, 10)
writeFileSync('CHANGELOG.md', log.replace('## [Unreleased]', `## [Unreleased]\n\n## [${next}] - ${date}`))

sh('npm install --package-lock-only --ignore-scripts')
sh(`git add ${pkgPath} CHANGELOG.md package-lock.json`)
sh(`git commit -m "release: v${next}"`)
sh(`git tag -a v${next} -m "v${next}"`)
console.log(`Tagged v${next}. Push with: git push --follow-tags`)
