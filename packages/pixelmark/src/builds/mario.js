// Pixel wordmark build: Super Mario. One of two levels each time:
//   run  the letters wait as bricks and ? blocks on a brick floor (overworld
//        or underground). Mario or Luigi (sometimes in star power) runs in
//        and bumps every letter: bricks shatter, ? blocks pay out coins.
//        Goombas and a Koopa walk into him and get stomped. He finishes by
//        hopping onto a warp pipe (a Piranha Plant snapping out of it) and
//        sinking into it, or by leaping onto the flagpole and sliding down.
//   map  an SMB3-style world map: Mario hops along the path from node to
//        node, bumps the ? box over each one, and its letter drops into
//        place; he ends at the castle.

import { PAD_T, GROUND, SCENE_TOP, clamp01, lerp, outCubic, inQuad, rand, shuffled, fadeInOut, letterMid, mainLetters, hostOf, drawSprite, drawText, drawTextCentered, stepParticles, finalColor, hash } from '../engine/kit'
import { MARIO_RUN, MARIO_JUMP, MARIO_PAL, LUIGI_PAL } from './sprites'

export const STAR_PALS = [
  { R: '#FFFFFF', S: '#F4B98A', H: '#D83A1E', B: '#D83A1E', Y: '#FFFFFF' },
  { R: '#2E9E3E', S: '#F4B98A', H: '#F2C14E', B: '#F2C14E', Y: '#2E9E3E' },
  { R: '#1A1A1A', S: '#F4B98A', H: '#F28C28', B: '#F28C28', Y: '#1A1A1A' },
  MARIO_PAL,
]
export const GOOMBA = [
  ['...BBBB...', '..BBBBBB..', '.BWKBBKWB.', 'BBWKBBKWBB', 'BBBBBBBBBB', '.BBSSSSBB.', '...SSSS...', '..SSSSSS..', '.KKK..KK..', 'KKKK..KKK.'],
  ['...BBBB...', '..BBBBBB..', '.BWKBBKWB.', 'BBWKBBKWBB', 'BBBBBBBBBB', '.BBSSSSBB.', '...SSSS...', '..SSSSSS..', '..KK..KKK.', '.KKK..KKKK'],
]
export const GOOMBA_FLAT = ['..BBBBBB..', 'BBWKBBKWBB', 'BBSSSSSSBB', 'KKKK..KKKK']
export const GOOMBA_PAL = { B: '#9C4A1A', W: '#FFFFFF', K: '#1E0E05', S: '#F4C38A' }
export const KOOPA = [
  ['.....YY...', '....YYYY..', '....YKYY..', '....YYYY..', '..GGGYYY..', '.GWGGGWY..', 'GGGWGGGWG.', 'GWGGGWGGG.', 'GGGWGGGWG.', '.WWWWWWW..', '..YY..YY..', '.YYY..YYY.'],
  ['.....YY...', '....YYYY..', '....YKYY..', '....YYYY..', '..GGGYYY..', '.GWGGGWY..', 'GGGWGGGWG.', 'GWGGGWGGG.', 'GGGWGGGWG.', '.WWWWWWW..', '...YY.YY..', '..YY..YYY.'],
]
export const SHELL = ['..GGGG..', '.GWGGWG.', 'GGGWWGGG', 'GWGGGGWG', 'WWWWWWWW', '.WWWWWW.']
export const KOOPA_PAL = { G: '#2E9E3E', W: '#F4F4F4', Y: '#F2C14E', K: '#1A1A1A' }
const PIRANHA = [
  ['..RRRRRR..', '.RRWRRWRR.', 'RRRRRRRRRR', 'RWRR..RRWR', 'RR......RR', 'RWRR..RRWR', 'RRRRRRRRRR', '.RRWRRWRR.', '..RRRRRR..', '....GG....', 'GG..GG..GG', '.GGGGGGGG.', '..GGGGGG..', '....GG....'],
  ['..RRRRRR..', '.RRWRRWRR.', 'RRRRRRRRRR', 'RWRRRRRRWR', 'RRWWWWWWRR', 'RWRRRRRRWR', 'RRRRRRRRRR', '.RRWRRWRR.', '..RRRRRR..', '....GG....', 'GG..GG..GG', '.GGGGGGGG.', '..GGGGGG..', '....GG....'],
]
const PIRANHA_PAL = { R: '#E0301E', W: '#FFFFFF', G: '#2E9E3E' }
const CLOUD = ['.....WWW......', '...WWWWWWW.WW.', '.WWWWWWWWWWWWW', 'WWWWWWWWWWWWWW', 'WWWLWWWWWLWWWW', '.LLLLLLLLLLLL.']
const CLOUD_PAL = { W: '#FFFFFF', L: '#BFD9F2' }
const BUSH = ['...GG..GG...', '..GGGGGGGG..', '.GGgGGGGgGG.', 'GGGGGGGGGGGG']
const BUSH_PAL = { G: '#3CB043', g: '#1E7A2E' }
const QBOX = ['KKKKKKKK', 'KQQQQQQK', 'KQWWWQQK', 'KQQQWQQK', 'KQQWWQQK', 'KQQQQQQK', 'KQQWQQQK', 'KKKKKKKK']
const THEMES = {
  over: { brick: '#C8501E', mortar: '#5C1F00', light: '#F8B088' },
  under: { brick: '#2A5CC8', mortar: '#0E2A6A', light: '#7FA8FF' },
}
const SMB = {
  qblock: '#F0A830', qlight: '#F8D070', qdark: '#B86A10', used: '#9C5A2A',
  coin: '#F8C030', coinDark: '#A86808', pipe: '#2E9E3E', pipeLight: '#7BD66F', pipeDark: '#14532D',
}
const MAP = { base: '#5DB443', dot: '#4A9A36', path: '#F4CC6A', pathEdge: '#B8862E', node: '#F8983A', bush: '#2E7D2A' }
const MARIO_V = 27, JUMP = 0.36, JUMP_H = 5, PIPE_W = 4.2, PIPE_H = 4.2

const mario = {
  name: 'mario',
  setup(L, S) {
    this.hero = Math.random() < 0.3 ? 'luigi' : 'mario'
    this.mode = Math.random() < 0.4 ? 'map' : 'run'
    this.pops = []; this.debris = []; this.spawned = new Set()
    return this.mode === 'map' ? this.setupMap(L, S) : this.setupRun(L, S)
  },

  // ── run ─────────────────────────────────────────────────────────────────
  setupRun(L, S) {
    this.star = Math.random() < 0.2
    this.theme = THEMES[Math.random() < 0.3 ? 'under' : 'over']
    this.under = this.theme === THEMES.under
    this.ending = Math.random() < 0.5 ? 'pipe' : 'flag'
    this.flagScored = false
    const v = this.v = MARIO_V * (this.star ? 1.12 : 1)
    this.x0 = -7
    const mains = mainLetters(L)
    this.jumps = mains.map((ci) => ({ ci, at: (letterMid(L, ci) - 3 - this.x0) / v - JUMP / 2 }))
    this.kind = L.CX0.map(() => (Math.random() < 0.5 ? 'brick' : 'coin'))
    L.CX0.forEach((_, ci) => { this.kind[ci] = this.kind[hostOf(L, ci)] })
    this.hit = L.CX0.map((_, ci) => this.jumps.find((q) => q.ci === hostOf(L, ci)).at + JUMP / 2)
    const tLand = this.jumps[this.jumps.length - 1].at + JUMP
    this.xLand = this.x0 + v * tLand
    this.hop0 = tLand + 0.04
    if (this.ending === 'pipe') {
      this.pipeX = L.cols - 3.9
      this.pipeTop = GROUND - PIPE_H
      this.hop1 = this.hop0 + 0.44
      this.xOnPipe = this.pipeX + PIPE_W / 2 - 3
      this.sink0 = this.hop1 + 0.18; this.sink1 = this.sink0 + 0.5
      this.finish = this.sink1
    } else {
      // the flagpole: leap, grab it high, slide down with the flag, walk off
      this.poleX = L.cols - 1.4
      this.hop1 = this.hop0 + 0.4
      this.grabY = GROUND - 8 - 5.5
      this.slide1 = this.hop1 + 0.6
      this.finish = this.slide1 + 0.55
    }
    const spots = shuffled(Math.max(0, this.jumps.length - 3)).map((k) => this.jumps[k + 1])
    const cast = [Math.random() < 0.65 ? 'koopa' : 'goomba', Math.random() < 0.7 ? 'goomba' : null, Math.random() < 0.35 ? 'goomba' : null].filter(Boolean)
    this.enemies = cast.slice(0, spots.length).map((type, k) => {
      const tm = spots[k].at + JUMP, vg = type === 'koopa' ? 2.6 : 3.2
      return { type, tm, vg, gx0: this.x0 + v * tm + 0.5 + vg * tm, scored: false }
    })
    this.plantPhase = rand(0, 2)
    this.clouds = [0, 1].map(() => ({ x: rand(4, L.cols - 14), y: rand(SCENE_TOP + 0.2, SCENE_TOP + 1.2) }))
    this.bush = rand(6, L.cols - 18)
    for (let i = 0; i < L.N; i++) {
      S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
      S.DL[i] = this.hit[L.CI[i]]; S.DU[i] = 0.32
    }
    return this.finish + 0.85
  },
  marioAt(t) {
    if (t < this.hop0) {
      let lift = 0, air = false
      for (const j of this.jumps) {
        const u = (t - j.at) / JUMP
        if (u > 0 && u < 1) { lift = Math.max(lift, Math.sin(u * Math.PI) * JUMP_H); air = true }
      }
      return { x: this.x0 + this.v * t, y: GROUND - 8 - lift, air, sink: 0 }
    }
    if (this.ending === 'pipe') {
      if (t < this.hop1) {
        const u = (t - this.hop0) / (this.hop1 - this.hop0)
        return { x: lerp(this.xLand, this.xOnPipe, u), y: lerp(GROUND - 8, this.pipeTop - 8, u) - 3.5 * Math.sin(u * Math.PI), air: true, sink: 0 }
      }
      const sink = clamp01((t - this.sink0) / (this.sink1 - this.sink0))
      return { x: this.xOnPipe, y: this.pipeTop - 8 + inQuad(sink) * 8.6, air: false, sink }
    }
    const gx = this.poleX - 5.6
    if (t < this.hop1) {
      const u = (t - this.hop0) / (this.hop1 - this.hop0)
      return { x: lerp(this.xLand, gx, u), y: lerp(GROUND - 8, this.grabY, u) - 2 * Math.sin(u * Math.PI), air: true, sink: 0 }
    }
    if (t < this.slide1) return { x: gx, y: lerp(this.grabY, GROUND - 8, (t - this.hop1) / (this.slide1 - this.hop1)), air: true, sink: 0, pole: true }
    return { x: gx + 2 + (t - this.slide1) * 18, y: GROUND - 8, air: false, sink: 0, walk: true }
  },

  // ── map ─────────────────────────────────────────────────────────────────
  setupMap(L, S) {
    const mains = mainLetters(L)
    this.nodes = mains.map((ci) => ({ ci, x: letterMid(L, ci) }))
    this.castleX = L.cols - 3.2
    const HOP = 0.44
    let t = 0.55
    let x = 1.5
    this.hops = []
    for (const n of this.nodes) {
      this.hops.push({ t0: t, t1: t + HOP, x0: x, x1: n.x, ci: n.ci, hit: t + HOP * 0.62 })
      t += HOP + 0.08; x = n.x
    }
    this.hops.push({ t0: t + 0.1, t1: t + 0.5, x0: x, x1: this.castleX, castle: true })
    this.tIn = t + 0.5
    const hitOf = L.CX0.map((_, ci) => this.hops.find((h) => h.ci === hostOf(L, ci)).hit)
    for (let i = 0; i < L.N; i++) {
      S.SX[i] = L.X[i]; S.SY[i] = L.Y[i] - 15
      S.DL[i] = hitOf[L.CI[i]] + 0.05 + (hash(i, 2, 2) / 1000) * 0.06; S.DU[i] = 0.42
    }
    this.bushes = Array.from({ length: 7 }, () => [rand(1, L.cols - 4), rand(SCENE_TOP + 0.5, GROUND - 6)])
    return this.tIn + 0.85
  },

  ease(k) {
    if (this.mode !== 'map') return 1
    // a dropped letter: falls, then one small bounce as it lands
    return k < 0.72 ? (k / 0.72) ** 2 : 1 - 0.09 * Math.sin(((k - 0.72) / 0.28) * Math.PI)
  },
  waiting() { return this.mode === 'run' ? { alpha: 1, size: 1 } : null },
  offsetY(k) { return this.mode === 'run' ? -Math.sin(k * Math.PI) * 0.9 : 0 },
  colorAt(k, i, L, pal, tn, t) {
    if (this.mode === 'map') return k > 0.9 && k < 0.98 ? pal.spark : finalColor(L, pal, i, tn)
    if (k > 0) return k < 0.18 ? pal.spark : finalColor(L, pal, i, tn)
    const ci = L.CI[i], gy = L.Y[i] - PAD_T
    if (this.kind[ci] === 'coin') {
      if ((L.X[i] - L.CX0[ci]) % 4 === 0 || gy % 4 === 0) return SMB.qdark
      return Math.floor(t * 3.3) % 3 === 0 ? SMB.qlight : SMB.qblock
    }
    const mortar = gy % 3 === 2 || (L.X[i] + (Math.floor(gy / 3) % 2) * 2) % 4 === 0
    return mortar ? this.theme.mortar : this.theme.brick
  },

  underlay(args) {
    if (this.mode === 'map') return this.underlayMap(args)
    const { ctx, t, total, L, box, px, py } = args
    const a = fadeInOut(t, total, 0.3, 0.5)
    const th = this.theme
    if (!this.under) {
      ctx.globalAlpha = a * 0.92
      for (const c of this.clouds) drawSprite(ctx, box, CLOUD, CLOUD_PAL, c.x - t * 0.8, c.y, 0.5)
      ctx.globalAlpha = a
      drawSprite(ctx, box, BUSH, BUSH_PAL, this.bush, GROUND - 2, 0.5)
    } else {
      // underground: a brick ceiling
      ctx.globalAlpha = a
      for (let x = 0; x < L.cols; x += 2) {
        ctx.fillStyle = th.brick; box(x, SCENE_TOP, 2, 1)
        ctx.fillStyle = th.mortar; box(x + 1.8, SCENE_TOP, 0.2, 1); box(x, SCENE_TOP + 0.85, 2, 0.15)
      }
    }
    ctx.globalAlpha = a
    for (let x = 0; x < L.cols; x += 2) {
      ctx.fillStyle = th.brick; box(x, GROUND, 2, 2)
      ctx.fillStyle = th.light; box(x, GROUND, 2, 0.25); box(x, GROUND, 0.25, 2)
      ctx.fillStyle = th.mortar; box(x + 1.75, GROUND, 0.25, 2); box(x, GROUND + 1.75, 2, 0.25); box(x + 0.25, GROUND + 0.9, 1.5, 0.2)
    }
    if (this.ending === 'pipe') {
      let up = 0
      if (t < this.hop0 - 0.7) {
        const ph = (t * 0.85 + this.plantPhase) % 2
        up = ph < 0.25 ? ph / 0.25 : ph < 0.95 ? 1 : ph < 1.2 ? 1 - (ph - 0.95) / 0.25 : 0
      } else if (t > this.sink1 + 0.15) up = outCubic(clamp01((t - this.sink1 - 0.15) / 0.3))
      if (up > 0) {
        ctx.save()
        ctx.beginPath(); ctx.rect(px(this.pipeX - 2), py(0), px(this.pipeX + PIPE_W + 2) - px(this.pipeX - 2), py(this.pipeTop) - py(0)); ctx.clip()
        drawSprite(ctx, box, PIRANHA[Math.floor(t * 6) % 2], PIRANHA_PAL, this.pipeX + PIPE_W / 2 - 2.25, this.pipeTop - up * 6.3, 0.45)
        ctx.restore()
      }
      const x = this.pipeX, top = this.pipeTop
      ctx.fillStyle = SMB.pipeDark; box(x + 0.3, top + 1.2, PIPE_W - 0.6, PIPE_H - 1.2)
      ctx.fillStyle = SMB.pipe; box(x + 0.5, top + 1.2, PIPE_W - 1, PIPE_H - 1.2)
      ctx.fillStyle = SMB.pipeLight; box(x + 0.9, top + 1.2, 0.45, PIPE_H - 1.2)
      ctx.fillStyle = SMB.pipeDark; box(x, top, PIPE_W, 1.3)
      ctx.fillStyle = SMB.pipe; box(x + 0.2, top + 0.2, PIPE_W - 0.4, 0.9)
      ctx.fillStyle = SMB.pipeLight; box(x + 0.55, top + 0.2, 0.45, 0.9)
    } else {
      // the flagpole, its flag sliding down with Mario
      const top = SCENE_TOP + 1.2
      ctx.fillStyle = '#5FCB52'; box(this.poleX, top, 0.35, GROUND - top)
      ctx.fillStyle = '#2E9E3E'; box(this.poleX - 0.5, GROUND - 1, 1.35, 1)
      ctx.fillStyle = '#FFFFFF'; box(this.poleX - 0.25, top - 0.8, 0.85, 0.85)
      const fy = t < this.hop1 ? top + 0.3 : lerp(top + 0.3, GROUND - 3.5, clamp01((t - this.hop1) / (this.slide1 - this.hop1)))
      ctx.fillStyle = '#FFFFFF'
      for (let k = 0; k < 6; k++) box(this.poleX - 0.5 - (6 - k) * 0.5, fy + k * 0.25, (6 - k) * 0.5, 2.8 - k * 0.5)
      ctx.fillStyle = '#2E9E3E'; box(this.poleX - 2.2, fy + 0.9, 0.9, 0.9)
    }
    ctx.globalAlpha = 1
  },
  underlayMap({ ctx, t, total, L, box }) {
    const a = fadeInOut(t, total, 0.3, 0.55)
    if (a <= 0) return
    ctx.globalAlpha = a
    ctx.fillStyle = MAP.base; box(0, SCENE_TOP, L.cols, L.rows - SCENE_TOP)
    ctx.fillStyle = MAP.dot
    for (let x = 0; x < L.cols; x += 2) for (let y = SCENE_TOP; y < L.rows; y += 2) if (hash(x, y, 8) < 180) box(x + 0.6, y + 0.6, 0.4, 0.4)
    for (const [bx, by] of this.bushes) {
      ctx.fillStyle = MAP.bush; box(bx, by, 2.4, 1.6); box(bx + 0.4, by - 0.6, 1.6, 0.8)
      ctx.fillStyle = '#7DD05E'; box(bx + 0.5, by - 0.4, 0.5, 0.4)
    }
    drawText(ctx, box, 'WORLD 1', 1.2, SCENE_TOP + 0.4, 0.3, '#FFFFFF', '#1E5A1A')
    // the path along the bottom, the numbered level panels, and the castle
    const py0 = GROUND - 0.8
    ctx.fillStyle = MAP.pathEdge; box(0.5, py0 - 0.2, this.castleX - 0.5, 1.2)
    ctx.fillStyle = MAP.path; box(0.5, py0, this.castleX - 0.5, 0.8)
    this.nodes.forEach((n, k) => {
      const cleared = t > this.hops[k].hit
      ctx.fillStyle = '#5A2A0A'; box(n.x - 1.1, py0 - 0.75, 2.2, 2.2)
      ctx.fillStyle = cleared ? '#C8C8C8' : MAP.node; box(n.x - 0.9, py0 - 0.55, 1.8, 1.8)
      drawTextCentered(ctx, box, String(k + 1), n.x, py0 - 0.35, 0.28, cleared ? '#7A7A7A' : '#3A1A00')
    })
    const cx = this.castleX
    ctx.fillStyle = '#B8B8B8'; box(cx - 1.4, GROUND - 4.6, 3.6, 4.4)
    ctx.fillStyle = '#8A8A8A'; for (let k = 0; k < 3; k++) box(cx - 1.4 + k * 1.3, GROUND - 5.4, 0.9, 0.8)
    ctx.fillStyle = '#3A2A1A'; box(cx - 0.2, GROUND - 2.2, 1.2, 2)
    ctx.fillStyle = '#E0301E'; box(cx + 0.2, GROUND - 7, 1.2, 0.8); ctx.fillStyle = '#5A5A5A'; box(cx + 0.1, GROUND - 7, 0.15, 1.8)
    ctx.globalAlpha = 1
  },

  overlay(args) {
    if (this.mode === 'map') return this.overlayMap(args)
    const { ctx, t, dt, L, box, px, py } = args
    for (const j of this.jumps) {
      const ci = j.ci, th = this.hit[ci]
      if (t < th || this.spawned.has(ci)) continue
      this.spawned.add(ci)
      const mx = letterMid(L, ci)
      if (this.kind[ci] === 'brick') {
        for (const [vx, vy] of [[-4, -12], [4, -12], [-2.5, -8], [2.5, -8]]) this.debris.push({ x: mx, y: PAD_T + 1, vx, vy, life: 0, max: 0.9, size: 1, color: this.theme.brick, g: 34, fade: false })
      } else this.pops.push({ kind: 'coin', x: mx, t0: th })
    }
    stepParticles(this.debris, dt, ctx, box)
    this.drawPops(ctx, box, t, L)
    for (const e of this.enemies) {
      const x = e.gx0 - e.vg * Math.min(t, e.tm)
      const walk = Math.floor(t * 6) % 2
      if (t < e.tm) {
        if (e.type === 'koopa') drawSprite(ctx, box, KOOPA[walk], KOOPA_PAL, x, GROUND - 6, 0.5, true)
        else drawSprite(ctx, box, GOOMBA[walk], GOOMBA_PAL, x, GROUND - 5, 0.5, Math.floor(t * 3) % 2 === 1)
      } else if (this.star) {
        const u = t - e.tm
        if (u < 0.9) drawSprite(ctx, box, [...(e.type === 'koopa' ? KOOPA[0] : GOOMBA[0])].reverse(), e.type === 'koopa' ? KOOPA_PAL : GOOMBA_PAL, x + u * 6, GROUND - 5 - 9 * u + 26 * u * u, 0.5)
      } else if (e.type === 'koopa') {
        const u = t - e.tm
        const sx = u < 0.15 ? x : x - (u - 0.15) * 32
        if (sx > -5) drawSprite(ctx, box, SHELL, KOOPA_PAL, sx + 0.5, GROUND - 3, 0.5)
      } else if (t < e.tm + 0.4) drawSprite(ctx, box, GOOMBA_FLAT, GOOMBA_PAL, x, GROUND - 2, 0.5)
      if (t >= e.tm && !e.scored) { e.scored = true; this.pops.push({ kind: 'score', text: e.type === 'koopa' ? '200' : '100', x: x + 2.5, y: GROUND - 8, t0: t }) }
    }
    if (this.ending === 'flag' && t >= this.hop1 && !this.flagScored) { this.flagScored = true; this.pops.push({ kind: 'score', text: '5000', x: this.poleX - 3, y: this.grabY - 1, t0: t }) }
    const m = this.marioAt(t)
    if (m.sink >= 1 || m.x > L.cols + 1) return
    const colors = this.star ? STAR_PALS[Math.floor(t * 12) % STAR_PALS.length] : this.hero === 'luigi' ? LUIGI_PAL : MARIO_PAL
    const rows = m.air ? MARIO_JUMP : m.walk ? MARIO_RUN[Math.floor(t * 10) % 2] : t > this.hop1 ? MARIO_RUN[0] : MARIO_RUN[Math.floor(t * 10) % 2]
    if (m.sink > 0) {
      ctx.save()
      ctx.beginPath(); ctx.rect(px(-10), py(-2), px(L.cols + 10) - px(-10), py(this.pipeTop) - py(-2)); ctx.clip()
      drawSprite(ctx, box, rows, colors, m.x, m.y, 0.5)
      ctx.restore()
    } else drawSprite(ctx, box, rows, colors, m.x, m.y, 0.5)
  },
  overlayMap({ ctx, t, dt, total, L, box }) {
    const a = fadeInOut(t, total, 0.3, 0.55)
    if (a <= 0) return
    ctx.globalAlpha = a
    // the ? boxes: bumped from below, they go dull and pop away
    this.hops.forEach((h) => {
      if (h.castle) return
      const since = t - h.hit
      if (since > 0.35) return
      const bump = since > 0 ? Math.sin(Math.min(1, since / 0.15) * Math.PI) * 0.6 : 0
      const used = since > 0
      drawSprite(ctx, box, QBOX, { K: '#5A2A0A', Q: used ? SMB.used : Math.floor(t * 3) % 3 === 0 ? SMB.qlight : SMB.qblock, W: used ? SMB.used : '#FFFFFF' }, h.x1 - 1.3, GROUND - 12.4 - bump, 0.33)
      if (since > 0 && !h.coined) { h.coined = true; this.pops.push({ kind: 'coin', x: h.x1, t0: t }) }
    })
    this.drawPops(ctx, box, t, L)
    // Mario hops node to node, peaking right under each box
    const h = this.hops.find((q) => t >= q.t0 && t < q.t1)
    let x, lift = 0, air = false
    if (h) {
      const u = (t - h.t0) / (h.t1 - h.t0)
      if (h.castle) { x = lerp(h.x0, h.x1, u) }
      else {
        // rise while travelling, reach the node at the peak, drop straight down
        x = u < 0.62 ? lerp(h.x0, h.x1, outCubic(u / 0.62)) : h.x1
        lift = u < 0.62 ? Math.sin((u / 0.62) * Math.PI / 2) * 2.6 : 2.6 * (1 - ((u - 0.62) / 0.38) ** 2)
        air = true
      }
    } else {
      const prev = [...this.hops].reverse().find((q) => q.t1 <= t)
      x = prev ? prev.x1 : 1.5
      if (prev && prev.castle) return
    }
    const sc = 0.45
    drawSprite(ctx, box, air ? MARIO_JUMP : MARIO_RUN[h && h.castle ? Math.floor(t * 10) % 2 : 0], this.hero === 'luigi' ? LUIGI_PAL : MARIO_PAL, x - 6 * sc, GROUND - 0.9 - 16 * sc - lift, sc)
    ctx.globalAlpha = 1
  },
  drawPops(ctx, box, t, L) {
    for (const q of this.pops) {
      const u = (t - q.t0) / (q.kind === 'coin' ? 0.55 : 0.7)
      if (u < 0 || u >= 1) continue
      if (q.kind === 'coin') {
        const base = this.mode === 'map' ? GROUND - 13 : PAD_T - 1.2
        const y = base - outCubic(Math.min(1, u * 1.5)) * 2 + (u > 0.66 ? (u - 0.66) * 6 : 0)
        const spin = Math.max(0.2, Math.abs(Math.cos(u * 16)))
        ctx.fillStyle = SMB.coinDark; box(q.x - 0.7 * spin, y, 1.4 * spin, 2)
        ctx.fillStyle = SMB.coin; box(q.x - 0.45 * spin, y + 0.25, 0.9 * spin, 1.5)
      } else {
        const keep = ctx.globalAlpha
        ctx.globalAlpha = keep * (1 - u)
        drawTextCentered(ctx, box, q.text, Math.max(3, Math.min(L.cols - 3, q.x)), q.y - u * 2, 0.4, '#FFFFFF', '#3A1A00')
        ctx.globalAlpha = keep
      }
    }
  },
}

export default mario
