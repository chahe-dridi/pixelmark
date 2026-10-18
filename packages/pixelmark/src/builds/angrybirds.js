// Pixel wordmark build: Angry Birds. Loaded on demand by the engine.

import { GROUND, clamp01, disc, drawSprite, drawTextCentered, finalColor, hash, hostOf, lerp, letterMid, mainLetters, pick, rand, ring, shuffled, stepParticles, PAD_T } from '../engine/kit'

// ═══ Angry Birds ═════════════════════════════════════════════════════════
export const BIRDS = {
  red: { rows: ['..RRRR..', '.RRRRRR.', 'RKKRRKKR', 'RWKRRWKR', 'RRRYYRRR', 'RRWYYWRR', '.RWWWWR.', '..RRRR..'], pal: { R: '#D8202A', W: '#F6E6D0', K: '#1A1A1A', Y: '#F2A21E' } },
  chuck: { rows: ['...YY...', '...YY...', '..YYYY..', '..KWWK..', '.YWKKWY.', '.YYOOYY.', 'YYYYYYYY', 'YYYYYYYY'], pal: { Y: '#F5D33B', K: '#1A1A1A', W: '#FFFFFF', O: '#F2A21E' } },
  bomb: { rows: ['....F...', '...KK...', '..KKKK..', '.KKWKWK.', 'KKKKKKKK', 'KKKOOKKK', '.KKKKKK.', '..KKKK..'], pal: { K: '#262626', W: '#FFFFFF', O: '#F2A21E', F: '#FF8A1E' } },
  blues: { rows: ['.BBB.', 'BWBWB', 'BBOBB', 'BBBBB', '.BBB.'], pal: { B: '#5AA8E8', W: '#FFFFFF', O: '#F2A21E' } },
  matilda: { rows: ['..WWWW..', '.WWWWWW.', 'WWKWWKWW', 'WWWOOWWW', 'WWWWWWWW', 'WWWWWWWW', '.WWWWWW.', '..WWWW..'], pal: { W: '#F4F4F4', K: '#1A1A1A', O: '#F2A21E' } },
}
export const PIG = ['..GGG..', '.GGGGG.', 'GKGGGKG', 'GGNNNGG', 'GGNKNGG', '.GGGGG.']
export const PIG_PAL = { G: '#7BC342', K: '#1A1A1A', N: '#A8E06A' }
const MATS = { wood: ['#B5793C', '#8E5A26', '#C98E4E'], ice: ['#A8DDF5', '#7FC6EA', '#E2F5FF'], stone: ['#9A9A9A', '#777777', '#B5B5B5'] }
const AB = { gap: 0.85, load: 0.3, flight: 0.62, pouch: [2.4, GROUND - 6.6] }

const angrybirds = {
  name: 'angrybirds',
  setup(L, S) {
    const mains = mainLetters(L)
    const groups = [[], [], []]
    mains.forEach((ci, k) => groups[Math.min(2, Math.floor((k * 3) / mains.length))].push(ci))
    const kinds = shuffled(5).slice(0, 3).map((k) => ['red', 'chuck', 'bomb', 'blues', 'matilda'][k])
    this.shots = groups.map((letters, k) => {
      const ts = 0.35 + k * AB.gap
      const mid = letters[Math.floor(letters.length / 2)]
      return { letters, kind: kinds[k], ts, launch: ts + AB.load, impact: ts + AB.load + AB.flight, tx: letterMid(L, mid), ty: PAD_T + 6, hit: false }
    })
    const matNames = Object.keys(MATS)
    this.mat = L.CX0.map(() => pick(matNames))
    L.CX0.forEach((_, ci) => { this.mat[ci] = this.mat[hostOf(L, ci)] })
    this.pigs = shuffled(mains.length).slice(0, 3).map((k) => ({ ci: mains[k], popped: false }))
    const impactOf = L.CX0.map((_, ci) => this.shots.find((s) => s.letters.includes(hostOf(L, ci))).impact)
    for (let i = 0; i < L.N; i++) {
      S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
      S.DL[i] = impactOf[L.CI[i]] + (hash(i, 4, 4) / 1000) * 0.14; S.DU[i] = 0.45
    }
    this.trail = []; this.puffs = []; this.pops = []
    this.blasts = []
    return this.shots[2].impact + 1.1
  },
  ease: () => 1,
  waiting: () => ({ alpha: 1, size: 1 }),
  offsetY: (k) => Math.sin(k * 30) * 0.35 * (1 - k),
  colorAt(k, i, L, pal, tn) {
    if (k > 0.35) return finalColor(L, pal, i, tn)
    if (k > 0 && k < 0.15) return pal.spark
    const m = MATS[this.mat[L.CI[i]]], gy = L.Y[i] - PAD_T
    if (this.mat[L.CI[i]] === 'wood') return gy % 3 === 0 ? m[1] : m[hash(L.X[i], L.Y[i], 6) % 5 === 0 ? 2 : 0]
    if (this.mat[L.CI[i]] === 'ice') return (L.X[i] + gy) % 5 === 0 ? m[2] : m[hash(L.X[i], L.Y[i], 6) % 3 === 0 ? 1 : 0]
    return (L.X[i] % 4 === 0 || gy % 3 === 0) ? m[1] : m[hash(L.X[i], L.Y[i], 6) % 4 === 0 ? 2 : 0]
  },
  // where a shot's bird is at flight fraction u
  posOf(s, u) {
    const [sx, sy] = AB.pouch
    const para = (x0, y0, x1, y1, h, v) => [lerp(x0, x1, v), lerp(y0, y1, v) - h * 4 * v * (1 - v)]
    if (s.kind === 'chuck') {
      if (u < 0.7) return para(sx, sy, s.tx, s.ty, 5.5, (u / 0.7) * 0.55)
      const a = para(sx, sy, s.tx, s.ty, 5.5, 0.55)
      return [lerp(a[0], s.tx, (u - 0.7) / 0.3), lerp(a[1], s.ty, (u - 0.7) / 0.3)]
    }
    if (s.kind === 'matilda') {
      if (u < 0.65) return para(sx, sy, s.tx, s.ty - 7, 4, u / 0.65 * 0.9)
      const a = para(sx, sy, s.tx, s.ty - 7, 4, 0.9)
      return [a[0] + (u - 0.65) * 30, a[1] - (u - 0.65) * 26]
    }
    return para(sx, sy, s.tx, s.ty, 5.5, u)
  },
  overlay({ ctx, t, dt, total, L, p, px, py, box }) {
    const fade = 1 - clamp01((t - (total - 0.45)) / 0.4)
    ctx.globalAlpha = fade
    // the trajectory dots of the latest shot
    for (const q of this.trail) { ctx.fillStyle = '#FFFFFF'; box(q[0] - 0.2, q[1] - 0.2, 0.4, 0.4) }
    // pigs hiding at the foot of their letters
    for (const pg of this.pigs) {
      if (pg.popped) continue
      const x = letterMid(L, pg.ci) - 1.75
      drawSprite(ctx, box, PIG, PIG_PAL, x, GROUND - 3 + Math.sin(t * 4 + pg.ci) * 0.1, 0.5)
    }
    // the slingshot
    ctx.fillStyle = '#5A3818'; box(1.6, GROUND - 4, 0.9, 4); box(0.6, GROUND - 7.3, 0.8, 3.6); box(2.7, GROUND - 7.3, 0.8, 3.6); box(0.6, GROUND - 4.2, 2.9, 0.8)
    ctx.fillStyle = '#8B5A2B'; box(1.75, GROUND - 4, 0.45, 4); box(0.75, GROUND - 7.3, 0.4, 3.4); box(2.85, GROUND - 7.3, 0.4, 3.4)
    for (const s of this.shots) {
      const bird = BIRDS[s.kind]
      const bw = bird.rows[0].length * 0.5
      if (t >= s.ts && t < s.launch) {
        // loaded and pulled back, the band stretched
        const pull = Math.sin(clamp01((t - s.ts) / AB.load) * Math.PI * 0.5) * 1.6
        const bx = AB.pouch[0] - pull, by = AB.pouch[1] + pull * 0.4
        ctx.strokeStyle = '#3A2410'; ctx.lineWidth = Math.max(1, p * 0.2)
        ctx.beginPath(); ctx.moveTo(px(1), py(GROUND - 7)); ctx.lineTo(px(bx), py(by)); ctx.lineTo(px(3.1), py(GROUND - 7)); ctx.stroke()
        drawSprite(ctx, box, bird.rows, bird.pal, bx - bw / 2, by - bw / 2, 0.5)
        if (t - s.ts < dt * 1.5) this.trail = []
      } else if (t >= s.launch && t < s.impact) {
        const u = (t - s.launch) / AB.flight
        const [x, y] = this.posOf(s, u)
        if (Math.floor(t / 0.04) !== Math.floor((t - dt) / 0.04)) this.trail.push([x, y])
        if (s.kind === 'blues' && u > 0.5) {
          // splits into three, each aiming at its own letter
          const [ax, ay] = this.posOf(s, 0.5)
          const v = (u - 0.5) / 0.5
          for (const ci of [s.letters[0], s.letters[Math.floor(s.letters.length / 2)], s.letters[s.letters.length - 1]]) {
            const tx = letterMid(L, ci)
            drawSprite(ctx, box, bird.rows, bird.pal, lerp(ax, tx, v) - 1.25, lerp(ay, s.ty, v) - 2 * 4 * v * (1 - v) - 1.25, 0.5)
          }
        } else drawSprite(ctx, box, bird.rows, bird.pal, x - bw / 2, y - bw / 2, 0.5)
        if (s.kind === 'chuck' && u > 0.7) {
          ctx.fillStyle = '#FFF6B0'
          for (let k = 1; k <= 3; k++) box(x - k * 1.4, y - 1 + k * 0.5, 1, 0.2)
        }
        if (s.kind === 'matilda' && u > 0.65) {
          // the egg drops onto the target
          const [ex, ey] = this.posOf(s, 0.65)
          const v = (u - 0.65) / 0.35
          disc(ctx, box, lerp(ex, s.tx, v), lerp(ey, s.ty, v * v), 0.8, '#FFFFFF')
        }
      }
      if (t >= s.impact && !s.hit) {
        s.hit = true
        for (let n = 0; n < 12; n++) this.puffs.push({ x: s.tx + rand(-3, 3), y: s.ty + rand(-3, 4), vx: rand(-5, 5), vy: rand(-5, 1), life: 0, max: rand(0.4, 0.7), size: rand(0.8, 1.6), grow: 0.8, color: pick(['#E8DCC8', '#C9B8A0', '#FFFFFF']) })
        if (s.kind === 'bomb') this.blasts.push({ x: s.tx, y: s.ty, t0: t })
        for (const pg of this.pigs) {
          if (pg.popped || !s.letters.includes(pg.ci)) continue
          pg.popped = true
          const x = letterMid(L, pg.ci)
          for (let n = 0; n < 8; n++) this.puffs.push({ x, y: GROUND - 1.5, vx: rand(-4, 4), vy: rand(-6, -1), life: 0, max: 0.5, size: rand(0.8, 1.3), grow: 1, color: pick(['#A8E06A', '#7BC342', '#E9F7D8']) })
          this.pops.push({ x, y: GROUND - 6, t0: t })
        }
      }
    }
    stepParticles(this.puffs, dt, ctx, box)
    for (const b of this.blasts) {
      const u = (t - b.t0) / 0.4
      if (u < 1) ring(ctx, px, py, p, b.x, b.y, 1 + u * 8, '#FFB040', 0.4, (1 - u) * fade)
    }
    ctx.globalAlpha = fade
    for (const q of this.pops) {
      const u = (t - q.t0) / 0.9
      if (u < 0 || u >= 1) continue
      ctx.globalAlpha = fade * (1 - u * u)
      drawTextCentered(ctx, box, '5000', q.x, q.y - u * 2, 0.4, '#FFFFFF', '#2E7D1E')
    }
    ctx.globalAlpha = 1
  },
}

export default angrybirds
