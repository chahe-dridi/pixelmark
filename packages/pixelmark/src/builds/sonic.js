// Pixel wordmark build: Sonic. Gold rings hang where the letters will be.
// Sonic runs in, curls into a ball and races up, over and down every letter
// (like running a loop), collecting the rings; each ring he grabs turns into
// its patch of the letter. Tails flies along overhead. Dr. Eggman hovers at
// the far end, gets bonked and flies off smoking.

import { PAD_T, GROUND, SCENE_TOP, hash, clamp01, lerp, outCubic, follow, rand, pick, mainLetters, disc, drawSprite, drawText, textWidth, stepParticles, finalColor } from '../engine/kit'

export const SONIC_RUN = [
  ['.....BBB....', '...BBBBBB...', 'BBBBBBBWWW..', '.BBBBBBWKWP.', 'BBBBBBPPPPPK', '..BBBBPPPP..', '.BBBBBBPP...',
    '...BBBPPB...', '..PBBPPPBP..', '...BBBBBB...', '..BB...BB...', '.BB.....BB..', 'RRRw...RRRw.', 'RRR....RRR..'],
  ['.....BBB....', '...BBBBBB...', 'BBBBBBBWWW..', '.BBBBBBWKWP.', 'BBBBBBPPPPPK', '..BBBBPPPP..', '.BBBBBBPP...',
    '...BBBPPB...', '..PBBPPPBP..', '...BBBBBB...', '...BBBBB....', '....BBB.....', '...RRRRw....', '..RRRR......'],
]
export const SONIC_PAL = { B: '#2058D0', P: '#F6C8A0', W: '#FFFFFF', K: '#101010', R: '#E02020', w: '#FFFFFF' }
export const TAILS = ['.....OOO....', '....OOOOO...', '...OOWWWKO..', '..OOOWWWWW..', '...OOOWWW...', '..WOOOOOO...', '.WWOOOOO....', '....OOO.....', '....W.W.....', '...RR.RR....']
export const TAILS_PAL = { O: '#F2A23A', W: '#FFFFFF', K: '#101010', R: '#E02020' }
export const EGGMAN = ['.....SSSS.....', '....SSSSSS....', '....GWGGWG....', '....SSSSSS....', '...MMMMMMMM...', '..RRRSSSSRRR..', '.RRRRRRRRRRRR.',
  'PPPPPPPPPPPPPP', 'PPPPLLLLLLPPPP', '.PPPPPPPPPPPP.', '..PPPPPPPPPP..', '....YYYYYY....']
export const EGGMAN_PAL = { S: '#F2C29A', G: '#9AD0F0', W: '#FFFFFF', M: '#7A4A2A', R: '#D8282A', P: '#A8B4C0', L: '#E8EEF4', Y: '#FFB040' }
const GOLD = ['#FFD23F', '#FFF1A8', '#C8961E']
const R = 1.5 // ball radius: he runs on the letters' outside surface

function drawBall(ctx, box, cx, cy, r, spin) {
  const res = 0.5
  for (let y = -r; y < r; y += res) {
    for (let x = -r; x < r; x += res) {
      const mx = x + res / 2, my = y + res / 2, rr = mx * mx + my * my
      if (rr > r * r) continue
      const band = (((Math.atan2(my, mx) + spin) / (Math.PI / 3)) % 2 + 2) % 2
      ctx.fillStyle = rr > (r - 0.5) ** 2 ? '#123C99' : band < 0.75 ? '#4A86F5' : '#2058D0'
      box(cx + x, cy + y, res, res)
    }
  }
}

const sonic = {
  name: 'sonic',
  setup(L, S) {
    const d = this.dir = Math.random() < 0.5 ? 1 : -1
    const letters = mainLetters(L)
    if (d < 0) letters.reverse()
    // the track: up each letter's leading side, across its top, down the
    // far side, then along the ground to the next one
    const pts = []
    const add = (x, y) => {
      const last = pts[pts.length - 1]
      if (last) {
        const n = Math.ceil(Math.hypot(x - last[0], y - last[1]) / 0.4)
        for (let k = 1; k <= n; k++) pts.push([lerp(last[0], x, k / n), lerp(last[1], y, k / n)])
      } else pts.push([x, y])
    }
    const yG = GROUND - R, yT = PAD_T - R, c = 1.6
    this.segOf = new Map() // letter → [start, end] index range of its loop
    // he stops on screen, revs up, and the roll starts from here
    this.startX = (d > 0 ? L.CX0[letters[0]] - R : L.CX1[letters[0]] + 1 + R) - d * 5
    add(this.startX, yG)
    for (const ci of letters) {
      const near = d > 0 ? L.CX0[ci] - R : L.CX1[ci] + 1 + R
      const far = d > 0 ? L.CX1[ci] + 1 + R : L.CX0[ci] - R
      add(near, yG)
      const s0 = pts.length
      add(near, yT + c)
      for (let k = 1; k <= 6; k++) { const a = (k / 6) * Math.PI / 2; add(near + d * c * (1 - Math.cos(a)), yT + c * (1 - Math.sin(a))) }
      add(far - d * c, yT)
      for (let k = 1; k <= 6; k++) { const a = (k / 6) * Math.PI / 2; add(far - d * c * (1 - Math.sin(a)), yT + c * (1 - Math.cos(a))) }
      add(far, yG)
      this.segOf.set(ci, [s0, pts.length - 1])
    }
    // the finish: a leap at Eggman, or straight off the edge
    this.egg = Math.random() < 0.75
    this.eggX = d > 0 ? L.cols - 8.5 : 1.5; this.eggY = PAD_T - 0.5
    const lastX = pts[pts.length - 1][0]
    if (this.egg) {
      const hx = this.eggX + 3.5, hy = this.eggY + 5.5
      for (let k = 1; k <= 12; k++) { const u = k / 12; pts.push([lerp(lastX, hx, u), lerp(yG, hy, u) - Math.sin(u * Math.PI) * 4]) }
      this.hitIndex = pts.length - 1
      for (let k = 1; k <= 14; k++) { const u = k / 14; pts.push([hx + d * u * 14, hy + u * u * 10]) }
    } else add(d > 0 ? L.cols + 8 : -8, yG)
    this.pts = pts
    this.cum = [0]
    for (let k = 1; k < pts.length; k++) this.cum.push(this.cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]))
    this.runIn = 0.85; this.t0 = this.runIn + 0.4
    this.v = this.cum[this.cum.length - 1] / 3.4
    this.tHit = this.egg ? this.t0 + this.cum[this.hitIndex] / this.v : Infinity
    // rings along each loop; every pixel belongs to its nearest ring
    this.rings = []
    for (const ci of letters) {
      const [a, b] = this.segOf.get(ci)
      for (let k = a; k <= b; k += 9) this.rings.push({ k, x: pts[k][0], y: pts[k][1], got: false })
    }
    const timeAt = (k) => this.t0 + this.cum[k] / this.v
    for (let i = 0; i < L.N; i++) {
      const host = letters.includes(L.CI[i]) ? L.CI[i] : letters.reduce((best, ci) => (Math.abs(L.CX0[ci] - L.CX0[L.CI[i]]) < Math.abs(L.CX0[best] - L.CX0[L.CI[i]]) ? ci : best), letters[0])
      const [a, b] = this.segOf.get(host)
      let bestK = a, bestD = Infinity
      for (let k = a; k <= b; k += 3) {
        const dd = (pts[k][0] - L.X[i] - 0.5) ** 2 + (pts[k][1] - L.Y[i] - 0.5) ** 2
        if (dd < bestD) { bestD = dd; bestK = k }
      }
      S.SX[i] = pts[bestK][0] - 0.5; S.SY[i] = pts[bestK][1] - 0.5
      S.DL[i] = timeAt(bestK) + (hash(i, 1, 2) / 1000) * 0.06; S.DU[i] = 0.45
    }
    this.tails = Math.random() < 0.75 ? [this.pts[0][0] - d * 8, SCENE_TOP + 1] : null
    this.count = 0; this.sparkles = []; this.smoke = []; this.hitDone = false
    this.dust = []
    this.tEnd = this.t0 + this.cum[this.cum.length - 1] / this.v
    return this.tEnd + 0.6
  },
  ballAt(t) {
    const s = Math.max(0, (t - this.t0) * this.v)
    let lo = 0, hi = this.cum.length - 1
    while (lo < hi - 1) { const m = (lo + hi) >> 1; if (this.cum[m] <= s) lo = m; else hi = m }
    const span = this.cum[hi] - this.cum[lo] || 1, u = clamp01((s - this.cum[lo]) / span)
    return [lerp(this.pts[lo][0], this.pts[hi][0], u), lerp(this.pts[lo][1], this.pts[hi][1], u), lo]
  },
  ease: outCubic,
  size: (k) => 0.6 + 0.4 * k,
  colorAt(k, i, L, pal, tn, t) {
    if (k < 0.6) return GOLD[hash(i, Math.floor(t * 12), 3) % 3 === 0 ? 1 : 0]
    return k < 0.7 ? pal.spark : finalColor(L, pal, i, tn)
  },
  overlay({ ctx, t, dt, total, L, box }) {
    const d = this.dir
    const fade = 1 - clamp01((t - (total - 0.4)) / 0.35)
    ctx.globalAlpha = fade
    const [bx, by, bk] = this.ballAt(t)
    // rings: spinning, grabbed with a sparkle
    for (const rg of this.rings) {
      if (!rg.got && t > this.t0 && bk >= rg.k) {
        rg.got = true; this.count++
        for (let n = 0; n < 4; n++) this.sparkles.push({ x: rg.x, y: rg.y, vx: rand(-5, 5), vy: rand(-5, 5), life: 0, max: 0.3, size: 0.35, color: '#FFFFFF' })
      }
      if (rg.got) continue
      const w = Math.max(0.25, Math.abs(Math.cos(t * 6 + rg.k)))
      const rx = rg.x - 0.6 * w, ry = rg.y - 0.6, rw = 1.2 * w, th = Math.min(0.3, rw / 2)
      ctx.fillStyle = GOLD[0]
      box(rx, ry, rw, 0.3); box(rx, ry + 0.9, rw, 0.3); box(rx, ry, th, 1.2); box(rx + rw - th, ry, th, 1.2)
      ctx.fillStyle = GOLD[1]; box(rx, ry, rw, 0.12)
    }
    stepParticles(this.sparkles, dt, ctx, box)
    ctx.globalAlpha = fade
    // the ring counter sits on the ground strip, clear of the rings
    drawText(ctx, box, 'RINGS', 1.2, GROUND + 0.3, 0.3, '#FFD23F', '#1A2C70')
    drawText(ctx, box, String(this.count), 1.2 + textWidth('RINGS ', 0.3), GROUND + 0.3, 0.3, '#FFFFFF', '#1A2C70')
    // Dr. Eggman: hovers, gets bonked, flies off smoking
    if (this.egg) {
      const u = clamp01((t - this.tHit) / 0.9)
      const ex = this.eggX + (t > this.tHit ? d * u * u * 30 : 0)
      const ey = this.eggY + Math.sin(t * 3) * 0.4 - (t > this.tHit ? u * 6 : 0)
      if (t < this.tHit + 0.9) {
        const flash = t > this.tHit && t < this.tHit + 0.25 && Math.floor(t * 30) % 2 === 0
        drawSprite(ctx, box, EGGMAN, flash ? Object.fromEntries(Object.keys(EGGMAN_PAL).map((k) => [k, '#FFFFFF'])) : EGGMAN_PAL, ex, ey, 0.5, d < 0)
        if (t > this.tHit && Math.random() < 0.8) this.smoke.push({ x: ex + 3.5, y: ey + 5, vx: -d * rand(1, 3), vy: rand(-2, 0), life: 0, max: 0.6, size: rand(0.6, 1.2), grow: 1, color: pick(['#5A5A5A', '#8A8A8A', '#3A3A3A']) })
      }
      if (t >= this.tHit && !this.hitDone) {
        this.hitDone = true
        for (let n = 0; n < 12; n++) this.smoke.push({ x: this.eggX + 3.5, y: this.eggY + 4, vx: rand(-6, 6), vy: rand(-6, 3), life: 0, max: rand(0.3, 0.5), size: rand(0.5, 1), color: pick(['#FFFFFF', '#FFD23F', '#FF8A3D']) })
      }
    }
    stepParticles(this.smoke, dt, ctx, box)
    ctx.globalAlpha = fade
    // Tails, flying along overhead
    if (this.tails) {
      this.tails[0] = follow(this.tails[0], bx - d * 6, 3, dt)
      const tx = this.tails[0], ty = SCENE_TOP + 0.6 + Math.sin(t * 4) * 0.5
      const a = t * 30
      for (const off of [0, Math.PI]) {
        const cx = tx + (d > 0 ? 0.6 : 5.4) + Math.cos(a + off) * 1.3, cy = ty + 3.2 + Math.sin(a + off) * 0.5
        disc(ctx, box, cx, cy, 0.8, '#F2A23A', 0.25); disc(ctx, box, cx - d * 0.4, cy, 0.4, '#FFFFFF', 0.25)
      }
      drawSprite(ctx, box, TAILS, TAILS_PAL, tx, ty, 0.5, d < 0)
    }
    // Sonic: runs in on screen, skids to a stop, revs a spin dash (dust
    // flying), then he is a ball racing along the track
    if (t < this.runIn) {
      const x = lerp(this.startX - d * 26, this.startX, outCubic(t / this.runIn))
      drawSprite(ctx, box, SONIC_RUN[Math.floor(t * (t < this.runIn * 0.7 ? 16 : 8)) % 2], SONIC_PAL, x - 3.3, GROUND - 7.7, 0.55, d < 0)
      if (Math.random() < 0.5) this.dust.push({ x: x - d * 1.5, y: GROUND - 0.4, vx: -d * rand(2, 5), vy: rand(-2, -0.5), life: 0, max: 0.3, size: rand(0.4, 0.8), grow: 0.6, color: pick(['#E8E8E8', '#BDBDBD']) })
    } else if (t < this.t0) {
      for (let n = 0; n < 2; n++) this.dust.push({ x: this.startX - d * 2, y: GROUND - 0.5, vx: -d * rand(6, 13), vy: rand(-3, -0.5), life: 0, max: 0.35, size: rand(0.5, 1), grow: 0.8, color: pick(['#FFFFFF', '#D8D8D8', '#B5B5B5']) })
      drawBall(ctx, box, this.startX, GROUND - R + Math.sin(t * 50) * 0.15, R, -d * t * 46)
    } else if (t < this.tEnd && bx > -3 && bx < L.cols + 3) {
      for (let j = 3; j >= 1; j--) {
        const [gx, gy] = this.ballAt(t - j * 0.02)
        ctx.globalAlpha = fade * 0.18 * (4 - j)
        disc(ctx, box, gx, gy, R, '#2058D0')
      }
      ctx.globalAlpha = fade
      drawBall(ctx, box, bx, by, R, -d * t * 40)
    }
    stepParticles(this.dust, dt, ctx, box)
    ctx.globalAlpha = 1
  },
}

export default sonic
