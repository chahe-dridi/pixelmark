// Pixel wordmark build: Minecraft. Steve flies in creative mode, swinging a
// diamond pickaxe and placing textured blocks letter by letter. An Enderman
// teleports in, steals a block and later puts it back. A creeper wanders up,
// hisses and blows a crater, which Steve repairs. Sometimes the Ender Dragon
// sweeps across. Finally every block "smelts" into the wordmark colours.

import { PAD_T, GH, GROUND, SCENE_TOP, hash, clamp01, lerp, inOut, follow, rand, pick, shuffled, fadeInOut, letterMid, mainLetters, hostOf, disc, drawSprite, stepParticles, finalColor } from '../engine/kit'

const MC = {
  stone: ['#8F8F8F', '#7A7A7A', '#A3A3A3'], dirt: ['#8B5A2B', '#6E4520', '#9C6B3A'], planks: ['#B8945F', '#9C7A48', '#CDAA70'],
  cobble: ['#7F7F7F', '#5C5C5C', '#A6A6A6'], gold: ['#F5D33B', '#D9A91E', '#FFF08A'], diamond: ['#5FE3D8', '#2BB3A3', '#B8FFF6'],
  brick: ['#9B4A3C', '#7A3528', '#C9B8A8'], log: ['#6B4F2A', '#4E3A1F', '#8A6A3C'],
}
// The creeper in three-quarter view: its face towards us, its side in
// shadow, and all four stubby legs. Walking, the legs step in diagonal
// pairs (front-left with back-right), each lifting and swinging a pixel.
const CREEPER_FACE = ['........', '........', '.KK..KK.', '.KK..KK.', '...KK...', '..KKKK..', '..KKKK..', '..K..K..']
const camo = (r, c) => 'aabcde'[(r * 7 + c * 13 + (r >> 1) * (c + 3)) % 6]
function creeperRows(step) {
  const W = 12, rows = []
  // legs: [first column, last column, which diagonal pair]
  const legs = [[0, 2, 0], [5, 7, 1], [8, 8, 1], [10, 10, 0]]
  for (let r = 0; r < 27; r++) {
    let row = ''
    for (let c = 0; c < W; c++) {
      let ch = '.'
      if (r < 8) {
        // head: the face, then its side receding in shadow
        if (c < 8) ch = CREEPER_FACE[r][c] === 'K' ? 'K' : camo(r, c)
        else if (c < 11 && r >= c - 8) ch = camo(r, c).toUpperCase()
      } else if (r < 20) {
        // body: front, with a narrow shaded side
        if (c >= 1 && c <= 6) ch = camo(r, c)
        else if (c >= 7 && c <= 8) ch = camo(r, c).toUpperCase()
      } else {
        for (const [c0, c1, pair] of legs) {
          const lifted = step && (step === 1 ? pair === 0 : pair === 1)
          const shift = lifted ? (step === 1 ? 1 : -1) : 0
          const bottom = lifted ? 25 : 26
          if (c - shift >= c0 && c - shift <= c1 && r <= bottom) ch = c0 >= 8 ? 'B' : (r === bottom ? 'd' : 'abd'[(r * 5 + c * 3) % 3])
        }
      }
      row += ch
    }
    rows.push(row)
  }
  return rows
}
export const CREEPER = [creeperRows(0), creeperRows(1), creeperRows(2)]
// lower case: lit front; upper case: the same camo, shaded side
export const CREEPER_PAL = { a: '#4CB43C', b: '#2F8A26', c: '#7ED36A', d: '#1E6A1A', e: '#6A8A5E', K: '#121212', A: '#357E2A', B: '#215F1A', C: '#5A9A4A', D: '#154A12', E: '#4A6242' }
const WHITE_PAL = Object.fromEntries(Object.keys(CREEPER_PAL).map((k) => [k, k === 'K' ? '#C8C8C8' : '#F4F4F4']))
const CREEPER_SC = 0.33
// the diamond pickaxe, the in-game icon: a cyan head arcing over the top,
// the wooden handle on the diagonal
export const PICKAXE = ['...KKKKKK.......', '..KHHHCCCKK.....', '...KKKKCCCCK....', '.......KKCCCK...', '......ksk.KCCK..', '.....ksk...KCCK.',
  '....ksk.....KCK.', '...ksk......KCK.', '..ksk........KK.', '.ksk............', 'ksk.............', 'kk..............']
export const PICKAXE_PAL = { K: '#156F63', C: '#33EBCB', H: '#C2FFF2', s: '#9C7638', k: '#4A3414' }
export const STEVE = [
  '....HHHHHHHH....', '....HHHHHHHH....', '....HhSSSShH....', '....SSSSSSSS....', '....SWBSSBWS....', '....SSSNNSSS....', '....SSMMMMSS....', '....SSSSSSSS....',
  'CCCCCCCSSCCCCCCC', 'CCCCCCCCCCCCCCCC', 'SSSSCCCCCCCCSSSS', 'SSSSCCCCCCCCSSSS', 'SSSScCCCCCCcSSSS', 'SSSScCCCCCCcSSSS', 'SSSSCCCCCCCCSSSS', 'SSSSCCCCCCCCSSSS',
  'SSSSCCCCCCCCSSSS', 'SSSSCCCCCCCCSSSS', 'ssssCCCCCCCCssss', 'ssssCCCCCCCCssss', '....PPPPPPPP....', '....PPPPPPPP....', '....PPPppPPP....', '....PPPppPPP....',
  '....PPPppPPP....', '....PPPppPPP....', '....PPPppPPP....', '....PPPppPPP....', '....PPPppPPP....', '....GGGGGGGG....', '....GGGggGGG....', '....GGGggGGG....']
export const STEVE_PAL = { H: '#3B2513', h: '#2A190C', S: '#C69C6D', s: '#AA7D52', W: '#FFFFFF', B: '#5544A8', N: '#9C6A47', M: '#6A4126',
  C: '#00AFAF', c: '#008A8A', P: '#3A3A9E', p: '#2A2A78', G: '#6E6E6E', g: '#565656' }
const STEVE_SC = 0.28
// the Enderman: three blocks tall, black, long thin arms and legs, the
// glowing purple eyes
const ENDERMAN = (() => {
  const rows = []
  for (let r = 0; r < 50; r++) {
    let row = ''
    for (let c = 0; c < 12; c++) {
      const head = r < 8 && c >= 2 && c <= 9
      const body = r >= 8 && r < 20 && c >= 2 && c <= 9
      const arm = r >= 8 && r < 38 && (c <= 1 || c >= 10)
      const leg = r >= 20 && (c === 3 || c === 4 || c === 7 || c === 8)
      if (head && r === 4) row += 'PpP..PpP'[c - 2] === '.' ? 'K' : 'PpP..PpP'[c - 2]
      else if (head || body || arm || leg) row += (r * 3 + c * 5) % 7 === 0 ? 'k' : 'K'
      else row += '.'
    }
    rows.push(row)
  }
  return rows
})()
const ENDER_PAL = { K: '#141414', k: '#202020', P: '#CC00FA', p: '#F2B8FF' }
const ENDER_SC = 0.26
const pad = (rows, w) => rows.map((r) => r.padEnd(w, '.'))
// the Ender Dragon, side on: spiked back, long neck, horned head with a
// purple eye, bat wings with grey membranes (two wingbeat frames)
export const DRAGON = [
  pad(['.................k.................k', '................kWk...............kWk', '...............kWWWk.............kWWWk',
    '..............kWWWWWk...........kWWWWWk', '.............kWWWWWWWk.........kWWWWWWWk', '............kWWWWWWWWWk.......kWWWWWWWWWk',
    '...........kWWWWWWWWWWWk.....kWWWWWWWWWWWk', '..s.s.s.s.sKKKKKKKKKKKKKKsKsKKKKKKKKKKKKKK.....s.s',
    'KKKKKKKKKKKKDKDKDKDKDKDKDKDKDKDKKKKKKKKKKKKKKKKKKK', '...KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.........KKKKKPK',
    '.......KKKKKKKKKKKKKKKKKKKKKKKKKKKK..........KKKKKKK', '...........KKK.........KKK...................K.K.K',
    '...........KK..........KK', ''], 52),
  pad(['', '', '', '', '', '', '', '..s.s.s.s.sKKKKKKKKKKKKKKsKsKKKKKKKKKKKKKK.....s.s',
    'KKKKKKKKKKKKDKDKDKDKDKDKDKDKDKDKKKKKKKKKKKKKKKKKKK', '...KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.........KKKKKPK',
    '.......KKKKKKKKKKKKKKKKKKKKKKKKKKKKk.........KKKKKKK', '...........kWWWWWWWWWWWk.....kWWWWWWWWWWWk...K.K.K',
    '............kWWWWWWWWWk.......kWWWWWWWWWk', '.............kWWWWWWWk.........kWWWWWWWk', '..............kWWWWWk...........kWWWWWk'], 52),
]
export const DRAGON_PAL = { K: '#131313', D: '#2E2E32', W: '#3A3A46', k: '#0E0E12', s: '#5A5A66', P: '#E079FA' }
const DRAGON_SC = 0.3
const LT = 0.27 // seconds to place one letter

const minecraft = {
  name: 'minecraft',
  setup(L, S) {
    const d = this.dir = Math.random() < 0.5 ? 1 : -1
    const keys = Object.keys(MC)
    const mats = shuffled(keys.length).map((k) => keys[k])
    this.mat = L.CX0.map((_, ci) => (L.ACC.some((a, i) => a && L.CI[i] === ci) ? 'tnt' : mats[ci % mats.length]))
    L.CX0.forEach((_, ci) => { this.mat[ci] = this.mat[hostOf(L, ci)] })
    const seq = mainLetters(L)
    if (d < 0) seq.reverse()
    this.seq = seq
    const startOf = L.CX0.map((_, ci) => 0.25 + seq.indexOf(hostOf(L, ci)) * LT)
    this.orig = new Float32Array(L.N)
    for (let i = 0; i < L.N; i++) {
      const fromBottom = GH - 1 - (L.Y[i] - PAD_T)
      this.orig[i] = startOf[L.CI[i]] + (fromBottom / GH) * LT * 0.9 + (hash(i, 3, 3) / 1000) * 0.02
    }
    // the creeper's target and the blocks its blast throws
    const target = pick(seq.slice(1, -1))
    this.ex = letterMid(L, target); this.ey = GROUND - 3.5
    this.te = 0.25 + seq.length * LT + 0.5
    this.blown = new Set()
    for (let i = 0; i < L.N; i++) {
      S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]; S.DU[i] = 0.07
      const dist = Math.hypot(L.X[i] + 0.5 - this.ex, (L.Y[i] + 0.5 - this.ey) * 1.1)
      if (dist < 3.6 + (hash(i, 5, 5) % 10) / 10) { this.blown.add(i); S.DL[i] = this.te + 0.45 + (1 - dist / 4.6) * 0.35 }
      else S.DL[i] = this.orig[i]
    }
    // the Enderman: steals a top block from an early letter, returns it later
    const early = seq.slice(0, Math.max(1, Math.floor(seq.length / 2))).filter((ci) => ci !== target)
    const eci = early.length ? pick(early) : seq[0]
    const occupied = new Set(Array.from(L.X, (x, i) => x * 64 + L.Y[i]))
    const tops = []
    for (let i = 0; i < L.N; i++) if (L.CI[i] === eci && !this.blown.has(i) && !occupied.has(L.X[i] * 64 + L.Y[i] - 1)) tops.push(i)
    this.stolen = tops.length ? pick(tops) : -1
    this.eTake = startOf[eci] + LT + 0.45
    this.eBack = this.te + 0.85
    this.eX1 = letterMid(L, eci) + (Math.random() < 0.5 ? -4.5 : 1.5)
    this.eX2 = d > 0 ? rand(L.cols * 0.6, L.cols - 6) : rand(3, L.cols * 0.4)
    if (this.stolen >= 0) S.DL[this.stolen] = this.eBack
    // the Ender Dragon, sometimes
    this.dragon = Math.random() < 0.6 ? { at: rand(0.5, 1.2), dir: Math.random() < 0.5 ? 1 : -1 } : null
    this.ts = this.te + 1.2
    this.cside = d > 0 ? 1 : -1
    this.cx0 = this.cside > 0 ? L.cols + 1 : -5
    this.head = [letterMid(L, seq[0]), GROUND]
    this.debris = []; this.puffs = []; this.bits = []; this.ender = []; this.boomed = false
    return this.ts + 0.55 + 0.4
  },
  ease: () => 1,
  texture(L, i) {
    const m = this.mat[L.CI[i]], gy = L.Y[i] - PAD_T
    if (m === 'tnt') {
      if (gy >= 5 && gy <= 7) return hash(L.X[i], L.Y[i], 2) % 4 === 0 ? '#2A2A2A' : '#F2F2F2'
      return L.X[i] % 2 === 0 ? '#DB3A2C' : '#B82A1E'
    }
    const h = hash(L.X[i], L.Y[i], 9) % 10
    return MC[m][h < 6 ? 0 : h < 8 ? 1 : 2]
  },
  colorAt(k, i, L, pal, tn, t) {
    const at = this.ts + (this.dir > 0 ? L.X[i] / L.cols : 1 - L.X[i] / L.cols) * 0.55
    if (t < at) return this.texture(L, i)
    return t - at < 0.06 ? pal.spark : finalColor(L, pal, i, tn)
  },
  underlay({ ctx, t, total, L, box }) {
    const a = fadeInOut(t, total, 0.25, 0.45)
    if (a <= 0) return
    ctx.globalAlpha = a
    for (let x = 0; x < L.cols; x += 0.5) {
      const crater = t > this.te && Math.abs(x + 0.25 - this.ex) < 3 - Math.abs(x + 0.25 - this.ex) * 0.2
      for (let y = GROUND; y < L.rows; y += 0.5) {
        if (crater && y < GROUND + 1.2) continue
        const h = hash(x * 2, y * 2, 4) % 10
        const grass = y < GROUND + 0.5 || (y < GROUND + 1 && h < 4)
        ctx.fillStyle = grass ? (h < 5 ? '#6CC349' : '#5DA130') : h < 6 ? '#866043' : h < 8 ? '#6E4F36' : '#9C7452'
        box(x, y, 0.5, 0.5)
      }
    }
    ctx.globalAlpha = 1
  },
  overlay({ ctx, t, dt, total, L, rect, box, p, px, py }) {
    const fade = 1 - clamp01((t - (total - 0.45)) / 0.35)
    // blocks drawn by hand until the engine takes over: the blast victims
    // (until the blast) and the Enderman's block (until he takes it)
    if (t < this.te) for (const i of this.blown) if (t >= this.orig[i]) { ctx.fillStyle = this.texture(L, i); rect(L.X[i], L.Y[i], 1) }
    if (this.stolen >= 0 && t >= this.orig[this.stolen] && t < this.eTake) { ctx.fillStyle = this.texture(L, this.stolen); rect(L.X[this.stolen], L.Y[this.stolen], 1) }
    if (t >= this.te && !this.boomed) {
      this.boomed = true
      for (const i of this.blown) {
        const dx = L.X[i] + 0.5 - this.ex, dy = L.Y[i] + 0.5 - this.ey, n = Math.hypot(dx, dy) || 1
        this.debris.push({ x: L.X[i] + 0.5, y: L.Y[i] + 0.5, vx: (dx / n) * rand(8, 16), vy: (dy / n) * rand(8, 16) - 6, life: 0, max: rand(0.5, 0.8), size: 0.8, color: this.texture(L, i), g: 30 })
      }
      for (let n = 0; n < 14; n++) this.puffs.push({ x: this.ex + rand(-2, 2), y: this.ey + rand(-2, 2), vx: rand(-4, 4), vy: rand(-4, 1), life: 0, max: rand(0.4, 0.7), size: rand(1.2, 2.2), grow: 1.2, color: pick(['#FFFFFF', '#E6E6E6', '#BDBDBD', '#8F8F8F']) })
    }
    stepParticles(this.debris, dt, ctx, box)
    stepParticles(this.puffs, dt, ctx, box)
    if (t > this.te && t < this.te + 0.18) {
      ctx.globalAlpha = 0.7 * (1 - (t - this.te) / 0.18)
      disc(ctx, box, this.ex, this.ey, 3.5 + (t - this.te) * 10, '#FFFFFF')
      ctx.globalAlpha = 1
    }
    // the creeper: wanders in, overshoots, comes back, hisses... boom
    if (t < this.te) {
      const tArr = this.te - 0.75, target = this.ex - 2, over = target - this.cside * 5
      const x = t < tArr * 0.65 ? lerp(this.cx0, over, inOut(t / (tArr * 0.65))) : t < tArr ? lerp(over, target, inOut((t - tArr * 0.65) / (tArr * 0.35))) : target
      const hissing = t > tArr
      // it swells and flashes white while it hisses
      const sc = hissing ? CREEPER_SC * (1 + 0.14 * ((t - tArr) / 0.75)) : CREEPER_SC
      const frame = hissing ? CREEPER[0] : CREEPER[[0, 1, 0, 2][Math.floor(t * 10) % 4]]
      drawSprite(ctx, box, frame, hissing && Math.floor(t * 9) % 2 === 0 ? WHITE_PAL : CREEPER_PAL,
        x + (hissing ? rand(-0.08, 0.08) : 0) - (sc - CREEPER_SC) * 6, GROUND - 27 * sc, sc, this.cside > 0 && !hissing && x > this.ex - 2.5)
    }
    // the Enderman: teleports in, grabs the block, teleports away, comes
    // back after the blast and puts it back
    if (this.stolen >= 0) this.drawEnderman(ctx, box, t, dt, L)
    // the Ender Dragon sweeping over the top
    if (this.dragon) {
      const u = (t - this.dragon.at) / 2.4
      if (u > 0 && u < 1) {
        const x = this.dragon.dir > 0 ? lerp(-15, L.cols + 1, u) : lerp(L.cols + 1, -15, u)
        const y = SCENE_TOP + 0.4 + Math.sin(t * 3) * 0.6
        drawSprite(ctx, box, DRAGON[Math.floor(t * 4) % 2], DRAGON_PAL, x, y - 1, DRAGON_SC, this.dragon.dir < 0)
        if (Math.random() < 0.5) this.ender.push({ x: x + (this.dragon.dir > 0 ? 15.5 : 0.5), y: y + 2.2, vx: rand(-1, 1), vy: rand(-1, 1), life: 0, max: 0.6, size: 0.3, color: '#C04CE8' })
      }
    }
    stepParticles(this.ender, dt, ctx, box)
    // Steve: flies along the build front, then over to repair the crater
    if (fade <= 0) return
    let tx, ty
    const k = (t - 0.25) / LT
    const working = k < this.seq.length || (t > this.te + 0.4 && t < this.te + 0.9)
    if (k < this.seq.length) {
      const ci = this.seq[Math.max(0, Math.floor(k))], f = clamp01(k - Math.floor(k))
      tx = letterMid(L, ci) + Math.sin(t * 9) * 2.5; ty = GROUND - f * GH
    } else if (t > this.te + 0.4 && t < this.te + 0.9) { tx = this.ex + Math.sin(t * 11) * 2; ty = this.ey - 1 }
    else { tx = this.dir > 0 ? L.cols - 6 : 6; ty = PAD_T + 4 + Math.sin(t * 3) * 0.4 }
    this.head[0] = follow(this.head[0], tx, 12, dt); this.head[1] = follow(this.head[1], ty, 12, dt)
    if (working && Math.random() < 0.6) this.bits.push({ x: this.head[0], y: this.head[1], vx: rand(-3, 3), vy: rand(-5, -1), life: 0, max: 0.35, size: 0.35, color: '#C9C9C9', g: 24 })
    stepParticles(this.bits, dt, ctx, box)
    const face = this.dir
    const sw = 16 * STEVE_SC, sh = 32 * STEVE_SC
    const sx = this.head[0] - face * 4.6 - sw / 2
    const sy = Math.max(SCENE_TOP - 1, Math.min(GROUND - sh, this.head[1] - 5)) + Math.sin(t * 4) * 0.2
    ctx.globalAlpha = fade
    drawSprite(ctx, box, STEVE, STEVE_PAL, sx, sy, STEVE_SC)
    // the pickaxe in the hand nearest the build, swinging at the block
    const hx = sx + (face > 0 ? sw - 0.55 : 0.55), hy = sy + 19 * STEVE_SC
    const swing = working ? Math.sin(t * 22) * 0.6 - 0.2 : -0.5
    ctx.save()
    ctx.translate(px(hx), py(hy)); ctx.scale(face, 1); ctx.rotate(swing)
    const cell = p * 0.34
    for (let r = 0; r < PICKAXE.length; r++) {
      for (let c = 0; c < PICKAXE[r].length; c++) {
        const col = PICKAXE_PAL[PICKAXE[r][c]]
        if (!col) continue
        ctx.fillStyle = col
        ctx.fillRect(c * cell - cell / 2, (r - PICKAXE.length + 0.5) * cell, cell + 0.5, cell + 0.5)
      }
    }
    ctx.restore()
    ctx.globalAlpha = 1
  },
  drawEnderman(ctx, box, t, dt, L) {
    const i = this.stolen
    const tIn = this.eTake - 0.4, tAway = this.eTake + 0.35, tReturn = this.eBack - 0.35, tGone = this.eBack + 0.3
    let x = null, carrying = false
    if (t > tIn && t < tAway) { x = this.eX1; carrying = t > this.eTake }
    else if (t >= tAway && t < tReturn) { x = this.eX2; carrying = true }
    else if (t >= tReturn && t < tGone) { x = this.eX1; carrying = t < this.eBack }
    // a purple puff at every teleport
    for (const tp of [tIn, tAway, tReturn, tGone]) {
      if (t >= tp && t - dt < tp) {
        const at = tp === tAway ? this.eX1 : tp === tReturn ? this.eX2 : this.eX1
        for (let n = 0; n < 14; n++) this.ender.push({ x: at + 1.5 + rand(-1.5, 1.5), y: GROUND - rand(0, 11), vx: rand(-2, 2), vy: rand(-3, 0), life: 0, max: rand(0.4, 0.8), size: rand(0.25, 0.5), color: pick(['#E07CFF', '#C04CE8', '#8A2BB8']) })
        if (tp === tAway || tp === tReturn) {
          const to = tp === tAway ? this.eX2 : this.eX1
          for (let n = 0; n < 10; n++) this.ender.push({ x: to + 1.5 + rand(-1.5, 1.5), y: GROUND - rand(0, 11), vx: rand(-2, 2), vy: rand(-3, 0), life: 0, max: rand(0.4, 0.8), size: rand(0.25, 0.5), color: pick(['#E07CFF', '#C04CE8']) })
        }
      }
    }
    if (x === null) return
    const h = ENDERMAN.length * ENDER_SC
    drawSprite(ctx, box, ENDERMAN, ENDER_PAL, x, GROUND - h, ENDER_SC)
    if (carrying) {
      // the stolen block, held out in front at hand height
      ctx.fillStyle = this.texture(L, i); box(x + 0.6, GROUND - h + 5.2, 2, 2)
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; box(x + 0.6, GROUND - h + 6.9, 2, 0.3)
    }
  },
}

export default minecraft
