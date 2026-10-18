// Pixel wordmark build: Dragon Ball. Goku (base, Super Saiyan 1/2/3, Super
// Saiyan God or Ultra Instinct) in one of these scenes:
//   solo    KA-ME-HA-ME-HA! (or Vegeta's Galick Gun) sweeps the letters in;
//           sometimes he powers up 1 → 2 → 3 first
//   win     a beam struggle against Broly, Frieza or Jiren: the beams meet,
//           grind back and forth, then Goku overpowers them
//   rescue  the villain is winning: Goku's beam is shoved back almost to his
//           hands... then Vegeta (Galick Gun) or Piccolo (Special Beam
//           Cannon) arrives and the combined blast blows the villain away
//   duo     Goku and Vegeta fire side by side against the villain
// Solo scenes may star Vegeta or Piccolo instead. The villains (Broly,
// Frieza, Jiren, Beerus) power up mid-scene: Legendary Broly, Golden
// Frieza, Full Power Jiren.
//   spirit  the Spirit Bomb gathers above and drops; a shockwave reveals all
// The letters light up wherever the hero's beam has reached.

import { PAD_T, GROUND, hash, clamp01, lerp, inOut, follow, rand, pick, disc, drawSprite, drawText, textWidth, ring, finalColor, choose, dirOf } from '../engine/kit'

// ── Goku and Vegeta (12×18) ───────────────────────────────────────────────
const HAIR = {
  goku: ['..H.HH.H....', '.HHHHHHHH.H.', 'HHHHHHHHHHH.'],
  ssj: ['.H.H.HH.H.H.', 'HHHHHHHHHHHH', 'HHHHHHHHHHH.'],
  vegeta: ['...HHHHH....', '..HHHHHHH...', '..HHHHHHHH..'],
}
const FACE = ['.HHHSSSSHH..', '..HSSKSSK...', '...SSSSSS...', '....SSSS....']
const LEGS = ['...UUUUUU...', '...OOOOOO...', '..OOOooOOO..', '.OOO....OOO.', '.OO......OO.', 'UUU......UUU', 'UUU......UUU']
const TORSO = {
  charge: ['..OOUUUUOO..', '.OOOOUUOOOO.', 'SSOOOOOOOOO.', 'SSOOOOOOOO..'],
  fire: ['..OOUUUUOO..', '.OOOOUUOOOOO', '..OOOOOOOSSS', '..OOOOOOOSSS'],
}
export function hero(pose, hair, long) {
  const rows = [...HAIR[hair], ...FACE, ...(TORSO[pose] || TORSO.charge), ...LEGS]
  if (long) for (let r = 3; r < 9; r++) rows[r] = 'HH' + rows[r].slice(2)
  if (pose === 'up') for (let r = 0; r < 7; r++) rows[r] = (r < 2 ? 'S' : 'O') + rows[r].slice(1, 11) + (r < 2 ? 'S' : 'O')
  return rows
}
export const FORMS = {
  base: { H: '#1A1A1A', aura: '#F4F4F4' },
  ssj1: { H: '#F8E048', aura: '#FFE45A' },
  ssj2: { H: '#F8E048', aura: '#FFE45A', bolts: true },
  ssj3: { H: '#F8E048', aura: '#FFE45A', bolts: true, long: true },
  ui: { H: '#D9DEE8', aura: '#B9C8FF', sparkle: true },
  ssg: { H: '#D23A4A', aura: '#FF5A6A', sparkle: true },
}
// Piccolo: charging two fingers at his brow, then firing
const PICCOLO_LEGS = ['...PPPPPP...', '..PPPPPPPP..', '..PPP..PPP..', '..PPP..PPP..', '..PPP..PPP..', '..NNN..NNN..', '.NNNN..NNNN.']
const PICCOLO = {
  charge: ['...G....G...', '....G..G....', '...GGGGGG...', '..GGGGGGGGGG', '..GKGGGGKGG.', '...GGGGGGG..', '....GGGGG...', '..PPPPPPPP..',
    '.GPPPPPPPP..', '.GPPPPPPPP..', '.n.BBBBBB...', ...PICCOLO_LEGS],
  fire: ['...G....G...', '....G..G....', '...GGGGGG...', '..GGGGGGGG..', '..GKGGGGKG..', '...GGGGGG...', '....GGGG....', '..PPPPPPPP..',
    '.GPPPPPPPGGG', '.GPPPPPPPP..', '.n.BBBBBB...', ...PICCOLO_LEGS],
}
const PICCOLO_PAL = { G: '#5DBB4A', K: '#111111', P: '#5A2A8A', B: '#5BA8E8', n: '#E88AA0', N: '#6B3E1F' }
export const GOKU_PAL = { S: '#F4C08A', K: '#111111', O: '#F08A24', o: '#B85E10', U: '#2347A8' }
export const VEGETA_PAL = { S: '#F4C08A', K: '#111111', O: '#2B3FA8', o: '#1A2870', U: '#F2F2F2' }
const SC = 0.55, GW = 12 * SC, GHt = 18 * SC

// ── villains (16×22), drawn facing right; each powers up mid-scene ───────
const BROLY = ['..Y.YYYYYYYY.Y..', '.YYYYYYYYYYYYYY.', 'YYYYYYYYYYYYYYYY', '.YYYSSSSSSSSYYY.', '..YSSEESSEESSY..', '...SSSSSSSSSS...', '....SSSMMSSS....',
  '...GGGGGGGGGG...', '.SSSSSSSSSSSSSS.', 'SSSSSSsSSsSSSSSS', 'SSSSSSsSSsSSSSSS', 'SSSS.SSSSSS.SSSS', 'GGSS.SsSSsS.SSGG', 'SSS..SSSSSS..SSS',
  '....RRRRRRRR....', '...WWWWWWWWWW...', '..WWWWWWWWWWWW..', '..WWWWW..WWWWW..', '..WWWW....WWWW..', '...GGG....GGG...', '..KKKK....KKKK..', '..KKKK....KKKK..']
const JIREN = ['.....SSSSSS.....', '....SSSSSSSS....', '...SSSSSSSSSS...', '...SEEESSEEES...', '..SEEhESSEhEES..', '..SEEEESSEEEES..', '...SEESSSSEES...',
  '...SSSSMMSSSS...', '....SSSSSSSS....', '.....SSSSSS.....', '..WWWRRRRRRWWW..', '.KKKKRRRRRRKKKK.', 'SSKKKKRRRRKKKKSS', 'SSKKKKRRRRKKKKSS',
  'SS.KKKKKKKKKK.SS', 'SS.KKKKKKKKKK.SS', '....KKKKKKKK....', '....KKK..KKK....', '....KKK..KKK....', '....KKK..KKK....', '...WWWW..WWWW...', '...WWWW..WWWW...']
const FRIEZA = ['.....PPPPPP.....', '....PPPPPPPP....', '....PWWWWWWP....', '....WWWWWWWW....', '....WRRWWRRW....', '....WWWWWWWW....', '.....WWPPWW.....',
  '......WWWW......', '...PPWWWWWWPP...', '..PPPWWWWWWPPP..', '..WWWWWWWWWWWW..', '..WW.WWWWWW.WW..', '..PP.WWPPWW.PP..', '..WW.WWWWWW.WW..',
  '.....WWWWWW.....', '....WWWWWWWW....', '....WWW..WWW....', '....WWW..WWW....', '....PPP..PPP....', '....WWW..WWW....', '...WWWW..WWWW...', 'WWWWW...........']
const BEERUS = ['..P..........P..', '..PP........PP..', '..PPP.PPPP.PPP..', '..PPPPPPPPPPPP..', '...PYYPPPPYYP...', '...PPPPPPPPPP...', '....PPPKKPPP....',
  '.....PPPPPP.....', '...GGGGGGGGGG...', '..PGBBGGGGBBGP..', '..PPPPPPPPPPPP..', '.PP.PPPPPPPP.PP.', '.GG.PPPPPPPP.GG.', '.PP..OOOOOO..PP.',
  '.....KKKKKK.....', '....KKKKKKKK....', '...KKKKKKKKKK...', '...KKKKKKKKKK...', '...KKKK..KKKK...', '....GG....GG....', '...PPP....PPP...', '...PPP....PPP...']
export const VILLAINS = {
  broly: {
    rows: BROLY,
    forms: [
      { sc: 0.46, aura: '#B8B8B8', beam: ['#FFFFFF', '#D8FFC8', '#7CFF5A', '#2E9E1E'], pal: { Y: '#1A1A1A', E: '#1A1A1A', S: '#E2A878', s: '#B87C50', W: '#F0F0F0', M: '#8A4A30', G: '#E8B83A', R: '#C8302A', K: '#1A1A1A' } },
      { sc: 0.53, aura: '#7CFF5A', beam: ['#FFFFFF', '#D8FFC8', '#7CFF5A', '#2E9E1E'], pal: { Y: '#C8F05A', E: '#F4F4F4', S: '#E8AE7E', s: '#B87C50', W: '#F0F0F0', M: '#8A4A30', G: '#E8B83A', R: '#C8302A', K: '#1A1A1A' } },
    ],
  },
  frieza: {
    rows: FRIEZA,
    forms: [
      { sc: 0.45, aura: '#C77DFF', beam: ['#FFFFFF', '#FFC8F0', '#D84CFF', '#7A1AA8'], pal: { P: '#8A3CC8', W: '#F4F4F4', R: '#D8202A' } },
      { sc: 0.47, aura: '#FFD84A', beam: ['#FFFFFF', '#FFF0B0', '#FFC83A', '#C88A10'], pal: { P: '#7A2AB8', W: '#F2C030', R: '#D8202A' } },
    ],
  },
  jiren: {
    rows: JIREN,
    forms: [
      { sc: 0.46, aura: '#FF8A7A', beam: ['#FFFFFF', '#FFC8C0', '#FF4A3A', '#A8160E'], pal: { S: '#C98872', E: '#141018', h: '#FFFFFF', M: '#7A3A30', K: '#141018', R: '#C8302A', W: '#E8E8E8' } },
      { sc: 0.5, aura: '#FF2A2A', beam: ['#FFFFFF', '#FFC8C0', '#FF4A3A', '#A8160E'], pal: { S: '#D2907A', E: '#FF2A2A', h: '#FFE0E0', M: '#7A3A30', K: '#141018', R: '#C8302A', W: '#E8E8E8' } },
    ],
  },
  beerus: {
    rows: BEERUS,
    forms: [
      { sc: 0.45, aura: '#C77DFF', beam: ['#FFFFFF', '#FFD8F8', '#C04CFF', '#5A1A8A'], pal: { P: '#9A84C0', Y: '#F2D23A', K: '#1A1A1A', G: '#E8B83A', B: '#3A8AD8', O: '#E8782A' } },
    ],
  },
}
const POWER_UP = 0.8
export const BEAMS = {
  kame: ['#FFFFFF', '#BFF3FF', '#4FC3FF', '#1E6FE8'],
  galick: ['#FFFFFF', '#F0C8FF', '#B44CFF', '#6A1AB8'],
  duo: ['#FFFFFF', '#D8E8FF', '#8F7CFF', '#4A2AC8'],
}
const V = 66

const dragonball = {
  name: 'dragonball',
  setup(L, S, opt) {
    this.mode = choose(opt, 'mode', () => pick(['solo', 'win', 'rescue', 'duo', 'win', 'rescue', 'spirit']))
    const d = this.dir = dirOf(opt)
    // who stars in a solo scene: Goku, or sometimes Vegeta or Piccolo
    const star = choose(opt, 'hero', () => { const r = Math.random(); return r < 0.3 ? 'vegeta' : r < 0.51 ? 'piccolo' : 'goku' })
    const clash = this.mode === 'win' || this.mode === 'rescue' || this.mode === 'duo'
    // in rescue / duo scenes Goku stands a little in, so Vegeta fits beside him
    const inset = this.mode === 'rescue' || this.mode === 'duo' ? 7.5 : 0.6
    this.fx = d > 0 ? inset : L.cols - inset - GW
    this.vegFx = d > 0 ? 0.4 : L.cols - 0.4 - GW
    this.vegeta = this.mode === 'solo' && star === 'vegeta'
    this.colors = BEAMS[this.vegeta ? 'galick' : 'kame']
    let form = choose(opt, 'form', () => (this.mode === 'solo' && Math.random() < 0.45 ? 'transform' : pick(['base', 'ssj1', 'ssj2', 'ui', 'ssj3', 'ssg'])))
    // the power-up sequence only plays in a solo scene
    if (form === 'transform' && this.mode !== 'solo') form = 'ssj2'
    this.forms = form === 'transform' ? [[0, 'base'], [0.55, 'ssj1'], [0.9, 'ssj2'], [1.25, pick(['ssj3', 'ssg'])]] : [[0, FORMS[form] ? form : 'base']]
    this.piccolo = this.mode === 'solo' && star === 'piccolo'
    if (this.piccolo) { this.forms = [[0, 'base']]; this.colors = ['#FFFFFF', '#FFF6A0', '#FFE45A', '#B8901A'] }
    this.helper = this.mode === 'rescue' ? choose(opt, 'helper', () => (Math.random() < 0.4 ? 'piccolo' : 'vegeta')) : 'vegeta'
    this.rocks = Array.from({ length: 8 }, () => ({ x: this.fx + GW / 2 + rand(-7, 7), y0: GROUND - rand(0.2, 0.8), rise: rand(2, 5), s: rand(0.4, 0.9) }))
    this.fire = 1.5
    this.hx = d > 0 ? this.fx + GW : this.fx
    this.hy = GROUND - GHt + 9.5 * SC
    this.sparks = []; this.motes = []; this.keys = null
    if (this.mode === 'spirit') {
      this.bx = L.cols / 2; this.by = PAD_T + 2.5; this.ti = 2.15
      let far = 0
      for (let i = 0; i < L.N; i++) {
        const dist = Math.hypot(L.X[i] + 0.5 - this.bx, (L.Y[i] + 0.5 - (PAD_T + 7)) * 1.4)
        far = Math.max(far, dist)
        S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]; S.DL[i] = this.ti + dist / 34; S.DU[i] = 0.45
      }
      return this.ti + far / 34 + 1.0
    }
    if (clash) {
      const foe = choose(opt, 'villain', () => pick(Object.keys(VILLAINS)))
      this.villain = VILLAINS[foe] || VILLAINS.broly
      const top = this.villain.forms[this.villain.forms.length - 1]
      const vw = 16 * top.sc, vh = 22 * top.sc
      this.vsc = top.sc
      this.vx = d > 0 ? L.cols - 0.6 - vw : 0.6
      this.vHand = d > 0 ? this.vx + 1 : this.vx + vw - 1
      this.vHandY = GROUND - vh + 11 * top.sc
      this.D = Math.abs(this.vHand - this.hx)
      this.sM = this.D * rand(0.42, 0.58)
      this.tMeet = this.fire + Math.max(this.sM, this.D - this.sM) / V
      // where the beams meet over time (distance from Goku's hands)
      const k = [[this.tMeet, this.sM]]
      if (this.mode === 'rescue') {
        this.tBack = this.tMeet + 0.45
        this.tVeg = this.tBack + 1.15
        k.push([this.tBack, this.sM], [this.tVeg, 7], [this.tVeg + 0.25, 6])
        this.tPush = this.tVeg + 0.35
        k.push([this.tPush, 6.5])
      } else {
        this.tPush = this.tMeet + (this.mode === 'duo' ? 0.6 : 1.0)
        k.push([this.tPush, this.sM])
      }
      const s0 = k[k.length - 1][1]
      this.tEngulf = this.tPush + (this.D - s0) / (this.mode === 'win' ? 45 : 60)
      k.push([this.tEngulf, this.D + 2])
      this.keys = k
      // each pixel lights up the first time Goku's beam reaches it
      for (let i = 0; i < L.N; i++) {
        const s = (L.X[i] + 0.5 - this.hx) * d
        S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]; S.DU[i] = 0.5
        let at = this.tEngulf
        for (let tt = this.fire; tt < this.tEngulf; tt += 0.01) if (this.heroFront(tt) >= s) { at = tt; break }
        S.DL[i] = s <= 0 ? this.fire : at
      }
      this.colors = this.mode === 'duo' ? BEAMS.duo : BEAMS.kame
      return this.tEngulf + 1.1
    }
    for (let i = 0; i < L.N; i++) {
      S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
      S.DL[i] = this.fire + Math.max(0, (L.X[i] + 0.5 - this.hx) * d) / V; S.DU[i] = 0.5
    }
    this.tEnd = this.fire + (L.cols + 6) / V
    return this.tEnd + 0.95
  },
  // the meeting point (distance from Goku's hands), easing between keys,
  // trembling while the beams grind
  meetAt(t) {
    const k = this.keys
    if (t <= k[0][0]) return k[0][1]
    for (let j = 0; j < k.length - 1; j++) {
      if (t < k[j + 1][0]) {
        const u = (t - k[j][0]) / (k[j + 1][0] - k[j][0])
        const wob = t < this.tPush ? Math.sin(t * 11) * 1.4 + Math.sin(t * 23) * 0.5 : 0
        return lerp(k[j][1], k[j + 1][1], j === k.length - 2 ? u * u : inOut(u)) + wob
      }
    }
    return k[k.length - 1][1]
  },
  heroFront(t) {
    if (t < this.fire) return 0
    if (t < this.tMeet) return Math.min(this.sM, (t - this.fire) * V)
    return this.meetAt(t)
  },
  formAt(t) { let f = this.forms[0][1]; for (const [at, name] of this.forms) if (t >= at) f = name; return f },
  ease: () => 1,
  colorAt(k, i, L, pal, tn) {
    const c = this.colors
    return k < 0.15 ? c[0] : k < 0.35 ? c[1] : k < 0.5 ? c[2] : finalColor(L, pal, i, tn)
  },
  overlay(args) {
    const { ctx, t, dt, total, L, box } = args
    const d = this.dir
    const fade = 1 - clamp01((t - (total - 0.45)) / 0.4)
    if (fade <= 0) return
    ctx.save()
    // the ground shakes while the beams grind
    if (this.keys && t > this.tMeet && t < this.tEngulf) ctx.translate(rand(-1, 1) * args.p * 0.12, rand(-1, 1) * args.p * 0.12)
    const form = this.formAt(t), look = FORMS[form]
    const charging = t > 0.3 && t < (this.mode === 'spirit' ? this.ti : this.fire)
    const pose = this.mode === 'spirit' ? 'up' : t > this.fire ? 'fire' : 'charge'
    const gy = GROUND - GHt
    // transformation bursts
    for (const [at] of this.forms.slice(1)) {
      if (t > at && t < at + 0.2) { const u = (t - at) / 0.2; ctx.globalAlpha = 0.7 * (1 - u) * fade; disc(ctx, box, this.fx + GW / 2, gy + GHt / 2, 2 + u * 7, look.aura) }
    }
    const appear = clamp01((t - 0.05) / 0.25)
    ctx.globalAlpha = fade * (appear < 1 ? (Math.floor(t * 30) % 2 ? appear : 0.2) : 1)
    const rows = this.piccolo ? PICCOLO[pose === 'fire' ? 'fire' : 'charge'] : hero(pose, this.vegeta ? 'vegeta' : form === 'base' ? 'goku' : 'ssj', look.long)
    const pal = this.piccolo ? PICCOLO_PAL : { ...(this.vegeta ? VEGETA_PAL : GOKU_PAL), H: look.H }
    if (charging || form !== 'base' || (this.keys && t < this.tEngulf)) this.aura(ctx, box, rows, look.aura, this.fx, gy, SC, d < 0, t, charging ? 1 : 0.55)
    drawSprite(ctx, box, rows, pal, this.fx, gy, SC, d < 0)
    ctx.globalAlpha = fade
    if (look.bolts && (charging || this.keys) && Math.floor(t * 14) % 3 === 0) this.bolt(ctx, box, this.fx + GW / 2 + rand(-3, 3), gy + rand(0, 6))
    if (look.sparkle && Math.random() < 0.6) this.sparks.push({ x: this.fx + rand(0, GW), y: gy + rand(0, GHt), vy: -rand(1, 3), life: 0, max: 0.5, size: 0.25, color: '#D9E4FF' })
    // Vegeta: beside Goku from the start (duo) or teleporting in (rescue)
    const vegOn = this.mode === 'duo' || (this.mode === 'rescue' && t > this.tVeg - 0.3)
    if (vegOn) {
      const firing = t > (this.mode === 'duo' ? this.fire : this.tVeg)
      const isPic = this.mode === 'rescue' && this.helper === 'piccolo'
      const vRows = isPic ? PICCOLO[firing ? 'fire' : 'charge'] : hero(firing ? 'fire' : 'charge', 'vegeta', false)
      const vPal = isPic ? PICCOLO_PAL : { ...VEGETA_PAL, H: '#F8E048' }
      const flick = this.mode === 'rescue' && t < this.tVeg ? (Math.floor(t * 30) % 2 ? 0.3 : 0.9) : 1
      ctx.globalAlpha = fade * flick
      this.aura(ctx, box, vRows, isPic ? '#E8FFD8' : '#FFE45A', this.vegFx, gy, SC, d < 0, t, 0.8)
      drawSprite(ctx, box, vRows, vPal, this.vegFx, gy, SC, d < 0)
      ctx.globalAlpha = fade
      if (this.mode === 'rescue' && t > this.tVeg - 0.3 && t < this.tVeg + 0.6) {
        const cry = isPic ? 'SPECIAL BEAM CANNON!' : 'GALICK GUN!'
        drawText(ctx, box, cry, Math.max(0.5, Math.min(L.cols - textWidth(cry, 0.3) - 0.5, this.vegFx - 2)), gy - 3.6, 0.3, '#FFFFFF', isPic ? '#2E7D1E' : '#6A1AB8')
      }
    }
    this.drawRocks(ctx, box, t)
    for (let j = this.sparks.length - 1; j >= 0; j--) {
      const q = this.sparks[j]; q.life += dt; q.y += (q.vy || 0) * dt; q.x += (q.vx || 0) * dt
      if (q.life > q.max) { this.sparks.splice(j, 1); continue }
      ctx.globalAlpha = fade * (1 - q.life / q.max); ctx.fillStyle = q.color; box(q.x, q.y, q.size, q.size)
    }
    ctx.globalAlpha = fade
    if (this.mode === 'spirit') { this.spirit(args, fade); ctx.restore(); return }
    // the chant
    const chant = this.piccolo ? ['SPECIAL', 'BEAM', 'CANNON!'] : this.vegeta ? ['GA', 'LICK', 'GUN!'] : ['KA', 'ME', 'HA', 'ME', 'HA!']
    if (t > 0.3 && t < this.fire + 0.35) {
      const n = Math.min(chant.length, 1 + Math.floor(((t - 0.3) / (this.fire - 0.3)) * chant.length))
      const text = chant.slice(0, n).join(' ')
      const tx = d > 0 ? this.fx : this.fx + GW - textWidth(text, 0.32)
      drawText(ctx, box, text, Math.max(0.5, Math.min(L.cols - textWidth(text, 0.32) - 0.5, tx)), gy - 2.2, 0.32, '#FFFFFF', this.colors[3])
    }
    // energy cupped at his side, swelling, motes rushing in
    if (this.piccolo && t > 0.3 && t < this.fire) {
      // sparks crackling at his fingertips, held to his brow
      const fxp = d > 0 ? this.fx + GW - 0.3 : this.fx + 0.3, fyp = gy + 3.5 * SC
      ctx.fillStyle = '#FFF27A'
      for (let k = 0; k < 3; k++) box(fxp + rand(-1.2, 1.2), fyp + rand(-1.2, 1.2), 0.3, 0.3)
      disc(ctx, box, fxp, fyp, 0.4 + Math.sin(t * 30) * 0.15, '#FFFFFF', 0.25)
    } else if (t > 0.3 && t < this.fire) {
      const u = (t - 0.3) / (this.fire - 0.3)
      const bx = d > 0 ? this.fx + 0.4 : this.fx + GW - 0.4
      ctx.globalAlpha = fade * 0.5; disc(ctx, box, bx, this.hy, 0.6 + u * 1.4 + Math.sin(t * 30) * 0.1, this.colors[2])
      ctx.globalAlpha = fade; disc(ctx, box, bx, this.hy, 0.3 + u * 0.9, this.colors[0])
      if (Math.random() < 0.5) { const a = rand(0, Math.PI * 2); this.sparks.push({ x: bx + Math.cos(a) * 3, y: this.hy + Math.sin(a) * 2, vx: -Math.cos(a) * 8, vy: -Math.sin(a) * 6, life: 0, max: 0.3, size: 0.25, color: this.colors[1] }) }
    }
    if (this.keys) this.clash(args, fade)
    else if (t >= this.fire) {
      const head = this.hx + d * Math.min(L.cols + 8, V * (t - this.fire))
      const thin = 1 - clamp01((t - this.tEnd) / 0.45)
      if (thin > 0) {
        if (this.piccolo) this.cannon(ctx, box, this.hx, head, GROUND - GHt + 8.5 * SC, t, d, fade * thin, t < this.tEnd)
        else this.beam(ctx, box, this.hx, head, this.hy, this.colors, thin * Math.min(1, (t - this.fire) / 0.12), t < this.tEnd, fade, t, d)
      }
    }
    ctx.restore()
  },
  aura(ctx, box, rows, color, x, y, sc, flip, t, strength) {
    const auraPal = {}
    for (const r of rows) for (const ch of r) if (ch !== '.') auraPal[ch] = color
    const j = 0.25 + (hash(Math.floor(t * 20), 1, 1) / 1000) * 0.3
    const base = ctx.globalAlpha
    ctx.globalAlpha = base * 0.4 * strength
    for (const [ox, oy] of [[-j, 0], [j, 0], [0, -j], [0, j], [0, -j * 2.2]]) drawSprite(ctx, box, rows, auraPal, x + ox, y + oy, sc, flip)
    ctx.globalAlpha = base
  },
  bolt(ctx, box, x, y) {
    ctx.fillStyle = '#E8FBFF'
    let cx = x, cy = y
    for (let k = 0; k < 5; k++) { box(cx, cy, 0.25, 0.6); cx += rand(-0.6, 0.6); cy += 0.55 }
  },
  drawRocks(ctx, box, t) {
    const blowAt = this.mode === 'spirit' ? this.ti : this.fire
    for (const r of this.rocks) {
      const u = clamp01((t - 0.3) / (blowAt - 0.3))
      let x = r.x, y = r.y0 - r.rise * u + Math.sin(t * 5 + r.x) * 0.15 * u
      if (t > blowAt) { const v = t - blowAt; x += (r.x - (this.fx + GW / 2)) * v * 6; y -= v * 4 }
      ctx.fillStyle = '#8A7A6A'; box(x, y, r.s, r.s * 0.8)
      ctx.fillStyle = '#5E5246'; box(x, y + r.s * 0.5, r.s, r.s * 0.3)
    }
  },
  // a beam: layered glow with wavy edges, energy bands flowing along it,
  // and a pulsing head
  beam(ctx, box, x0, x1, y, c, thin, withHead, fade, t, dir) {
    const a = Math.min(x0, x1), b = Math.max(x0, x1)
    const base = 3.2 * thin
    for (let x = a; x < b; x += 1) {
      const w = Math.min(1, b - x)
      const wave = Math.sin(x * 0.9 - t * 30 * dir) * 0.3 + Math.sin(x * 0.37 + t * 9) * 0.2
      const th = base + wave * thin
      const band = ((x * dir - t * 34) % 6 + 6) % 6 < 1.4
      for (const [h, col, al] of [[th + 1.3, c[3], 0.4], [th, c[2], 1], [th * 0.62, band ? c[0] : c[1], 1], [th * 0.28, c[0], 1]]) {
        ctx.globalAlpha = fade * al; ctx.fillStyle = col; box(x, y - h / 2, w, h)
      }
    }
    if (withHead) {
      const pulse = 1 + Math.sin(t * 40) * 0.08
      ctx.globalAlpha = fade * 0.45; disc(ctx, box, x1, y, 3 * thin * pulse, c[3])
      ctx.globalAlpha = fade; disc(ctx, box, x1, y, 2.2 * thin * pulse, c[2]); disc(ctx, box, x1, y, 1.3 * thin, c[0])
    }
    ctx.globalAlpha = fade
  },
  // the Special Beam Cannon: a thin piercing ray wrapped in a spiral
  cannon(ctx, box, x0, x1, y, t, dir, alpha, withHead) {
    const a = Math.min(x0, x1), b = Math.max(x0, x1)
    ctx.globalAlpha = alpha * 0.5; ctx.fillStyle = '#FFE45A'; box(a, y - 0.7, b - a, 1.4)
    ctx.globalAlpha = alpha; ctx.fillStyle = '#FFFFFF'; box(a, y - 0.3, b - a, 0.6)
    ctx.fillStyle = '#FFF6A0'
    for (let x = a; x < b; x += 0.35) box(x, y + Math.sin((x - x0) * 1.1 * dir - t * 28) * 1.5 - 0.17, 0.35, 0.35)
    if (withHead) { disc(ctx, box, x1, y, 1.1 + Math.sin(t * 40) * 0.2, '#FFF6A0'); disc(ctx, box, x1, y, 0.6, '#FFFFFF') }
    ctx.globalAlpha = alpha
  },
  clash({ ctx, t, p, px, py, box }, fade) {
    const d = this.dir
    const powered = this.villain.forms.length > 1 && t > POWER_UP
    const vl = { rows: this.villain.rows, ...this.villain.forms[powered ? 1 : 0] }
    const vw = 16 * vl.sc, vh = 22 * vl.sc
    const vx = d > 0 ? this.vx + 16 * this.vsc - vw : this.vx
    const engulfed = t > this.tEngulf
    // the villain powers up mid-charge: a burst in the new aura
    if (this.villain.forms.length > 1 && t > POWER_UP && t < POWER_UP + 0.25) {
      const u = (t - POWER_UP) / 0.25
      ctx.globalAlpha = 0.7 * (1 - u) * fade; disc(ctx, box, vx + vw / 2, GROUND - vh / 2, 2 + u * 8, vl.aura); ctx.globalAlpha = fade
    }
    if (!engulfed || t < this.tEngulf + 0.15) {
      const white = engulfed && Math.floor(t * 30) % 2 === 0
      this.aura(ctx, box, vl.rows, vl.aura, vx, GROUND - vh, vl.sc, d > 0, t, t > 0.3 ? (powered ? 1.2 : 0.8) : 0.4)
      drawSprite(ctx, box, vl.rows, white ? Object.fromEntries(Object.keys(vl.pal).map((k) => [k, '#FFFFFF'])) : vl.pal, vx, GROUND - vh, vl.sc, d > 0)
    } else if (t < this.tEngulf + 0.9) {
      const u = (t - this.tEngulf) / 0.9
      ring(ctx, px, py, p, this.vHand + d * 3, this.vHandY, 1 + u * 12, vl.beam[1], 0.5, (1 - u) * fade)
      ring(ctx, px, py, p, this.vHand + d * 3, this.vHandY, u * 7, '#FFFFFF', 0.3, (1 - u) * fade)
      ctx.globalAlpha = fade
    }
    if (t < this.fire) return
    const thin = 1 - clamp01((t - this.tEngulf - 0.1) / 0.45)
    if (thin <= 0) return
    const meetX = this.hx + d * this.heroFront(t)
    const grow = Math.min(1, (t - this.fire) / 0.12)
    // after Vegeta joins (or from the start in a duo) the beam is two-toned and fatter
    const combined = this.mode === 'duo' || (this.mode === 'rescue' && t > this.tVeg)
    const hc = combined ? BEAMS.duo : this.colors
    this.beam(ctx, box, this.hx, meetX, this.hy, hc, thin * grow * (combined ? 1.35 : 1), t < this.tMeet, fade, t, d)
    if (combined) {
      const vh2 = d > 0 ? this.vegFx + GW : this.vegFx
      if (this.mode === 'rescue' && this.helper === 'piccolo') this.cannon(ctx, box, vh2, this.hx + d * 0.5, this.hy, t, d, fade, false)
      else this.beam(ctx, box, vh2, this.hx + d * 0.5, this.hy, BEAMS.galick, thin * 0.9, false, fade, t, d)
    }
    if (!engulfed) {
      const vFront = t < this.tMeet ? lerp(this.vHand, this.hx + d * this.sM, Math.min(1, (t - this.fire) * V / Math.abs(this.D - this.sM))) : meetX
      this.beam(ctx, box, this.vHand, vFront, this.vHandY, vl.beam, grow, t < this.tMeet, fade, t, -d)
    }
    if (t >= this.tMeet && !engulfed) {
      const my = (this.hy + this.vHandY) / 2
      const r = 2.8 + Math.sin(t * 40) * 0.45
      ctx.globalAlpha = fade * 0.6; disc(ctx, box, meetX, my, r + 1.2, vl.beam[2])
      ctx.globalAlpha = fade; disc(ctx, box, meetX, my, r, hc[1]); disc(ctx, box, meetX, my, r * 0.5, '#FFFFFF')
      for (let n = 0; n < 3; n++) this.sparks.push({ x: meetX, y: my, vx: rand(-4, 4), vy: rand(-9, 9), life: 0, max: 0.3, size: 0.35, color: pick([hc[1], vl.beam[1], '#FFFFFF']) })
    }
    ctx.globalAlpha = 1
  },
  spirit({ ctx, t, dt, p, px, py, box }, fade) {
    const c = this.colors
    const grow = clamp01((t - 0.4) / 1.3), drop = clamp01((t - 1.75) / (this.ti - 1.75))
    const r = 0.5 + grow * 3.6, y = lerp(this.by, PAD_T + 7, drop * drop)
    if (t < this.ti) {
      if (t > 0.4 && t < 1.75 && Math.random() < 0.9) { const a = rand(0, Math.PI * 2); this.motes.push({ x: this.bx + Math.cos(a) * 30, y: this.by + Math.sin(a) * 12, life: 0 }) }
      for (let j = this.motes.length - 1; j >= 0; j--) {
        const m = this.motes[j]; m.life += dt
        m.x = follow(m.x, this.bx, 4, dt); m.y = follow(m.y, this.by, 4, dt)
        if (m.life > 0.8) { this.motes.splice(j, 1); continue }
        ctx.fillStyle = '#BFF3FF'; box(m.x - 0.2, m.y - 0.2, 0.4, 0.4)
      }
      ctx.globalAlpha = fade * 0.45; disc(ctx, box, this.bx, y, r + 0.9, c[2])
      ctx.globalAlpha = fade; disc(ctx, box, this.bx, y, r, c[1]); disc(ctx, box, this.bx - r * 0.2, y - r * 0.2, r * 0.55, c[0])
    } else {
      const u = (t - this.ti) / 0.9
      if (u < 1) ring(ctx, px, py, p, this.bx, PAD_T + 7, u * 45, c[1], 0.5, (1 - u) * fade)
      if (t - this.ti < 0.25) { ctx.globalAlpha = 0.6 * (1 - (t - this.ti) / 0.25) * fade; disc(ctx, box, this.bx, PAD_T + 7, 4 + (t - this.ti) * 30, '#FFFFFF') }
    }
    ctx.globalAlpha = 1
  },
}

export default dragonball
