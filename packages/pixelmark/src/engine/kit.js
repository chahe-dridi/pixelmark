// Shared pieces for the pixel wordmark: the grid layout constants, easing,
// randomness, and drawing helpers for sprites, text and discs. Every helper
// draws through `box(x, y, w, h)` (grid units, snapped to device pixels), so
// neighbouring cells tile without seams.

export const GH = 13                       // glyph height, in cells
export const PAD_X = 2, PAD_T = 3, PAD_B = 2
export const GROUND = PAD_T + GH           // first row under the letters
// Scenery never paints above this row: the canvas is pulled up under the
// heading line above it, and a filled background would cover that text.
export const SCENE_TOP = PAD_T - 1

export const hash = (a, b, c) => {
  let h = (a * 374761393 + b * 668265263 + c * 1274126177) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) % 1000
}
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const lerp = (a, b, k) => a + (b - a) * k
export const outCubic = (t) => 1 - (1 - t) ** 3
export const outQuart = (t) => 1 - (1 - t) ** 4
export const inCubic = (t) => t * t * t
export const inQuad = (t) => t * t
export const inOut = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2)
export const outBack = (k, s = 1.5) => 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2
// Frame-rate independent easing towards a target: rate is "how snappy"
export const follow = (v, target, rate, dt) => v + (target - v) * (1 - Math.exp(-rate * dt))
export const rand = (a, b) => a + Math.random() * (b - a)
export const pick = (list) => list[Math.floor(Math.random() * list.length)]
export const shuffled = (n) => Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5)
// A fade that rises over `a` seconds from 0 and falls over the last `b`
export const fadeInOut = (t, total, a = 0.25, b = 0.45) => clamp01(t / a) * (1 - clamp01((t - (total - b)) / (b - 0.05)))

// ── Letters ─────────────────────────────────────────────────────────────
export const letterMid = (L, ci) => (L.CX0[ci] + L.CX1[ci] + 1) / 2
// The trailing dot is too narrow to carry its own actor: it rides along
// with the letter before it
export const isNarrow = (L, ci) => L.CX1[ci] - L.CX0[ci] < 3
export const mainLetters = (L) => L.CX0.map((_, ci) => ci).filter((ci) => !isNarrow(L, ci))
export const hostOf = (L, ci) => (isNarrow(L, ci) && ci > 0 ? ci - 1 : ci)
export function pixelsByLetter(L) {
  const out = L.CX0.map(() => [])
  for (let i = 0; i < L.N; i++) out[L.CI[i]].push(i)
  return out
}

// A continuous walk over a letter's pixels (depth first, doubling back at
// dead ends), as if drawn in one stroke. Returns the walk and each pixel's
// first step. Used by the snake and the wand.
export function strokeWalk(L, mine) {
  const at = new Map()
  for (const i of mine) at.set(L.X[i] * 64 + L.Y[i], i)
  const DIRS = [[1, 0], [0, -1], [-1, 0], [0, 1]]
  let start = mine[0]
  for (const i of mine) if (L.Y[i] > L.Y[start] || (L.Y[i] === L.Y[start] && L.X[i] < L.X[start])) start = i
  const first = new Map([[start, 0]]), walk = [start], stack = [start]
  let dir = DIRS[1]
  while (first.size < mine.length && stack.length) {
    const cur = stack[stack.length - 1]
    let next = -1
    for (const d of [dir, ...DIRS]) {
      const j = at.get((L.X[cur] + d[0]) * 64 + L.Y[cur] + d[1])
      if (j !== undefined && !first.has(j)) { next = j; dir = d; break }
    }
    if (next >= 0) { stack.push(next); walk.push(next); first.set(next, walk.length - 1) }
    else { stack.pop(); if (stack.length) walk.push(stack[stack.length - 1]) }
  }
  for (const i of mine) if (!first.has(i)) { walk.push(i); first.set(i, walk.length - 1) }
  return { walk, first }
}

// ── Drawing ─────────────────────────────────────────────────────────────
// A sprite from rows of characters; `colors` maps a character to a colour
// (anything unmapped, like '.', is transparent). sc = cells per sprite pixel.
export function drawSprite(ctx, box, rows, colors, x, y, sc, flip = false) {
  if (!rows) return
  const w = rows[0].length
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    for (let c = 0; c < w; c++) {
      const col = colors[row[flip ? w - 1 - c : c]]
      if (!col) continue
      ctx.fillStyle = col
      box(x + c * sc, y + r * sc, sc, sc)
    }
  }
}
export const spriteW = (rows, sc) => rows[0].length * sc
export const spriteH = (rows, sc) => rows.length * sc

// A filled disc, built from rows snapped to `res` so it stays pixel-art
export function disc(ctx, box, cx, cy, r, color, res = 0.5) {
  if (r <= 0) return
  ctx.fillStyle = color
  for (let y = -r; y < r; y += res) {
    const m = y + res / 2
    const half = Math.sqrt(Math.max(0, r * r - m * m))
    const x0 = Math.round((cx - half) / res) * res, x1 = Math.round((cx + half) / res) * res
    if (x1 > x0) box(x0, Math.round((cy + y) / res) * res, x1 - x0, res)
  }
}

// 3×5 pixel font
export const FONT = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '##.'],
  '!': ['.#.', '.#.', '.#.', '...', '.#.'], '.': ['...', '...', '...', '...', '.#.'], ':': ['...', '.#.', '...', '.#.', '...'],
  '-': ['...', '...', '###', '...', '...'], ' ': ['...', '...', '...', '...', '...'], '%': ['#.#', '..#', '.#.', '#..', '#.#'],
  '?': ['##.', '..#', '.#.', '...', '.#.'], '+': ['...', '.#.', '###', '.#.', '...'], '\'': ['.#.', '.#.', '...', '...', '...'],
}
export const textWidth = (str, sc) => str.length * 4 * sc - sc
// Text in the pixel font, with an optional drop shadow one font-pixel down-right
export function drawText(ctx, box, str, x, y, sc, color, shadow) {
  if (shadow) drawText(ctx, box, str, x + sc, y + sc, sc, shadow)
  ctx.fillStyle = color
  let cx = x
  for (const ch of String(str).toUpperCase()) {
    const g = FONT[ch] || FONT[' ']
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r][c] === '#') box(cx + c * sc, y + r * sc, sc, sc)
    cx += 4 * sc
  }
}
export function drawTextCentered(ctx, box, str, cx, y, sc, color, shadow) {
  drawText(ctx, box, str, cx - textWidth(str, sc) / 2, y, sc, color, shadow)
}

// Tiny particle systems: push({x, y, vx, vy, life, max, size, color, g})
export function stepParticles(list, dt, ctx, box) {
  for (let j = list.length - 1; j >= 0; j--) {
    const q = list[j]
    q.life += dt
    if (q.life >= q.max) { list.splice(j, 1); continue }
    q.vy += (q.g ?? 0) * dt
    q.x += q.vx * dt; q.y += q.vy * dt
    const k = q.life / q.max
    ctx.globalAlpha = q.fade === false ? 1 : 1 - k * k
    ctx.fillStyle = q.color
    const s = q.grow ? q.size * (1 + k * q.grow) : q.size
    box(q.x - s / 2, q.y - s / 2, s, s)
  }
  ctx.globalAlpha = 1
}

// ── Shared bits used by several builds ──────────────────────────────────
export const MINT = '#00C9A7'
export const finalColor = (L, pal, i, tn) => (L.ACC[i] ? pal.acc : pal.ink)[tn]
// A circle outline, e.g. a shockwave
export function ring(ctx, px, py, p, x, y, r, color, width, alpha) {
  ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, p * width)
  ctx.beginPath(); ctx.arc(px(x), py(y), Math.max(0, r * p), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1
}
// A sprite rotated by `angle` about its centre (cx, cy in grid units)
export function drawSpriteRot(ctx, px, py, p, rows, colors, cx, cy, sc, angle, flip = false) {
  const w = rows[0].length, h = rows.length, cell = sc * p
  ctx.save()
  ctx.translate(px(cx), py(cy)); ctx.rotate(angle)
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const col = colors[rows[r][flip ? w - 1 - c : c]]
      if (!col) continue
      ctx.fillStyle = col
      ctx.fillRect((c - w / 2) * cell, (r - h / 2) * cell, cell + 0.6, cell + 0.6)
    }
  }
  ctx.restore()
}
// A line segment in grid units (a saber blade, a beam edge, a wand)
export function stroke(ctx, px, py, p, x0, y0, x1, y1, color, width, alpha = 1) {
  ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, p * width); ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(px(x0), py(y0)); ctx.lineTo(px(x1), py(y1)); ctx.stroke(); ctx.globalAlpha = 1
}
