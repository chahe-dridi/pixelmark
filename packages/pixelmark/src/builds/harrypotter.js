// Pixel wordmark build: Harry Potter. One of two spells each time:
//   map       the Marauder's Map: a parchment unfolds, "I SOLEMNLY SWEAR
//             THAT I AM UP TO NO GOOD" writes itself, ink corridors spread,
//             footprints labelled with the wordmark's label wander across, and the letters
//             bleed in as ink; "MISCHIEF MANAGED" and the map fades
//   patronus  a wand at the edge casts "EXPECTO PATRONUM": a glowing silver
//             stag bursts out and gallops across, and the letters light up
//             in its shimmering wake

import { GROUND, SCENE_TOP, hash, clamp01, outCubic, rand, pick, drawSprite, drawText, drawTextCentered, textWidth, stroke, disc, finalColor } from '../engine/kit'

const PARCH = { base: '#E9DAB2', dark: '#CDB88A', edge: '#B89E6A', ink: '#4A2C14', faint: '#8A6A44' }
export const STAG = [
  ['...............A.A..', '..............AAAA..', '...............AA...', '..............HHH...', '.............HHHH...', '.............HH.....',
    '...BBBBBBBBBBBH.....', '..BBBBBBBBBBBBB.....', '.BBBBBBBBBBBBB......', '.BBBBBBBBBBBB.......', '..B..B....B..B......', '..B..B....B..B......', '..B..B....B..B......', '.B...B...B...B......'],
  ['...............A.A..', '..............AAAA..', '...............AA...', '..............HHH...', '.............HHHH...', '.............HH.....',
    '...BBBBBBBBBBBH.....', '..BBBBBBBBBBBBB.....', '.BBBBBBBBBBBBB......', '.BBBBBBBBBBBB.......', '...B.B....B.B.......', '....BB.....BB.......', '...B..B...B..B......', '..B....B.B....B.....'],
]
const SWEAR = 'I SOLEMNLY SWEAR THAT I AM UP TO NO GOOD'
const MANAGED = 'MISCHIEF MANAGED'

const harrypotter = {
  name: 'harrypotter',
  setup(L, S) {
    this.spell = Math.random() < 0.55 ? 'map' : 'patronus'
    return this.spell === 'map' ? this.setupMap(L, S) : this.setupPatronus(L, S)
  },
  setupMap(L, S) {
    // corridors of the map: random rooms drawn in faint ink
    this.rooms = Array.from({ length: 9 }, () => ({ x: rand(1, L.cols - 10), y: rand(SCENE_TOP + 2, GROUND - 4), w: rand(5, 14), h: rand(2.5, 5) }))
    this.walkDir = Math.random() < 0.5 ? 1 : -1
    // ink bleeds out from a few seed points in every letter
    const seeds = []
    for (let i = 0; i < L.N; i++) if (hash(i, 9, 9) < 40) seeds.push(i)
    for (let i = 0; i < L.N; i++) {
      let best = 99
      for (const s of seeds) if (L.CI[s] === L.CI[i]) best = Math.min(best, Math.hypot(L.X[s] - L.X[i], L.Y[s] - L.Y[i]))
      S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
      S.DL[i] = 1.25 + (L.CI[i] * 0.12) + Math.min(best, 8) * 0.07 + (hash(i, 2, 2) / 1000) * 0.08; S.DU[i] = 0.25
    }
    this.recolor = 2.9
    return 4.1
  },
  setupPatronus(L, S) {
    const d = this.dir = Math.random() < 0.5 ? 1 : -1
    this.wandX = d > 0 ? 1.5 : L.cols - 1.5
    this.t0 = 0.8
    this.v = (L.cols + 16) / 2.1
    this.sparks = []
    for (let i = 0; i < L.N; i++) {
      const dist = (d > 0 ? L.X[i] + 10 : L.cols - L.X[i] + 10)
      S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
      S.DL[i] = this.t0 + dist / this.v + (hash(i, 4, 4) / 1000) * 0.15; S.DU[i] = 0.55
    }
    return this.t0 + (L.cols + 16) / this.v + 0.9
  },
  ease: () => 1,
  size(k) { return this.spell === 'map' ? 0.35 + 0.65 * outCubic(Math.min(1, k * 1.5)) : 0.5 + 0.5 * k },
  colorAt(k, i, L, pal, tn, t) {
    if (this.spell === 'map') {
      const at = this.recolor + (L.X[i] / L.cols) * 0.5
      if (t < at) return k < 0.5 ? PARCH.faint : PARCH.ink
      return t - at < 0.06 ? '#FFF6D6' : finalColor(L, pal, i, tn)
    }
    return k < 0.3 ? '#FFFFFF' : k < 0.65 ? '#BFE6FF' : finalColor(L, pal, i, tn)
  },
  underlay({ ctx, t, total, L, box }) {
    if (this.spell !== 'map') return
    // the parchment unfolds from the middle, then fades at the end
    const open = outCubic(clamp01(t / 0.45))
    const a = 1 - clamp01((t - (total - 0.75)) / 0.6)
    if (a <= 0) return
    const w = L.cols * open, x0 = L.cols / 2 - w / 2
    ctx.globalAlpha = a
    ctx.fillStyle = PARCH.edge; box(x0, SCENE_TOP, w, L.rows - SCENE_TOP)
    ctx.fillStyle = PARCH.base; box(x0 + 0.4, SCENE_TOP + 0.3, w - 0.8, L.rows - SCENE_TOP - 0.6)
    ctx.fillStyle = PARCH.dark
    for (const f of [1 / 3, 2 / 3]) box(x0 + w * f, SCENE_TOP + 0.3, 0.2, L.rows - SCENE_TOP - 0.6)
    for (let x = 0; x < L.cols; x += 1) for (let y = SCENE_TOP; y < L.rows; y += 1) {
      if (hash(x, y, 6) < 60 && x > x0 && x < x0 + w - 1) box(x, y, 1, 1)
    }
    // ink corridors spreading out from the centre
    const reach = clamp01((t - 0.4) / 1.2) * L.cols * 0.7
    ctx.fillStyle = PARCH.faint
    for (const r of this.rooms) {
      if (Math.abs(r.x + r.w / 2 - L.cols / 2) > reach) continue
      box(r.x, r.y, r.w, 0.15); box(r.x, r.y + r.h, r.w, 0.15); box(r.x, r.y, 0.15, r.h); box(r.x + r.w, r.y, 0.15, r.h + 0.15)
    }
    // the oath, written stroke by stroke, and later "mischief managed"
    const sc = Math.min(0.26, (L.cols - 4) / (SWEAR.length * 4))
    if (t > 0.35 && t < this.recolor) {
      const n = Math.min(SWEAR.length, Math.floor((t - 0.35) * 40))
      drawText(ctx, box, SWEAR.slice(0, n), L.cols / 2 - textWidth(SWEAR, sc) / 2, SCENE_TOP + 0.5, sc, PARCH.ink)
    }
    if (t > this.recolor - 0.2) {
      const n = Math.min(MANAGED.length, Math.floor((t - this.recolor + 0.2) * 30))
      drawText(ctx, box, MANAGED.slice(0, n), L.cols / 2 - textWidth(MANAGED, sc) / 2, SCENE_TOP + 0.5, sc, PARCH.ink)
    }
    ctx.globalAlpha = 1
  },
  overlay(args) {
    if (this.spell === 'map') this.overlayMap(args)
    else this.overlayPatronus(args)
  },
  overlayMap({ ctx, t, total, L, box }) {
    // footprints wandering along, with their owner's name
    const a = 1 - clamp01((t - (total - 0.75)) / 0.6)
    if (a <= 0 || t < 0.6) return
    const d = this.walkDir
    const head = (t - 0.6) * 16
    ctx.globalAlpha = a
    ctx.fillStyle = PARCH.ink
    for (let s = Math.max(0, Math.floor(head) - 12); s <= head; s++) {
      const x = d > 0 ? s * 1.6 - 4 : L.cols + 4 - s * 1.6
      const y = GROUND - 1.2 + (s % 2 ? 0.7 : 0) + Math.sin(s * 0.4) * 0.6
      const age = head - s
      ctx.globalAlpha = a * clamp01(1 - age / 12)
      box(x, y, 0.5, 0.35); box(x + 0.1, y + 0.45, 0.3, 0.25)
    }
    const lx = d > 0 ? head * 1.6 - 4 : L.cols + 4 - head * 1.6
    ctx.globalAlpha = a
    if (lx > -2 && lx < L.cols + 2) {
      ctx.fillStyle = PARCH.base; box(lx - 3.4, GROUND - 3.6, 6.8, 1.2)
      ctx.fillStyle = PARCH.ink; box(lx - 3.4, GROUND - 3.6, 6.8, 0.1); box(lx - 3.4, GROUND - 2.5, 6.8, 0.1)
      drawTextCentered(ctx, box, L.label, lx, GROUND - 3.35, 0.18, PARCH.ink)
    }
    ctx.globalAlpha = 1
  },
  overlayPatronus({ ctx, t, dt, total, L, p, px, py, box }) {
    const d = this.dir
    const fade = 1 - clamp01((t - (total - 0.45)) / 0.4)
    ctx.globalAlpha = fade
    // the wand, the incantation, and the silver burst
    const wy = GROUND - 2
    const tipX = this.wandX + d * 4, tipY = wy - 2.5
    if (t < this.t0 + 0.6) {
      const a = clamp01(t / 0.25)
      stroke(ctx, px, py, p, this.wandX, wy, tipX, tipY, '#5A3A1E', 0.35, a * fade)
      disc(ctx, box, tipX, tipY, 0.5 + Math.sin(t * 25) * 0.15, '#E8F6FF', 0.25)
      if (t > 0.15) {
        ctx.globalAlpha = fade * clamp01((t - 0.15) / 0.2)
        drawText(ctx, box, 'EXPECTO PATRONUM', d > 0 ? 1 : L.cols - 1 - textWidth('EXPECTO PATRONUM', 0.26), SCENE_TOP + 0.4, 0.26, '#CFEFFF', '#2A4A6A')
        ctx.globalAlpha = fade
      }
      if (t > 0.5 && t < this.t0 + 0.2) {
        const u = (t - 0.5) / (this.t0 - 0.3)
        ctx.globalAlpha = fade * 0.5 * (1 - u * 0.5)
        disc(ctx, box, tipX + d * u * 4, tipY, 1 + u * 2.5, '#E8F6FF')
        ctx.globalAlpha = fade
        disc(ctx, box, tipX + d * u * 4, tipY, 0.5 + u, '#FFFFFF')
      }
    }
    // the stag: bounding across, glowing, shedding sparkles
    if (t > this.t0) {
      const x = (d > 0 ? -10 : L.cols + 10) + d * this.v * (t - this.t0)
      const y = GROUND - 7 - Math.abs(Math.sin((t - this.t0) * 9)) * 1.6
      const rows = STAG[Math.floor(t * 9) % 2]
      ctx.globalAlpha = fade * 0.35
      for (const [ox, oy] of [[-0.3, 0], [0.3, 0], [0, -0.3], [0, 0.3]]) drawSprite(ctx, box, rows, { A: '#9FD8FF', H: '#9FD8FF', B: '#9FD8FF' }, x - 5 + ox, y + oy, 0.5, d < 0)
      ctx.globalAlpha = fade
      drawSprite(ctx, box, rows, { A: '#F2FBFF', H: '#E2F4FF', B: '#CFEFFF' }, x - 5, y, 0.5, d < 0)
      for (let n = 0; n < 3; n++) this.sparks.push({ x: x + rand(-4, 4), y: y + rand(0, 7), vx: -d * rand(1, 4), vy: rand(-1, 1.5), life: 0, max: rand(0.5, 1), c: pick(['#FFFFFF', '#CFEFFF', '#9FD8FF']) })
    }
    for (let j = this.sparks.length - 1; j >= 0; j--) {
      const q = this.sparks[j]
      q.life += dt; q.x += q.vx * dt; q.y += q.vy * dt
      if (q.life > q.max) { this.sparks.splice(j, 1); continue }
      ctx.globalAlpha = fade * (1 - q.life / q.max)
      ctx.fillStyle = q.c
      box(q.x - 0.15, q.y - 0.15, 0.3, 0.3)
      if (q.life < q.max * 0.5) { box(q.x - 0.4, q.y - 0.06, 0.8, 0.12); box(q.x - 0.06, q.y - 0.4, 0.12, 0.8) }
    }
    ctx.globalAlpha = 1
  },
}

export default harrypotter
