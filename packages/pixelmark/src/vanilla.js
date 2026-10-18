// Framework-free entry: mount a wordmark on any <canvas>.
//
//   import { mount } from 'pixelmark/vanilla'
//   const mark = mount(document.querySelector('canvas'), { text: 'HELLO' })
//   mark.next()     // skip to the next build
//   mark.destroy()  // stop and clean up

import { createEngine } from './engine/engine.js'
import { normalizeText, wordmarkSize } from './engine/glyphs'

export function mount(canvas, options = {}) {
  const text = normalizeText(options.text ?? 'PIXELMARK') || ' '
  const { cols, rows } = wordmarkSize(text)
  canvas.style.aspectRatio = `${cols} / ${rows}`
  if (!canvas.style.width) canvas.style.width = '100%'
  canvas.style.imageRendering = 'pixelated'
  if (!canvas.hasAttribute('aria-label')) { canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', String(options.text ?? 'PIXELMARK')) }
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  return createEngine(canvas, { ...options, text, reduced: options.reduced ?? reduced })
}

export { CATALOG, BUILD_NAMES, CLASSIC_BUILD_NAMES, SCENE_BUILD_NAMES, TAGS, COLOR_STYLES } from './catalog'
export { PALETTES, PALETTE_NAMES, makePalette } from './engine/palettes'
export { normalizeText, wordmarkSize } from './engine/glyphs'
