// The 19 classic builds, the 5 colour styles and the 3 exits. They are pure
// data plus small draw hooks: the engine (engine.js) calls setup() to fill
// each pixel's start position / delay / duration, then eases every pixel
// home. See CONTRIBUTING.md for the full build contract.

import { GH, PAD_X, PAD_T, hash, clamp01, outCubic, outQuart, inCubic, inQuad, follow, letterMid, shuffled } from './kit'

// Falls with gravity, then settles with one small bounce
const drop = (t) => (t < 0.72 ? (t / 0.72) ** 2 : 1 - 0.09 * Math.sin(((t - 0.72) / 0.28) * Math.PI))

const SLASH_T = 0.2                       // one slash crossing the word (s)
const TYPE_START = 0.15, TYPE_STEP = 0.17  // typewriter: first key, then per letter

const LASER_T = 2.3                      // the laser's pass over every pixel (s)
const MATRIX = ['#2BFF88', '#16C964', '#0E7A3E']

// ── Colour styles: tone 0..4 per pixel (gy = row inside the glyph) ──────
export const DESIGNS = [
  // Horizontal bands, bright on top fading to deep at the base
  { name: 'bands', tone: (x, gy) => Math.min(4, Math.floor((gy / GH) * 5)) },
  // Clean brand look: solid letters, darker base row
  { name: 'solid', tone: (x, gy) => (gy >= 11 ? 1 : 0), acc: (x, gy) => (gy >= 11 ? 3 : 2) },
  // Letter by letter, deep to bright
  { name: 'letters', tone: (x, gy, ci, n) => 4 - Math.round((ci / Math.max(1, n - 1)) * 4), acc: () => 2 },
  // Mosaic of clusters
  {
    name: 'mosaic',
    tone: (x, gy, ci, n, seed) => {
      const v = hash(x >> 1, gy >> 1, seed)
      return v < 420 ? 0 : v < 680 ? 1 : v < 850 ? 2 : v < 950 ? 3 : 4
    },
  },
  // Diagonal stripes
  { name: 'stripes', tone: (x, gy) => Math.round((Math.abs(((x + gy * 1.4) % 18) - 9) / 9) * 3) },
]

// ── Build animations. setup() fills start position / delay / duration
// per pixel and returns the total length in seconds ─────────────────────
export const BUILDS = [
  {
    // Scattered pixels across the canvas fly into place
    name: 'assemble',
    setup(L, S) {
      for (let i = 0; i < L.N; i++) {
        S.SX[i] = Math.random() * L.cols; S.SY[i] = Math.random() * L.rows
        S.DL[i] = 0.25 + Math.random() * 0.7; S.DU[i] = 0.6 + Math.random() * 0.5
      }
      return 2.1
    },
    ease: outCubic,
    waiting: (t) => ({ alpha: 0.4 * clamp01(t / 0.25), size: 0.6 }),
  },
  {
    // Pixels drop in and stack up from the base, like bricks
    name: 'stack',
    setup(L, S) {
      for (let i = 0; i < L.N; i++) {
        const gy = L.GY[i]
        S.SX[i] = L.X[i]; S.SY[i] = L.Y[i] - (L.rows + 2 + Math.random() * 4)
        S.DL[i] = (12 - gy) * 0.06 + L.CI[i] * 0.05 + Math.random() * 0.12; S.DU[i] = 0.42 + Math.random() * 0.1
      }
      return 1.9
    },
    ease: drop,
  },
  {
    // A band of dithered noise sweeps left to right, leaving the letters
    name: 'scan',
    sweep: 1.3,
    setup(L, S) {
      for (let i = 0; i < L.N; i++) {
        S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
        S.DL[i] = (L.X[i] / L.cols) * this.sweep; S.DU[i] = 0.14
      }
      return this.sweep * (1 + 9 / L.cols) + 0.2
    },
    ease: (t) => t,
    size: (k) => 0.4 + 0.6 * k,
  },
  {
    // Each letter is printed bottom-up, with a bright leading edge
    name: 'rise',
    setup(L, S) {
      for (let i = 0; i < L.N; i++) {
        const gy = L.GY[i]
        S.SX[i] = L.X[i]; S.SY[i] = L.Y[i] + 1.5
        S.DL[i] = L.CI[i] * 0.13 + (12 - gy) * 0.045 + (L.X[i] % 2) * 0.012; S.DU[i] = 0.24
      }
      return 1.75
    },
    ease: outCubic,
    size: (k) => 0.2 + 0.8 * k,
    spark: true,
  },
  {
    // Glitchy mosaic: pixels jitter in random tones, then lock into place
    name: 'glitch',
    setup(L, S) {
      for (let i = 0; i < L.N; i++) {
        S.SX[i] = L.X[i] + Math.round((Math.random() - 0.5) * 8); S.SY[i] = L.Y[i] + Math.round((Math.random() - 0.5) * 6)
        S.DL[i] = Math.random() * 0.2; S.DU[i] = 0.9 + Math.random() * 0.7
      }
      return 1.8
    },
    ease: (t) => Math.floor(outCubic(t) * 5) / 5,
    waiting: () => ({ alpha: 1, size: 1 }),
    flicker: true,
  },
  {
    // Dust from all around the canvas spirals in
    name: 'converge',
    setup(L, S) {
      for (let i = 0; i < L.N; i++) {
        const a = Math.random() * Math.PI * 2, r = L.cols * (0.55 + Math.random() * 0.45)
        S.SX[i] = L.cols / 2 + Math.cos(a) * r; S.SY[i] = L.rows / 2 + Math.sin(a) * r * 0.45
        S.DL[i] = Math.random() * 0.5; S.DU[i] = 1.05 + Math.random() * 0.5
      }
      return 2.1
    },
    ease: outQuart,
    size: (k) => 0.35 + 0.65 * k,
    alpha: (k) => Math.min(1, k * 3),
    swirl: 0.35,
  },
  {
    // A laser prints the word letter by letter, row by row (back and forth).
    // The emitter starts at a random point on the canvas edge, glides in and
    // then rides alongside the burn point like a print head, swaying a
    // little; the beam's tip moves smoothly between pixels, throwing sparks.
    name: 'laser',
    setup(L, S) {
      const order = Array.from({ length: L.N }, (_, i) => i)
      order.sort((a, b) => L.CI[a] - L.CI[b] || L.Y[a] - L.Y[b] ||
        (L.GY[a] % 2 ? L.X[b] - L.X[a] : L.X[a] - L.X[b]))
      this.order = order
      order.forEach((i, r) => {
        S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
        S.DL[i] = 0.25 + (r / L.N) * LASER_T + 0.03; S.DU[i] = 0.14
      })
      const side = Math.floor(Math.random() * 4)
      const u = 0.1 + Math.random() * 0.8
      const from = side === 0 ? [u * L.cols, 0] : side === 1 ? [u * L.cols, L.rows]
        : side === 2 ? [0, u * L.rows] : [L.cols, u * L.rows]
      // the print head keeps to the side it came from, ~7 cells off the tip
      const first = order[0]
      const dx = from[0] - L.X[first], dy = from[1] - L.Y[first]
      const len = Math.hypot(dx, dy) || 1
      this.angle = Math.atan2(dy / len, dx / len)
      this.e = from.slice()
      this.h = [L.X[first] + 0.5, L.Y[first] + 0.5]
      this.sparks = []
      return 0.25 + LASER_T + 0.5
    },
    ease: () => 1,
    size: (k) => 0.45 + 0.55 * outCubic(k),
    flash: 0.14,
    overlay({ ctx, t, dt, total, L, pal, p, px, py, rect }) {
      const f = ((t - 0.25) / LASER_T) * L.N
      const on = t > 0.15 && f < L.N - 1
      // tip: in between two consecutive pixels, then eased so it never snaps
      const r0 = Math.max(0, Math.min(L.N - 2, Math.floor(f)))
      const fr = clamp01(f - r0)
      const a = this.order[r0], b = this.order[r0 + 1]
      const tx = L.X[a] + (L.X[b] - L.X[a]) * fr + 0.5, ty = L.Y[a] + (L.Y[b] - L.Y[a]) * fr + 0.5
      this.h[0] = follow(this.h[0], tx, 28, dt); this.h[1] = follow(this.h[1], ty, 28, dt)
      // head: glides after the tip, swaying on a slow arc
      const sway = this.angle + Math.sin(t * 1.4) * 0.35
      const ex = this.h[0] + Math.cos(sway) * 7, ey = this.h[1] + Math.sin(sway) * 5
      const glide = t < 0.5 ? 5 : 9
      this.e[0] = follow(this.e[0], ex, glide, dt); this.e[1] = follow(this.e[1], ey, glide, dt)
      const fade = on ? 1 : 1 - clamp01((t - (0.25 + LASER_T)) / 0.3)
      if (fade > 0) {
        const [fx, fy] = this.e, [hx, hy] = this.h
        ctx.lineCap = 'round'
        ctx.strokeStyle = pal.acc[1]; ctx.globalAlpha = 0.25 * fade; ctx.lineWidth = Math.max(2, p * 0.55)
        ctx.beginPath(); ctx.moveTo(px(fx), py(fy)); ctx.lineTo(px(hx), py(hy)); ctx.stroke()
        ctx.strokeStyle = pal.spark; ctx.globalAlpha = 0.95 * fade; ctx.lineWidth = Math.max(1, p * 0.14)
        ctx.beginPath(); ctx.moveTo(px(fx), py(fy)); ctx.lineTo(px(hx), py(hy)); ctx.stroke()
        // the head (a small block) and a hot glow where the beam lands
        ctx.fillStyle = pal.ink[2]; rect(fx - 0.5, fy - 0.5, 1.1)
        ctx.fillStyle = pal.spark; rect(fx - 0.5, fy - 0.5, 0.5)
        ctx.globalAlpha = 0.35 * fade; ctx.fillStyle = pal.acc[0]; rect(hx - 0.5, hy - 0.5, 1.6)
        ctx.globalAlpha = 1
      }
      if (on && Math.random() < 0.8) {
        const [hx, hy] = this.h
        for (let n = 0; n < 2 && this.sparks.length < 70; n++) {
          this.sparks.push({ x: hx, y: hy, vx: (Math.random() - 0.5) * 8, vy: -1.5 - Math.random() * 5, life: 0, max: 0.3 + Math.random() * 0.45, c: Math.floor(Math.random() * 3) })
        }
      }
      for (let j = this.sparks.length - 1; j >= 0; j--) {
        const q = this.sparks[j]
        q.life += dt; q.vy += 24 * dt; q.x += q.vx * dt; q.y += q.vy * dt
        if (q.life >= q.max) { this.sparks.splice(j, 1); continue }
        ctx.globalAlpha = 1 - q.life / q.max
        ctx.fillStyle = q.c === 0 ? pal.spark : pal.acc[q.c - 1]
        rect(q.x - 0.5, q.y - 0.5, 0.36)
      }
      ctx.globalAlpha = 1
    },
  },
  {
    // Falling sand: grains pour down and pile up from the bottom row,
    // each one settling into place as a solid pixel
    name: 'sand',
    setup(L, S) {
      for (let i = 0; i < L.N; i++) {
        const gy = L.GY[i]
        S.SX[i] = L.X[i] + (Math.random() - 0.5) * 1.6; S.SY[i] = -1 - Math.random() * 4
        S.DL[i] = (12 - gy) * 0.1 + Math.random() * 0.35; S.DU[i] = 0.4 + L.Y[i] * 0.012
      }
      return 12 * 0.1 + 0.35 + 0.65 + 0.25
    },
    ease: inQuad,
    size: (k) => (k < 0.94 ? 0.45 : 1),
    colorAt: (k, i, L, pal, tn) => (k < 0.94 ? pal.ink[2] : (L.ACC[i] ? pal.acc : pal.ink)[tn]),
  },
  {
    // Lightning: a bolt strikes each letter in a random order, flashing
    // the canvas; the letter crackles white for a moment, then settles
    name: 'lightning',
    setup(L, S) {
      const order = shuffled(L.CX0.length)
      this.strike = L.CX0.map((_, ci) => 0.2 + order.indexOf(ci) * 0.26)
      this.origin = L.CX0.map((_, ci) => letterMid(L, ci) + (Math.random() - 0.5) * 16)
      for (let i = 0; i < L.N; i++) {
        S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
        S.DL[i] = this.strike[L.CI[i]]; S.DU[i] = 0.45
      }
      return 0.2 + (L.CX0.length - 1) * 0.26 + 0.45 + 0.35
    },
    ease: () => 1,
    colorAt: (k, i, L, pal, tn, t) => {
      if (k < 0.18) return pal.spark
      if (k < 0.45) return hash(i, Math.floor(t * 30), 2) & 1 ? pal.spark : pal.acc[0]
      return (L.ACC[i] ? pal.acc : pal.ink)[tn]
    },
    overlay({ ctx, t, L, pal, p, px, py }) {
      for (let ci = 0; ci < L.CX0.length; ci++) {
        const u = t - this.strike[ci]
        if (u < -0.07 || u > 0.17) continue
        if (u > 0.05 && hash(ci, Math.floor(t * 40), 4) % 3 === 0) continue // flicker
        // jagged path from the top edge down through the letter, re-jittered
        // a few times a second so it crackles
        const seg = 8, jit = Math.floor(t * 25)
        const ax = this.origin[ci], bx = letterMid(L, ci), by = L.CY0[ci] + GH - 1
        const pts = []
        for (let k = 0; k <= seg; k++) {
          const f = k / seg
          const j = k === 0 || k === seg ? 0 : ((hash(ci, k, jit) / 1000) - 0.5) * 3.4
          pts.push([ax + (bx - ax) * f + j, by * f])
        }
        const upto = u < 0 ? Math.max(1, Math.round(((u + 0.07) / 0.07) * seg)) : seg
        const stroke = (color, width, alpha) => {
          ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha
          ctx.beginPath(); ctx.moveTo(px(pts[0][0]), py(pts[0][1]))
          for (let k = 1; k <= upto; k++) ctx.lineTo(px(pts[k][0]), py(pts[k][1]))
          // a short fork off the middle
          if (upto === seg) {
            ctx.moveTo(px(pts[4][0]), py(pts[4][1]))
            ctx.lineTo(px(pts[4][0] + 3 * Math.sign(ax - bx || 1)), py(pts[4][1] + 2.5))
            ctx.lineTo(px(pts[4][0] + 4.5 * Math.sign(ax - bx || 1)), py(pts[4][1] + 5))
          }
          ctx.stroke()
        }
        ctx.lineJoin = 'round'; ctx.lineCap = 'round'
        stroke(pal.acc[1], Math.max(3, p * 0.7), u < 0 ? 0.15 : 0.35)
        stroke(pal.spark, Math.max(1, p * 0.18), u < 0 ? 0.5 : 1)
        if (u >= 0 && u < 0.05) {
          ctx.globalAlpha = 0.07; ctx.fillStyle = pal.spark
          ctx.fillRect(px(0), py(0), L.cols * p, L.rows * p)
        }
        ctx.globalAlpha = 1
      }
    },
  },
  {
    // Matrix rain: green code pours down every column; where a drop passes
    // a letter's pixel, that pixel locks in, then cools to its colour
    name: 'matrix',
    setup(L, S) {
      this.cols = Array.from({ length: L.cols }, () => ({ at: Math.random() * 0.9, speed: 13 + Math.random() * 10 }))
      let end = 0
      for (let i = 0; i < L.N; i++) {
        const c = this.cols[L.X[i]]
        S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
        S.DL[i] = c.at + L.Y[i] / c.speed; S.DU[i] = 0.55
        end = Math.max(end, S.DL[i] + S.DU[i])
      }
      return end + 0.5
    },
    ease: () => 1,
    colorAt: (k, i, L, pal, tn) => (k < 0.12 ? '#D7FFE6' : k < 0.35 ? MATRIX[0] : k < 0.55 ? MATRIX[1] : (L.ACC[i] ? pal.acc : pal.ink)[tn]),
    overlay({ ctx, t, total, L, rect }) {
      const fade = 1 - clamp01((t - (total - 0.9)) / 0.6)
      if (fade <= 0) return
      const TRAIL = 9, flick = Math.floor(t * 12)
      for (let c = 0; c < L.cols; c++) {
        const d = this.cols[c]
        for (let pass = 0; pass < 2; pass++) {
          const head = Math.floor((t - d.at - pass * 0.75) * d.speed)
          if (head < 0) continue
          for (let k = 0; k < TRAIL; k++) {
            const y = head - k
            if (y < 0 || y >= L.rows) continue
            if (k > 0 && hash(c, y, flick) % 3 === 0) continue
            ctx.globalAlpha = (1 - k / TRAIL) * fade * 0.9
            ctx.fillStyle = k === 0 ? '#D7FFE6' : MATRIX[Math.min(2, Math.floor(k / 3))]
            rect(c, y, 0.6)
          }
        }
      }
      ctx.globalAlpha = 1
    },
  },
  {
    // A puzzle: the word is cut into tiles behind a hairline grid; tiles
    // slide in from every side in random order, scrambled, then resolve
    name: 'puzzle',
    setup(L, S) {
      const TW = 7, bands = [[0, 4], [5, 8], [9, 12]]
      const tileOf = (i) => {
        const gy = L.GY[i]
        return Math.floor((L.X[i] - PAD_X) / TW) * 3 + bands.findIndex(([a, b]) => gy >= a && gy <= b)
      }
      const n = Math.ceil((L.cols - 2 * PAD_X) / TW) * 3
      const slot = Array.from({ length: n }, (_, j) => j).sort(() => Math.random() - 0.5)
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      const move = slot.map(() => dirs[Math.floor(Math.random() * 4)])
      for (let i = 0; i < L.N; i++) {
        const tile = tileOf(i), [dx, dy] = move[tile]
        S.SX[i] = L.X[i] + dx * 5; S.SY[i] = L.Y[i] + dy * 4
        S.DL[i] = 0.25 + (slot[tile] / n) * 1.3; S.DU[i] = 0.6
      }
      this.TW = TW; this.bands = bands
      return 0.25 + 1.3 + 0.6 + 0.35
    },
    ease: (k) => {
      const c1 = 1.5, c3 = c1 + 1
      return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2
    },
    alpha: (k) => Math.min(1, k * 5),
    colorAt: (k, i, L, pal, tn, t) => {
      if (k >= 0.62) return (L.ACC[i] ? pal.acc : pal.ink)[tn]
      const h = hash(i, Math.floor(t * 12), 5)
      return (h & 1 ? pal.acc : pal.ink)[h % 5]
    },
    overlay({ t, total, L, pal, line }) {
      const a = 0.5 * clamp01(t / 0.25) * (1 - clamp01((t - (total - 0.5)) / 0.45))
      if (a <= 0) return
      const x0 = PAD_X - 0.5, x1 = L.cols - PAD_X + 0.5
      for (const top of new Set(L.CY0)) {
        for (const y of [0, 5, 9, 13]) line(x0, top + y, x1, top + y, pal.ink[2], a)
        for (let x = PAD_X; x <= L.cols - PAD_X; x += this.TW) line(x - 0.5, top, x - 0.5, top + GH, pal.ink[2], a)
      }
    },
  },
  {
    // A portal: a ring of pixels spins up in the middle, then the word
    // streams out of it while the ring widens and fades
    name: 'portal',
    setup(L, S) {
      const cx = L.cols / 2, cy = L.MIDY
      for (let i = 0; i < L.N; i++) {
        S.SX[i] = cx + (Math.random() - 0.5) * 2; S.SY[i] = cy + (Math.random() - 0.5) * 1.5
        S.DL[i] = 0.75 + Math.random() * 0.85; S.DU[i] = 0.55 + Math.random() * 0.3
      }
      return 0.75 + 0.85 + 0.85 + 0.2
    },
    ease: outCubic,
    size: (k) => 0.3 + 0.7 * k,
    swirl: 0.5,
    overlay({ ctx, t, L, pal, rect }) {
      const cx = L.cols / 2, cy = L.MIDY
      const grow = 1 + Math.max(0, t - 0.75) * 1.6
      const a = clamp01(t / 0.35) * (1 - clamp01((t - 1.1) / 0.8))
      if (a <= 0) return
      const n = 22, spin = t * 2.6
      ctx.globalAlpha = a
      ctx.fillStyle = pal.ink[0]
      for (let j = 0; j < n; j++) {
        const th = (j / n) * Math.PI * 2 + spin
        rect(Math.round(cx + Math.cos(th) * 11 * grow), Math.round(cy + Math.sin(th) * 4.6 * grow), 0.55)
      }
      // faint flicker in the eye of the portal
      ctx.globalAlpha = a * 0.5
      ctx.fillStyle = pal.ink[3]
      for (let j = 0; j < 3; j++) {
        const h = hash(j, Math.floor(t * 10), 9)
        rect(Math.round(cx - 2 + (h % 5)), Math.round(cy - 1 + ((h >> 3) % 3)), 0.4)
      }
      ctx.globalAlpha = 1
    },
  },
  {
    // Halftone: the word shows at once as a faint mesh of tiny dots, then
    // the dots swell into solid pixels in a sweep
    name: 'halftone',
    setup(L, S) {
      for (let i = 0; i < L.N; i++) {
        S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
        S.DL[i] = 0.45 + (L.X[i] / L.cols) * 1.2 + Math.random() * 0.18; S.DU[i] = 0.55
      }
      return 0.45 + 1.2 + 0.18 + 0.55 + 0.2
    },
    ease: () => 1,
    waiting: (t) => ({ alpha: 0.9 * clamp01(t / 0.35), size: 0.28 }),
    size: (k) => (k < 0.3 ? 0.28 : 0.28 + 0.72 * outCubic((k - 0.3) / 0.7)),
    colorAt: (k, i, L, pal, tn) => (L.ACC[i] ? pal.acc : pal.ink)[k < 0.45 ? 3 : tn],
  },
  {
    // Weave: alternate rows slide in from opposite sides and interlock
    name: 'weave',
    setup(L, S) {
      for (let i = 0; i < L.N; i++) {
        const gy = L.GY[i]
        S.SX[i] = L.X[i] + (gy % 2 ? -1 : 1) * (L.cols * 0.65 + Math.random() * 3); S.SY[i] = L.Y[i]
        S.DL[i] = Math.abs(gy - 6) * 0.05 + Math.random() * 0.06; S.DU[i] = 0.85
      }
      return 6 * 0.05 + 0.06 + 0.85 + 0.25
    },
    ease: outQuart,
    alpha: (k) => Math.min(1, k * 4),
  },
  {
    // Tetris, bottom to top: each line is cut into 2–4 pixel pieces that
    // drop in from above; the line flashes as it locks, then the next one
    name: 'tetris',
    setup(L, S) {
      const rowOf = new Map()
      for (let i = 0; i < L.N; i++) {
        if (!rowOf.has(L.Y[i])) rowOf.set(L.Y[i], [])
        rowOf.get(L.Y[i]).push(i)
      }
      for (const [r, list] of rowOf) {
        list.sort((a, b) => L.X[a] - L.X[b])
        const gy = r - PAD_T
        let j = 0
        while (j < list.length) {
          // one piece: a run of touching pixels, 2–4 long
          const len = 2 + Math.floor(Math.random() * 3)
          let e = j + 1
          while (e < list.length && e - j < len && L.X[list[e]] === L.X[list[e - 1]] + 1) e++
          const dl = (12 - gy) * 0.115 + Math.random() * 0.09
          const du = 0.26 + Math.random() * 0.08
          for (let q = j; q < e; q++) {
            const i = list[q]
            S.SX[i] = L.X[i]; S.SY[i] = L.Y[i] - L.rows - 1
            S.DL[i] = dl; S.DU[i] = du
          }
          j = e
        }
      }
      return 12 * 0.115 + 0.09 + 0.34 + 0.25
    },
    ease: inQuad,
    flash: 0.09,
  },
  {
    // Fast slashes: hairlines streak across the word band by band and the
    // letters cut in behind them (deep tone, a flash, then colour), while
    // vertical streaks drop between the letters
    name: 'slash',
    setup(L, S) {
      const bands = [[0, 2], [3, 5], [6, 8], [9, 12]]
      const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5)
      this.plan = bands.map(([r0, r1], k) => ({ r0, r1, at: 0.12 + order[k] * 0.2, dir: Math.random() < 0.5 ? 1 : -1 }))
      this.cuts = L.CX0.slice(1).map((x) => ({ x: x - 1, at: Math.random() * 0.9, len: 0.18 + Math.random() * 0.15 }))
      for (let i = 0; i < L.N; i++) {
        const gy = L.GY[i]
        const band = this.plan.find((b) => gy >= b.r0 && gy <= b.r1)
        const u = L.X[i] / L.cols
        S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
        S.DL[i] = band.at + (band.dir > 0 ? u : 1 - u) * SLASH_T; S.DU[i] = 0.42
      }
      return 0.12 + 3 * 0.2 + SLASH_T + 0.42 + 0.25
    },
    ease: () => 1,
    colorAt: (k, i, L, pal, tn) => {
      const tones = L.ACC[i] ? pal.acc : pal.ink
      return k < 0.35 ? tones[4] : k < 0.55 ? pal.spark : tones[tn]
    },
    overlay({ t, total, L, pal, line }) {
      const fade = 1 - clamp01((t - (total - 0.45)) / 0.4)
      for (const b of this.plan) {
        const k = (t - b.at) / SLASH_T
        if (k <= 0) continue
        const head = Math.min(1, k) * L.cols
        // bright while it streaks, then it lingers as a faint guide line
        const a = (k < 1 ? 0.95 : 0.35 * (1 - 0.6 * clamp01((t - b.at - SLASH_T) / 0.5))) * fade
        for (const y of [b.r0 + PAD_T, b.r1 + PAD_T + 1]) {
          if (b.dir > 0) line(0, y, head, y, pal.ink[1], a)
          else line(L.cols - head, y, L.cols, y, pal.ink[1], a)
        }
      }
      for (const c of this.cuts) {
        const k = (t - c.at) / c.len
        if (k <= 0 || k >= 1.6) continue
        const y1 = Math.min(1, k) * L.rows, y0 = Math.max(0, k - 0.6) * L.rows
        line(c.x + 0.45, y0, c.x + 0.45, y1, pal.acc[1], (k < 1 ? 0.9 : (0.9 * (1.6 - k)) / 0.6) * fade)
      }
    },
  },
  {
    // Tiles flip over in a diagonal wave: a back face first (orange for the
    // letters, cream for the X), then the front, like a cube's stickers
    name: 'flip',
    setup(L, S) {
      for (let i = 0; i < L.N; i++) {
        const gy = L.GY[i]
        S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
        S.DL[i] = ((L.X[i] + gy * 1.6) / (L.cols + 20)) * 1.15; S.DU[i] = 0.42
      }
      return 1.15 + 0.42 + 0.2
    },
    ease: () => 1,
    sizeY: (k) => Math.max(0.08, Math.abs(Math.cos((1 - k) * Math.PI))),
    colorAt: (k, i, L, pal, tn) => (k < 0.5 ? (L.ACC[i] ? pal.ink : pal.acc)[3] : (L.ACC[i] ? pal.acc : pal.ink)[tn]),
  },
  {
    // A ripple from the middle of the word: pixels pop in with an overshoot
    name: 'ripple',
    setup(L, S) {
      const cx = L.cols / 2, cy = L.MIDY
      const far = Math.hypot(cx, GH)
      for (let i = 0; i < L.N; i++) {
        S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
        S.DL[i] = (Math.hypot(L.X[i] - cx, (L.Y[i] - cy) * 2) / far) * 1.1; S.DU[i] = 0.4
      }
      return 1.1 + 0.4 + 0.2
    },
    ease: () => 1,
    size: (k) => (k < 0.6 ? (k / 0.6) * 1.3 : 1.3 - ((k - 0.6) / 0.4) * 0.3),
    spark: true,
  },
  {
    // Typed out: each letter lands in one keystroke and an orange block
    // cursor steps into the gap after it, then blinks twice at the end
    name: 'type',
    setup(L, S) {
      for (let i = 0; i < L.N; i++) {
        S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
        S.DL[i] = TYPE_START + L.CI[i] * TYPE_STEP; S.DU[i] = 0.05
      }
      return TYPE_START + L.chars * TYPE_STEP + 0.75
    },
    ease: () => 1,
    flash: 0.06,
    overlay({ ctx, t, total, L, pal, rect }) {
      const n = L.CX0.length
      const typed = Math.floor((t - TYPE_START) / TYPE_STEP) + 1 // letters on screen
      if (t > total - 0.12) return
      if (typed >= n && Math.floor((t - TYPE_START - n * TYPE_STEP) * 5) % 2 === 1) return
      const at = Math.max(0, Math.min(typed, n) - 1)
      const x = typed <= 0 ? L.CX0[0] - 2 : L.CX1[at] + 1
      ctx.fillStyle = pal.acc[2]
      for (let r = 0; r < GH; r++) { rect(x, L.CY0[at] + r, 1); rect(x + 1, L.CY0[at] + r, 1) }
    },
  },
]

// ── Exit animations: fill the end position / delay / duration ──────────
export const EXITS = [
  { // drift up like embers
    name: 'embers',
    setup(L, S) {
      for (let i = 0; i < L.N; i++) {
        S.SX[i] = L.X[i] + (Math.random() - 0.5) * 4; S.SY[i] = L.Y[i] - (4 + Math.random() * 8)
        S.DL[i] = Math.random() * 0.35 + (L.X[i] / L.cols) * 0.2; S.DU[i] = 0.55
      }
      return 1.1
    },
    ease: inQuad,
  },
  { // crumble, left to right
    name: 'crumble',
    setup(L, S) {
      for (let i = 0; i < L.N; i++) {
        S.SX[i] = L.X[i] + (Math.random() - 0.5) * 3; S.SY[i] = L.Y[i] + L.rows
        S.DL[i] = (L.X[i] / L.cols) * 0.45 + Math.random() * 0.1; S.DU[i] = 0.5
      }
      return 1.05
    },
    ease: inCubic,
  },
  { // dissolve in place, pixel by pixel
    name: 'dissolve',
    setup(L, S) {
      for (let i = 0; i < L.N; i++) {
        S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
        S.DL[i] = Math.random() * 0.6; S.DU[i] = 0.14
      }
      return 0.8
    },
    ease: (t) => t,
    shrink: true,
  },
]
