// Records the animated GIFs shown in the README (GitHub and npm both render
// GIFs; npm does not play video). Each clip is the real library running in
// headless Chrome: frames are captured from the canvas at a fixed rate from
// the moment a build starts until the next one begins, then encoded in the
// page with gifenc.
//
//   npm run build:lib && npm run media            all clips
//   npm run media -- hero mario                   only these
//
// Needs a local Chrome or Edge (puppeteer-core does not download one); set
// CHROME_PATH if it is not in the usual place. Output: .github/media/*.gif

import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import puppeteer from 'puppeteer-core'

const ROOT = resolve(import.meta.dirname, '..')
const OUT = join(ROOT, '.github/media')
const BG = '#0b1020' // the site's stage colour; reads well on GitHub's light and dark themes

// name → what to record. `builds` play in order; the clip ends when `count`
// builds have finished (the next one starting marks the end).
const CLIPS = {
  hero: { text: 'PIXELMARK', builds: ['laser', 'sand', 'matrix', 'tetris'], count: 4, width: 720, palette: 'ocean' },
  mario: { text: 'PIXELMARK', builds: ['mario'], variants: { mario: { mode: 'run' } }, width: 560, palette: 'gold' },
  starwars: { text: 'PIXELMARK', builds: ['starwars'], variants: { starwars: { scene: 'duel' } }, width: 560, palette: 'ocean' },
  dragonball: { text: 'PIXELMARK', builds: ['dragonball'], width: 560, palette: 'ember' },
  streetfighter: { text: 'PIXELMARK', builds: ['streetfighter'], width: 560, palette: 'rose' },
}
const FPS = 15
const SPEED = 0.7 // playback speed: below 1 plays the clips slower than real time, easier to follow

const chromePath = process.env.CHROME_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => existsSync(p))
if (!chromePath) { console.error('readme-media: no Chrome found, set CHROME_PATH'); process.exit(1) }

const lib = join(ROOT, 'packages/pixelmark/dist')
if (!existsSync(join(lib, 'vanilla.js'))) { console.error('readme-media: run `npm run build:lib` first'); process.exit(1) }

// a tiny static server: ES modules cannot be imported from file:// URLs
const PAGE = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:${BG}}canvas{display:block}</style><canvas id="c"></canvas>`
const types = { '.js': 'text/javascript', '.html': 'text/html' }
const server = createServer((req, res) => {
  const url = req.url.split('?')[0]
  if (url === '/') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(PAGE); return }
  const file = url.startsWith('/gifenc/') ? join(ROOT, 'node_modules/gifenc/dist', url.slice(8)) : join(lib, url)
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' })
  res.end(readFileSync(file))
}).listen(0)
const base = `http://localhost:${server.address().port}`

const browser = await puppeteer.launch({ executablePath: chromePath, headless: true, args: ['--force-device-scale-factor=1'] })
mkdirSync(OUT, { recursive: true })
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CLIPS)

try {
  for (const name of wanted) {
    const clip = CLIPS[name]
    if (!clip) { console.warn(`readme-media: unknown clip "${name}"`); continue }
    const page = await browser.newPage()
    await page.setViewport({ width: clip.width, height: 400 })
    await page.goto(base)
    const b64 = await page.evaluate(async (c, fps, bg, speed) => {
      const { mount, wordmarkSize } = await import('/vanilla.js')
      const { GIFEncoder, quantize, applyPalette } = await import('/gifenc/gifenc.esm.js')
      const canvas = document.getElementById('c')
      const { cols, rows } = wordmarkSize(c.text)
      canvas.style.width = `${c.width}px`
      canvas.style.aspectRatio = `${cols} / ${rows}`

      const frames = []
      let started = 0
      let timer = 0
      const done = new Promise((finish) => {
        const grab = document.createElement('canvas')
        const g = grab.getContext('2d', { willReadFrequently: true })
        const capture = () => {
          grab.width = canvas.width
          grab.height = canvas.height
          g.fillStyle = bg
          g.fillRect(0, 0, grab.width, grab.height)
          g.drawImage(canvas, 0, 0)
          frames.push(g.getImageData(0, 0, grab.width, grab.height).data)
        }
        mount(canvas, {
          text: c.text,
          builds: c.builds,
          variants: c.variants,
          palette: c.palette,
          tone: 'dark',
          interactive: false,
          hold: 1.6,
          onBuild: () => {
            started += 1
            if (started === 1) timer = setInterval(capture, 1000 / fps)
            if (started > (c.count || 1)) { clearInterval(timer); finish() }
          },
        })
      })
      await done

      // one palette for the whole clip (sampled across frames) keeps colours steady
      const w = canvas.width
      const h = canvas.height
      const step = Math.max(1, Math.floor(frames.length / 12))
      const sample = new Uint8ClampedArray(frames.filter((_, i) => i % step === 0).flatMap((f) => [...f]))
      const palette = quantize(sample, 64)
      const gif = GIFEncoder()
      for (const f of frames) gif.writeFrame(applyPalette(f, palette), w, h, { palette, delay: Math.round(1000 / fps / speed) })
      gif.finish()

      // contact sheet of 8 evenly spaced frames, to check a clip without a GIF viewer
      const sheet = document.createElement('canvas')
      sheet.width = w * 2
      sheet.height = h * 4
      const sg = sheet.getContext('2d')
      for (let i = 0; i < 8; i++) {
        const f = frames[Math.floor(((i + 0.5) / 8) * frames.length)]
        sg.putImageData(new ImageData(new Uint8ClampedArray(f), w, h), (i % 2) * w, Math.floor(i / 2) * h)
      }
      const bytes = gif.bytes()
      let s = ''
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
      return { gif: btoa(s), sheet: sheet.toDataURL('image/png').split(',')[1], frames: frames.length }
    }, clip, FPS, BG, SPEED)
    const file = join(OUT, `${name}.gif`)
    writeFileSync(file, Buffer.from(b64.gif, 'base64'))
    if (process.env.SHEET) writeFileSync(join(process.env.SHEET, `${name}-sheet.png`), Buffer.from(b64.sheet, 'base64'))
    console.log(`readme-media: ${name}.gif  ${(statSync(file).size / 1024).toFixed(0)} KB, ${b64.frames} frames`)
    await page.close()
  }
} finally {
  await browser.close()
  server.close()
}
