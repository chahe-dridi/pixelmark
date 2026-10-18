// Regenerate public/og.png (the social card) and the PNG app icons with
// headless Chrome. Run the site first (`npm run build && npm run preview`),
// then: npm run og -w @pixelmark/site [-- http://localhost:4173]
// Reduced motion makes the wordmark draw its finished state at once.
// Set CHROME to your Chrome/Edge binary if it isn't found.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const base = process.argv[2] || 'http://localhost:4173'
const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const chrome = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find(existsSync)
if (!chrome) throw new Error('Chrome not found: set CHROME=/path/to/chrome')

const shot = (url, out, w, h, wait = 3000) => {
  execFileSync(chrome, ['--headless=new', '--force-prefers-reduced-motion', '--disable-gpu', '--hide-scrollbars', `--window-size=${w},${h}`, `--virtual-time-budget=${wait}`, `--screenshot=${out}`, url], { stdio: 'ignore' })
  console.log('wrote', out)
}

shot(`${base}/og`, join(pub, 'og.png'), 1200, 630, 6000)
const icon = pathToFileURL(join(pub, 'favicon.svg')).href
for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) shot(icon, join(pub, name), size, size, 200)
