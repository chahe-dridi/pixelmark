// Pixel wordmark build: Snake. Loaded on demand by the engine.

import { SCENE_TOP, clamp01, disc, drawText, finalColor, hostOf, mainLetters, pixelsByLetter, rand, stepParticles, strokeWalk, textWidth } from '../engine/kit'

// ═══ Snake ═══════════════════════════════════════════════════════════════
const SNAKE_T = 2.3, SNAKE_LEN = 10
const MINT = '#00C9A7', MINT_DARK = '#00A08A', MINT_HEAD = '#5FF0D2'
const LCD = { bg: '#B5C79C', grid: '#A6B98D', ink: '#2F3A26' }

const snake = {
  name: 'snake',
  setup(L, S) {
    this.nokia = Math.random() < 0.4
    const groups = pixelsByLetter(L)
    const mains = mainLetters(L)
    const walks = mains.map((ci) => {
      const mine = groups[ci].slice()
      L.CX0.forEach((_, cj) => { if (cj !== ci && hostOf(L, cj) === ci) mine.push(...groups[cj]) })
      const { walk } = strokeWalk(L, mine)
      return walk.map((i) => [L.X[i], L.Y[i], i])
    })
    // one snake per letter, or two long snakes crossing between letters
    const lanes = Math.random() < 0.5 ? walks.map((w) => [w]) : [walks.slice(0, Math.ceil(walks.length / 2)), walks.slice(Math.ceil(walks.length / 2))]
    this.snakes = lanes.map((ws, k) => {
      const cells = [], apples = []
      for (const w of ws) {
        if (cells.length) {
          // crawl over to the next letter: across, then up or down
          let [x, y] = cells[cells.length - 1]
          const [tx, ty] = w[0]
          while (x !== tx) { x += Math.sign(tx - x); cells.push([x, y, -1]) }
          while (y !== ty) { y += Math.sign(ty - y); cells.push([x, y, -1]) }
        }
        cells.push(...w)
        apples.push({ step: cells.length - 1, x: w[w.length - 1][0], y: w[w.length - 1][1] })
      }
      return { cells, apples, t0: 0.15 + k * (lanes.length > 2 ? 0.07 : 0.25) }
    })
    const longest = Math.max(...this.snakes.map((sn) => sn.cells.length))
    this.rate = longest / SNAKE_T
    this.done = 0
    this.bursts = []
    for (const sn of this.snakes) {
      sn.eaten = 0
      sn.cells.forEach(([x, y, i], step) => {
        if (i < 0 || S.DU[i] === -1) return
        S.SX[i] = x; S.SY[i] = y
        S.DL[i] = sn.t0 + step / this.rate; S.DU[i] = -1 // mark as set
      })
    }
    for (let i = 0; i < L.N; i++) S.DU[i] = 0.16
    this.end = Math.max(...this.snakes.map((sn) => sn.t0 + (sn.cells.length + SNAKE_LEN) / this.rate))
    return this.end + (this.nokia ? 0.75 : 0.3)
  },
  ease: () => 1,
  size: (k) => 0.6 + 0.4 * k,
  colorAt(k, i, L, pal, tn, t) {
    if (this.nokia) {
      const at = this.end + 0.05 + (L.X[i] / L.cols) * 0.45
      if (t < at) return LCD.ink
      return t - at < 0.06 ? pal.spark : finalColor(L, pal, i, tn)
    }
    return k < 0.3 ? MINT_HEAD : finalColor(L, pal, i, tn)
  },
  underlay({ ctx, t, total, L, box }) {
    if (!this.nokia) return
    // a Nokia-style LCD panel behind the game
    const a = clamp01(t / 0.25) * (1 - clamp01((t - this.end - 0.05) / 0.5))
    if (a <= 0) return
    ctx.globalAlpha = a
    ctx.fillStyle = LCD.bg; box(0, SCENE_TOP, L.cols, L.rows - SCENE_TOP)
    ctx.fillStyle = LCD.grid
    for (let x = 1; x < L.cols; x++) box(x, SCENE_TOP, 0.06, L.rows - SCENE_TOP)
    for (let y = SCENE_TOP + 1; y < L.rows; y++) box(0, y, L.cols, 0.06)
    const score = String(this.snakes.reduce((n, sn) => n + sn.eaten, 0) * 7).padStart(4, '0')
    drawText(ctx, box, score, L.cols - 1 - textWidth(score, 0.32), SCENE_TOP + 0.2, 0.32, LCD.ink)
    ctx.globalAlpha = 1
  },
  overlay({ ctx, t, dt, L, rect, box }) {
    const body = this.nokia ? [LCD.ink, LCD.ink] : [MINT, MINT_DARK]
    for (const sn of this.snakes) {
      const step = Math.floor((t - sn.t0) * this.rate)
      const last = sn.cells.length - 1
      // apples still waiting
      for (const ap of sn.apples) {
        if (step >= ap.step) {
          if (!ap.eaten) {
            ap.eaten = true; sn.eaten++
            for (let n = 0; n < 6; n++) this.bursts.push({ x: ap.x + 0.5, y: ap.y + 0.5, vx: rand(-6, 6), vy: rand(-7, 2), life: 0, max: 0.45, size: 0.35, color: this.nokia ? LCD.ink : '#FF4D3D', g: 20 })
          }
          continue
        }
        if (this.nokia) {
          ctx.fillStyle = LCD.ink
          box(ap.x + 0.35, ap.y, 0.3, 0.3); box(ap.x, ap.y + 0.35, 1, 0.3); box(ap.x + 0.35, ap.y + 0.7, 0.3, 0.3)
        } else {
          disc(ctx, box, ap.x + 0.5, ap.y + 0.6, 0.55, '#E5322D', 0.25)
          ctx.fillStyle = '#FFFFFF'; box(ap.x + 0.25, ap.y + 0.35, 0.2, 0.2)
          ctx.fillStyle = '#3CB043'; box(ap.x + 0.55, ap.y - 0.2, 0.35, 0.25)
        }
      }
      if (step < 0 || step - SNAKE_LEN > last) continue
      const head = Math.min(step, last)
      for (let s = Math.max(0, step - SNAKE_LEN); s <= head; s++) {
        const fromTail = s - (step - SNAKE_LEN)
        ctx.fillStyle = body[s % 2]
        rect(sn.cells[s][0], sn.cells[s][1], fromTail < 3 ? 0.42 + fromTail * 0.15 : 0.86)
      }
      if (step > last) continue
      // the head, with eyes looking where it goes and a flicking tongue
      const [hx, hy] = sn.cells[head]
      let [qx, qy] = sn.cells[Math.max(0, head - 1)]
      if (qx === hx && qy === hy) { qx = hx - 1; qy = hy }
      const fx = Math.sign(hx - qx), fy = Math.sign(hy - qy)
      const cx = hx + 0.5, cy = hy + 0.5
      ctx.fillStyle = this.nokia ? LCD.ink : MINT_HEAD
      rect(hx, hy, 1.15)
      for (const side of [-1, 1]) {
        const ex = cx + fx * 0.12 - fy * side * 0.3, ey = cy + fy * 0.12 + fx * side * 0.3
        ctx.fillStyle = this.nokia ? LCD.bg : '#FFFFFF'; box(ex - 0.16, ey - 0.16, 0.32, 0.32)
        if (!this.nokia) { ctx.fillStyle = '#0B1A14'; box(ex - 0.08 + fx * 0.06, ey - 0.08 + fy * 0.06, 0.16, 0.16) }
      }
      if (!this.nokia && (t * 3) % 1 < 0.28) {
        ctx.fillStyle = '#FF3B3B'
        box(cx + fx * 0.75 - 0.1, cy + fy * 0.75 - 0.1, 0.2, 0.2)
        for (const side of [-1, 1]) box(cx + fx * 1.0 - fy * side * 0.14 - 0.08, cy + fy * 1.0 + fx * side * 0.14 - 0.08, 0.16, 0.16)
      }
    }
    stepParticles(this.bursts, dt, ctx, box)
  },
}

export default snake
