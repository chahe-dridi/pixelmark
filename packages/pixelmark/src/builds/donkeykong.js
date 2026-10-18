// Pixel wordmark build: Donkey Kong. DK pounds his chest at one end of a red
// girder. Jumpman walks in from the other end, jumps for the hammer and
// fights his way towards DK: every barrel DK throws is smashed at a letter,
// and the barrel bursts into that letter. When he reaches DK he bonks him,
// DK tumbles off the girder, and a heart pops up.

import { GROUND, SCENE_TOP, hash, clamp01, lerp, outCubic, fadeInOut, letterMid, mainLetters, hostOf, drawSprite, drawText, drawTextCentered, stepParticles, choose, dirOf } from '../engine/kit'
import { MARIO_RUN, MARIO_JUMP, JUMPMAN_PAL } from './sprites'

export const DK_IDLE = ['.....BBBBBB.....', '....BBBBBBBB....', '...BBBBBBBBBB...', '...BTTWKKWTTB...', '...BTTTTTTTTB...', '..BBTTTNNTTTBB..',
  '.BBBBTTTTTTBBBB.', 'BBBBBBTTTTBBBBBB', 'BBTTBBBBBBBBTTBB', 'BTTTBBTTTTBBTTTB', 'BTTTBTTTTTTBTTTB', 'BTTBBTTTTTTBBTTB',
  '.BBBBBTTTTBBBBB.', '..BBBBBBBBBBBB..', '.BBBB......BBBB.', 'TTTT........TTTT']
export const DK_POUND = ['BB...BBBBBB...BB', 'TBB.BBBBBBBB.BBT', 'TTBBBBBBBBBBBBTT', '.TBBTTWKKWTTBBT.', '..BBTTTTTTTTBB..', '..BBTTTNNTTTBB..',
  '...BBTTTTTTBB...', '..BBBBTTTTBBBB..', '.BBBBBBBBBBBBBB.', '.BBBBTTTTTTBBBB.', '.BBBTTTTTTTTBBB.', '.BBBTTTTTTTTBBB.',
  '..BBBBTTTTBBBB..', '..BBBBBBBBBBBB..', '.BBBB......BBBB.', 'TTTT........TTTT']
export const DK_PAL = { B: '#7A3A12', T: '#E8B07A', W: '#FFFFFF', K: '#1A1A1A', N: '#4A2008' }
export const BARREL = [['.bbbb.', 'bBBBBb', 'KKKKKK', 'bBBBBb', 'bBBBBb', '.bbbb.'], ['.bbbb.', 'bBBBBb', 'bBBBBb', 'KKKKKK', 'bBBBBb', '.bbbb.']]
export const BARREL_PAL = { B: '#B5652A', b: '#7A3E12', K: '#3A1A06' }
const BARREL_BLUE = { B: '#4A78FF', b: '#2A48C8', K: '#0E1A60' }
const HEART = ['.PP.PP.', 'PPPPPPP', 'PPPPPPP', '.PPPPP.', '..PPP..', '...P...']
const GIRDER = { main: '#E8344E', light: '#FF9AAA' }
const DK = { walk: 42, barrel: 64, sc: 0.45 }

const donkeykong = {
  name: 'donkeykong',
  setup(L, S, V) {
    const d = this.dir = dirOf(V) // barrels roll in this direction
    this.blue = choose(V, 'blueBarrels', () => Math.random() < 0.3)
    this.dkX = d > 0 ? 0.2 : L.cols - 8.2
    this.dkFront = d > 0 ? this.dkX + 7.6 : this.dkX + 0.4
    // Jumpman works from the far end towards DK, facing him
    const order = mainLetters(L).sort((a, b) => (letterMid(L, b) - letterMid(L, a)) * d)
    const half = 12 * DK.sc / 2
    const standOf = (ci) => letterMid(L, ci) + d * 3 // his hammer comes down on the letter
    this.segs = []
    let t = 0.1, x = d > 0 ? L.cols + 4 : -4
    const walkTo = (tx) => {
      const dur = Math.abs(tx - x) / DK.walk
      if (dur > 0) this.segs.push({ t0: t, t1: t + dur, x0: x, x1: tx, mode: 'walk' })
      t += dur; x = tx
    }
    // the hammer floats over the first letter he reaches
    this.hamX = standOf(order[0]); this.hamY = GROUND - 11.5
    walkTo(this.hamX)
    this.segs.push({ t0: t, t1: t + 0.36, x0: x, x1: x, mode: 'jump' })
    this.tGrab = t + 0.18
    t += 0.36
    // each letter: get there, wait for the barrel, smash it
    this.barrels = []
    let lastThrow = 0.1
    for (const ci of order) {
      walkTo(standOf(ci))
      const smashX = letterMid(L, ci)
      const travel = Math.abs(smashX - this.dkFront) / DK.barrel
      let ts = t + 0.06
      if (ts - travel < lastThrow + 0.22) ts = lastThrow + 0.22 + travel
      lastThrow = ts - travel
      this.segs.push({ t0: t, t1: ts + 0.08, x0: x, x1: x, mode: 'stand' })
      this.barrels.push({ ci, throwAt: ts - travel, smashAt: ts, smashX, done: false })
      t = ts + 0.08
    }
    // up to DK, one bonk on the head
    walkTo(this.dkFront + d * (half + 0.3))
    this.segs.push({ t0: t, t1: t + 0.4, x0: x, x1: x, mode: 'jump' })
    this.tBonk = t + 0.2
    this.jx = x
    t += 0.4
    this.tEnd = t
    const smashOf = L.CX0.map((_, ci) => this.barrels.find((b) => b.ci === hostOf(L, ci)).smashAt)
    for (let i = 0; i < L.N; i++) {
      S.SX[i] = letterMid(L, hostOf(L, L.CI[i])) - 0.5; S.SY[i] = GROUND - 2
      S.DL[i] = smashOf[L.CI[i]] + (hash(i, 7, 7) / 1000) * 0.08; S.DU[i] = 0.5
    }
    this.planks = []; this.pops = []
    return this.tEnd + 0.9
  },
  ease: outCubic,
  offsetY: (k) => -Math.sin(k * Math.PI) * 2.5,
  colorAt(k, i, L, pal, tn) { return k < 0.25 ? (this.blue ? '#4A78FF' : '#B5652A') : (L.ACC[i] ? pal.acc : pal.ink)[tn] },
  underlay({ ctx, t, total, L, box }) {
    const a = fadeInOut(t, total, 0.25, 0.45)
    if (a <= 0) return
    ctx.globalAlpha = a
    // the red girder: two beams with a zigzag truss
    ctx.fillStyle = GIRDER.main; box(0, GROUND, L.cols, 0.35); box(0, GROUND + 1.45, L.cols, 0.35)
    ctx.fillStyle = GIRDER.light; box(0, GROUND, L.cols, 0.12)
    ctx.fillStyle = GIRDER.main
    for (let x = 0; x < L.cols; x += 2) {
      for (let k = 0; k < 4; k++) { box(x + k * 0.25, GROUND + 0.35 + k * 0.28, 0.35, 0.3); box(x + 1.75 - k * 0.25, GROUND + 0.35 + k * 0.28, 0.35, 0.3) }
    }
    // the ladder Jumpman came down, and the burning oil drum by DK
    const lx = this.dir > 0 ? L.cols - 1.8 : 0.3
    ctx.fillStyle = '#4FC3E8'
    box(lx, SCENE_TOP + 0.5, 0.25, GROUND - SCENE_TOP - 0.5); box(lx + 1.25, SCENE_TOP + 0.5, 0.25, GROUND - SCENE_TOP - 0.5)
    for (let y = SCENE_TOP + 1; y < GROUND; y += 1.3) box(lx, y, 1.5, 0.22)
    const ox = this.dir > 0 ? this.dkX + 8.2 : this.dkX - 2.8
    ctx.fillStyle = '#2A48C8'; box(ox, GROUND - 3, 2.6, 3)
    ctx.fillStyle = '#4A78FF'; box(ox, GROUND - 3, 2.6, 0.35); box(ox, GROUND - 0.6, 2.6, 0.35)
    drawText(ctx, box, 'OIL', ox + 0.25, GROUND - 2.2, 0.2, '#FFFFFF')
    for (let k = 0; k < 4; k++) {
      const h = 0.8 + (hash(k, Math.floor(t * 12), 5) / 1000) * 1.2
      ctx.fillStyle = k % 2 ? '#FFD23F' : '#FF6A1E'
      box(ox + 0.2 + k * 0.6, GROUND - 3 - h, 0.5, h)
    }
    ctx.globalAlpha = 1
  },
  jumpmanAt(t) {
    const seg = this.segs.find((s) => t >= s.t0 && t < s.t1) || (t < this.segs[0].t0 ? { ...this.segs[0], mode: 'off' } : { ...this.segs[this.segs.length - 1], mode: 'stand', x0: this.jx, x1: this.jx })
    const u = clamp01((t - seg.t0) / (seg.t1 - seg.t0))
    return { x: lerp(seg.x0, seg.x1, u), lift: seg.mode === 'jump' ? Math.sin(u * Math.PI) * 4.2 : 0, mode: seg.mode }
  },
  overlay({ ctx, t, dt, total, L, box }) {
    const d = this.dir, sc = DK.sc
    const fade = 1 - clamp01((t - (total - 0.4)) / 0.35)
    ctx.globalAlpha = fade
    const bpal = this.blue ? BARREL_BLUE : BARREL_PAL
    // DK: pounds his chest, hoists each barrel, throws; after the bonk he
    // sees stars, then tumbles off the girder
    if (t < this.tBonk) {
      const next = this.barrels.find((b) => t < b.throwAt && b.throwAt - t < 0.18)
      drawSprite(ctx, box, next || Math.floor(t * 5) % 2 === 0 ? DK_POUND : DK_IDLE, DK_PAL, this.dkX, GROUND - 8, 0.5, d < 0)
      if (next) drawSprite(ctx, box, BARREL[0], bpal, this.dkX + 2.5, GROUND - 10.2, 0.5)
    } else {
      const u = t - this.tBonk
      if (u < 0.35) {
        drawSprite(ctx, box, DK_IDLE, DK_PAL, this.dkX, GROUND - 8, 0.5, d < 0)
        ctx.fillStyle = '#FFE45A'
        for (let k = 0; k < 3; k++) {
          const a = u * 14 + (k * Math.PI * 2) / 3
          box(this.dkX + 4 + Math.cos(a) * 3 - 0.3, GROUND - 8.8 + Math.sin(a) * 0.8, 0.6, 0.6)
        }
      } else {
        const v = u - 0.35
        drawSprite(ctx, box, [...DK_IDLE].reverse(), DK_PAL, this.dkX - d * v * 4, GROUND - 8 - 6 * v + 30 * v * v, 0.5, d < 0)
      }
    }
    // the hammer, floating until he grabs it
    if (t < this.tGrab) {
      const y = this.hamY + Math.sin(t * 5) * 0.3
      ctx.fillStyle = '#8B5A2B'; box(this.hamX - 0.12, y, 0.25, 1.6)
      ctx.fillStyle = '#C9C9C9'; box(this.hamX - 0.7, y - 0.6, 1.4, 0.8)
    }
    // barrels: thrown, rolling, smashed into a burst of planks
    for (const b of this.barrels) {
      if (t < b.throwAt) continue
      if (t >= b.smashAt) {
        if (!b.done) {
          b.done = true
          for (const [vx, vy] of [[-5, -9], [5, -9], [-2, -12], [2, -12]]) this.planks.push({ x: b.smashX, y: GROUND - 1.5, vx, vy, life: 0, max: 0.7, size: 0.8, color: bpal.b, g: 30 })
          this.pops.push({ x: b.smashX, t0: t })
        }
        continue
      }
      const s = (t - b.throwAt) * DK.barrel
      drawSprite(ctx, box, BARREL[Math.floor(s / 1.2) % 2], bpal, this.dkFront + d * s - 1.5, GROUND - 3, 0.5)
    }
    stepParticles(this.planks, dt, ctx, box)
    ctx.globalAlpha = fade
    for (const q of this.pops) {
      const u = (t - q.t0) / 0.7
      if (u > 0 && u < 1) { ctx.globalAlpha = fade * (1 - u); drawTextCentered(ctx, box, '300', q.x, GROUND - 11 - u * 1.5, 0.4, '#FFFFFF', '#8A1428') }
    }
    ctx.globalAlpha = fade
    // Jumpman, facing DK, hammer swinging once he has it
    const j = this.jumpmanAt(t)
    if (j.mode !== 'off') {
      const rows = j.mode === 'jump' ? MARIO_JUMP : j.mode === 'walk' ? MARIO_RUN[Math.floor(t * 12) % 2] : MARIO_RUN[0]
      const w = 12 * sc
      const jx = j.x - w / 2, jy = GROUND - 16 * sc - j.lift
      drawSprite(ctx, box, rows, JUMPMAN_PAL, jx, jy, sc, d > 0)
      if (t > this.tGrab && t < this.tBonk + 0.2) {
        const smashing = this.barrels.some((b) => t > b.smashAt - 0.08 && t < b.smashAt + 0.06)
        const down = smashing || Math.floor(t * 8) % 2 === 0
        const hx = j.x - d * (down ? w * 0.65 : 0.2)
        const hy = down ? jy + 4.2 : jy - 1.6
        ctx.fillStyle = '#8B5A2B'; box(down ? Math.min(j.x, hx) : hx - 0.12, down ? hy + 0.25 : hy + 0.4, down ? Math.abs(hx - j.x) : 0.25, down ? 0.25 : 1.6)
        ctx.fillStyle = '#C9C9C9'; box(hx - (down ? 0.4 : 0.7), hy - (down ? 0.4 : 0.2), down ? 0.8 : 1.4, down ? 1.4 : 0.8)
      }
      if (t > this.tBonk + 0.25) {
        const u = clamp01((t - this.tBonk - 0.25) / 0.3)
        ctx.globalAlpha = fade * u
        drawSprite(ctx, box, HEART, { P: '#FF5A8A' }, j.x - 1.75, jy - 4 - u, 0.5)
      }
    }
    ctx.globalAlpha = 1
  },
}

export default donkeykong
