// Pixel wordmark build: Star Wars. A starfield and "A LONG TIME AGO IN A
// GALAXY FAR, FAR AWAY....", then one of three scenes:
//   duel      a lightsaber duel choreographed like the films: sabers ignite,
//             every exchange has a wind-up, a fast strike and a recoil, with
//             spins and leaps; the blades leave motion trails and the arms
//             follow them. Each clash, sparks flying, blazes a letter in.
//             A Force push sends the Sith spinning off into the dark.
//   space     X-wings and TIE fighters dogfight in front of a Star
//             Destroyer; X-wing lasers blast the letters in, a TIE explodes
//   blasters  a smuggler behind a crate against stormtroopers: their famously
//             bad aim keeps hitting the letters, and he drops them one by one

import { GROUND, SCENE_TOP, PAD_T, hash, clamp01, lerp, inOut, outCubic, inQuad, rand, pick, letterMid, mainLetters, hostOf, pixelsByLetter, disc, drawSprite, drawSpriteRot, drawTextCentered, stepParticles, stroke, ring, finalColor, choose, dirOf } from '../engine/kit'

// ── characters (12×20, facing right, arms drawn separately) ───────────────
export const JEDI = ['....HHHH....', '...HHHHHH...', '...HHSSSS...', '...HSSSES...', '...HSSSSS...', '....BBBBS...', '.....BBB....', '...RRTTTRR..',
  '..RRTTTTTRR.', '..RRTTTTTRR.', '..RRTTTTTRR.', '..RRKKKKKRR.', '..RRTTTTTRR.', '..RRTTTTTRR.', '..RRTT.TTRR.', '..RRTT.TTRR.',
  '...RTT.TTR..', '....TT.TT...', '....KK.KK...', '...KKK.KKK..']
export const JEDI_PAL = { H: '#B07A44', S: '#F0C496', E: '#2A1A10', B: '#C89058', R: '#6B4A2E', T: '#D8C6A0', K: '#3A2A1E' }
export const SITH = ['....KKKK....', '...KKKKKK...', '..KKKKKKKK..', '..KKGKKGKK..', '..KKKGGKKK..', '..KKGGGGKK..', '.KKKKKKKKKK.', '..CCKKKKCC..',
  '.CCKRBGKKCC.', '.CCKKKKKKCC.', '.CCKKKKKKCC.', '.CCKSSSSKCC.', '.CCKKKKKKCC.', 'CCCKKKKKKCCC', 'CCCKK..KKCCC', 'CCCKK..KKCCC',
  'CCCKK..KKCCC', 'CC.KK..KK.CC', '...KK..KK...', '..KKK..KKK..']
export const SITH_PAL = { K: '#111114', C: '#24242E', G: '#6A6A76', S: '#A8A8B4', R: '#E02020', B: '#2A7FFF' }
const HAN = ['....HHHH....', '...HHHHHH...', '...HSSSSS...', '...SSSSES...', '....SSSS....', '...WVVWWVV..', '..WWVVWWVVW.', '..WWVVWWVVW.',
  '..SWVVWWVVW.', '..SWVVWWVV..', '...KKBKKKK..', '...PPPPPPP..', '...PPR.PPR..', '...PPR.PPR..', '...PPR.PPR..', '...PPR.PPR..',
  '...PPR.PPR..', '...KKK.KKK..', '..KKKK.KKKK.', '............']
const HAN_PAL = { H: '#5A3A1E', S: '#F0C496', E: '#2A1A10', W: '#F2F2EE', V: '#1E1E1E', K: '#2A2A2A', B: '#C8B060', P: '#2A3450', R: '#C8302A' }
const TROOPER = ['....WWWW....', '...WWWWWW...', '...WKKWWKK..', '...WWWWWWW..', '...WKWKWK...', '....WWWW....', '..WWWKKWWW..', '.WWWWWWWWWW.',
  '.WKWWKKWWKW.', '.WW.WWWW.WW.', '.WW.KKKK.WW.', '....WWWW....', '....WWWW....', '...WWW.WWW..', '...WWW.WWW..', '...WKW.WKW..',
  '...WWW.WWW..', '...WWW.WWW..', '..KKKK.KKKK.', '............']
const TROOPER_PAL = { W: '#F2F2F2', K: '#1A1A1A' }
export const XWING = ['..R.............', '.WWWW...........', '..WWWWWWWWWWWR..', 'GWWWWWWWWWWWWWWW', '..WWWWWWWWWWWR..', '.WWWW...........', '..R.............']
export const XWING_PAL = { W: '#D8D8D8', R: '#D82020', G: '#7A7A7A' }
export const TIE = ['K.......K', 'K.......K', 'K..GGG..K', 'KKGgggGKK', 'K.GgBgG.K', 'KKGgggGKK', 'K..GGG..K', 'K.......K', 'K.......K']
export const TIE_PAL = { K: '#3A3A46', G: '#9A9AA8', g: '#6A6A78', B: '#14141E' }
export const BLADES = { blue: '#4FA8FF', green: '#5CFF6A', purple: '#B45CFF' }
const RED = '#FF2A2A'
const SC = 0.5, FW = 12 * SC, FH = 20 * SC
const INTRO = 'A LONG TIME AGO IN A GALAXY FAR, FAR AWAY....'
const DUEL0 = 1.35, GAP = 0.45

const starwars = {
  name: 'starwars',
  setup(L, S, V) {
    this.V = V
    this.scene = choose(V, 'scene', () => pick(['duel', 'duel', 'space', 'blasters']))
    this.dir = dirOf(V)
    this.stars = Array.from({ length: 60 }, () => [rand(0, L.cols), rand(SCENE_TOP, L.rows), rand(0, 6)])
    this.sparks = []; this.sparked = new Set()
    if (this.scene === 'space') return this.setupSpace(L, S)
    if (this.scene === 'blasters') return this.setupBlasters(L, S)
    return this.setupDuel(L, S)
  },

  // ── duel ────────────────────────────────────────────────────────────────
  setupDuel(L, S) {
    const d = this.dir
    this.blade = BLADES[choose(this.V, 'blade', () => pick(Object.keys(BLADES)))] || BLADES.blue
    this.double = choose(this.V, 'doubleBlade', () => Math.random() < 0.3)
    const order = mainLetters(L).sort((a, b) => (letterMid(L, a) - letterMid(L, b)) * d)
    const heights = { high: GROUND - 9.2, mid: GROUND - 7.2, low: GROUND - 5.2 }
    this.clashes = order.map((ci, k) => ({
      ci, t: DUEL0 + 0.55 + k * GAP, x: letterMid(L, ci),
      y: heights[pick(['high', 'high', 'mid', 'mid', 'low'])],
      move: k > 0 && Math.random() < 0.22 ? 'spin' : k > 0 && Math.random() < 0.2 ? 'leap' : 'swing',
    }))
    const last = this.clashes[this.clashes.length - 1]
    this.tPush = last.t + 0.45
    this.trail = { J: [], S: [] }
    for (let i = 0; i < L.N; i++) {
      const c = this.clashes.find((q) => q.ci === hostOf(L, L.CI[i]))
      S.SX[i] = c.x - 0.5; S.SY[i] = c.y
      S.DL[i] = c.t + (hash(i, 6, 6) / 1000) * 0.06; S.DU[i] = 0.45
    }
    return this.tPush + 1.25
  },
  // the pair's centre line as they move from clash to clash
  centreAt(t) {
    const cs = this.clashes
    if (t <= cs[0].t - 0.3) return cs[0].x
    for (let k = 0; k < cs.length - 1; k++) {
      if (t < cs[k + 1].t - 0.3) return lerp(cs[k].x, cs[k + 1].x, inOut(clamp01((t - cs[k].t - 0.05) / (GAP - 0.35))))
    }
    return cs[cs.length - 1].x
  },
  // a fighter's blade angle: guard → wind-up → strike → recoil, per clash
  angleAt(who, t, shoulder) {
    const d = this.dir, face = who === 'J' ? d : -d
    const guard = Math.atan2(-1.25, face)
    let a = guard, lift = 0, spin = 0
    for (const c of this.clashes) {
      const T0 = c.t - 0.3, T1 = c.t - 0.09, T3 = c.t + 0.15
      if (t < T0 || t > T3) continue
      const hit = Math.atan2(c.y - shoulder[1], c.x - shoulder[0])
      const attacker = who === 'J'
      const wind = attacker ? hit - face * 2.1 : hit + face * 0.7
      if (t < T1) {
        const u = inOut((t - T0) / (T1 - T0))
        a = lerp(guard, wind, u)
        if (attacker && c.move === 'spin') spin = -face * u * Math.PI * 2
      } else if (t < c.t) a = lerp(wind, hit, inQuad((t - T1) / (c.t - T1)))
      else a = lerp(hit, guard, outCubic((t - c.t) / (T3 - c.t)))
      if (attacker && c.move === 'leap' && t < c.t + 0.05) lift = Math.sin(clamp01((t - T0) / (c.t + 0.05 - T0)) * Math.PI) * 2.8
    }
    return { a: a + spin, lift }
  },

  // ── space ───────────────────────────────────────────────────────────────
  setupSpace(L, S) {
    const d = this.dir
    this.xwings = [0, 1, 2].map((k) => ({ x0: (d > 0 ? -18 : L.cols + 10) - d * k * 9, y: PAD_T + 1 + k * 4.2, ph: rand(0, 6) }))
    this.ties = [0, 1].map((k) => ({ x0: (d > 0 ? L.cols + 6 : -10) + d * k * 12, y: PAD_T + 2.5 + k * 5, ph: rand(0, 6) }))
    this.vx = 24; this.vt = 26
    // impact points: three per letter; every pixel belongs to its nearest
    const groups = pixelsByLetter(L)
    const impacts = []
    for (const ci of mainLetters(L)) {
      const mine = groups[ci].concat(...L.CX0.map((_, cj) => (cj !== ci && hostOf(L, cj) === ci ? groups[cj] : [])))
      for (const f of [0.2, 0.5, 0.8]) {
        const i = mine.slice().sort((a, b) => L.Y[a] - L.Y[b])[Math.floor(f * (mine.length - 1))]
        impacts.push({ x: L.X[i] + 0.5, y: L.Y[i] + 0.5 })
      }
    }
    impacts.sort((a, b) => (a.x - b.x) * d)
    this.shots = impacts.map((imp, k) => {
      const ship = this.xwings[k % 3]
      // fire from a little behind the target
      const fireX = imp.x - d * rand(10, 22)
      // ...but never before the ships are on screen
      const tf = Math.max(1.1 + (k % 3) * 0.12, ((fireX - ship.x0) * d) / this.vx)
      const sx = ship.x0 + d * this.vx * tf + (d > 0 ? 8 : 0), sy = ship.y + Math.sin(tf * 3 + ship.ph) * 0.8 + 1.7
      const dist = Math.hypot(imp.x - sx, imp.y - sy)
      return { ...imp, tf, sx, sy, hit: tf + dist / 95 }
    })
    for (let i = 0; i < L.N; i++) {
      let best = this.shots[0], bd = Infinity
      for (const s of this.shots) { const dd = (s.x - L.X[i]) ** 2 + (s.y - L.Y[i]) ** 2; if (dd < bd) { bd = dd; best = s } }
      S.SX[i] = best.x - 0.5; S.SY[i] = best.y - 0.5
      S.DL[i] = best.hit + (hash(i, 5, 5) / 1000) * 0.06; S.DU[i] = 0.4
    }
    this.boomAt = rand(1.4, 2.2); this.boomTie = 1
    this.end = Math.max(...this.shots.map((s) => s.hit)) + 0.4
    return this.end + 1.0
  },

  // ── blasters ────────────────────────────────────────────────────────────
  setupBlasters(L, S) {
    const d = this.dir
    this.hanX = d > 0 ? 1 : L.cols - 1 - FW
    this.troopers = [0, 1, 2].map((k) => ({ x: d > 0 ? L.cols - 2 - FW - k * 7.5 : 2 + k * 7.5, down: 0 }))
    const groups = pixelsByLetter(L)
    const impacts = []
    for (const ci of mainLetters(L)) {
      const mine = groups[ci].concat(...L.CX0.map((_, cj) => (cj !== ci && hostOf(L, cj) === ci ? groups[cj] : [])))
      for (const f of [0.25, 0.75]) {
        const i = mine.slice().sort((a, b) => L.Y[a] - L.Y[b])[Math.floor(f * (mine.length - 1))]
        impacts.push({ x: L.X[i] + 0.5, y: L.Y[i] + 0.5 })
      }
    }
    // stormtroopers miss Han and hit the letters; Han answers in between
    this.bolts = impacts.sort(() => Math.random() - 0.5).map((imp, k) => {
      const tr = this.troopers[k % 3]
      const tf = 1.4 + k * 0.17
      const sx = tr.x + (d > 0 ? 0 : FW), sy = GROUND - FH + 7.5 * SC
      return { ...imp, tf, sx, sy, hit: tf + Math.hypot(imp.x - sx, imp.y - sy) / 70, from: 'trooper' }
    })
    const lastHit = Math.max(...this.bolts.map((b) => b.hit))
    this.hanShots = this.troopers.map((tr, k) => {
      const tf = 1.6 + ((lastHit - 1.4) * (k + 1)) / 3.2
      const tx = tr.x + FW / 2
      return { tr, tf, hit: tf + Math.abs(tx - (this.hanX + FW / 2)) / 70 }
    })
    for (let i = 0; i < L.N; i++) {
      let best = this.bolts[0], bd = Infinity
      for (const b of this.bolts) { const dd = (b.x - L.X[i]) ** 2 + (b.y - L.Y[i]) ** 2; if (dd < bd) { bd = dd; best = b } }
      S.SX[i] = best.x - 0.5; S.SY[i] = best.y - 0.5
      S.DL[i] = best.hit + (hash(i, 5, 5) / 1000) * 0.06; S.DU[i] = 0.4
    }
    this.end = Math.max(lastHit, ...this.hanShots.map((h) => h.hit)) + 0.5
    return this.end + 0.9
  },

  ease: (k) => 1 - (1 - k) ** 3,
  colorAt(k, i, L, pal, tn) {
    const c = this.scene === 'duel' ? this.blade : this.scene === 'space' ? '#FF5A4A' : '#FF6A50'
    return k < 0.2 ? '#FFFFFF' : k < 0.45 ? c : finalColor(L, pal, i, tn)
  },
  underlay({ ctx, t, total, L, box }) {
    const a = clamp01(t / 0.3) * (1 - clamp01((t - (total - 0.6)) / 0.5))
    if (a <= 0) return
    ctx.globalAlpha = a
    ctx.fillStyle = '#04050C'; box(0, SCENE_TOP, L.cols, L.rows - SCENE_TOP)
    for (const [x, y, ph] of this.stars) {
      const sx = this.scene === 'space' ? ((x - t * 3 * this.dir) % L.cols + L.cols) % L.cols : x
      ctx.globalAlpha = a * (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + ph)))
      ctx.fillStyle = '#FFFFFF'; box(sx, y, 0.22, 0.22)
    }
    ctx.globalAlpha = a
    if (this.scene === 'space') {
      // a Star Destroyer looming at the edge
      const sx = this.dir > 0 ? L.cols - 26 : 0, w = 26
      for (let r = 0; r < 7; r++) {
        const rw = w * (1 - r / 8)
        ctx.fillStyle = r % 2 ? '#5A5A66' : '#6E6E7A'
        box(this.dir > 0 ? sx + w - rw : sx, SCENE_TOP + 0.3 + r * 0.7, rw, 0.7)
      }
      ctx.fillStyle = '#8A8A96'; box(this.dir > 0 ? sx + w - 6 : sx + 2, SCENE_TOP, 4, 0.6)
    }
    if (this.scene === 'blasters') {
      // the smuggler's crate
      const cx = this.dir > 0 ? this.hanX + FW - 1.5 : this.hanX - 2.5
      ctx.fillStyle = '#6B5A42'; box(cx, GROUND - 4.2, 4, 4.2)
      ctx.fillStyle = '#4A3E2E'; box(cx, GROUND - 4.2, 4, 0.3); box(cx, GROUND - 2.2, 4, 0.2); box(cx + 1.9, GROUND - 4.2, 0.2, 4.2)
    }
    if (t < 1.25) {
      ctx.globalAlpha = a * clamp01((t - 0.1) / 0.2) * (1 - clamp01((t - 1.0) / 0.25))
      drawTextCentered(ctx, box, INTRO, L.cols / 2, PAD_T + 5, Math.min(0.32, (L.cols - 4) / (INTRO.length * 4)), '#4BD5EE')
    }
    ctx.globalAlpha = 1
  },
  overlay(args) {
    if (this.scene === 'space') return this.overlaySpace(args)
    if (this.scene === 'blasters') return this.overlayBlasters(args)
    return this.overlayDuel(args)
  },

  overlayDuel({ ctx, t, dt, total, L, p, px, py, box }) {
    const d = this.dir
    const fade = 1 - clamp01((t - (total - 0.45)) / 0.4)
    if (fade <= 0 || t < 1.0) return
    const enter = clamp01((t - 1.0) / 0.3)
    ctx.globalAlpha = fade * enter
    const cx = this.centreAt(t)
    const step = Math.abs(Math.sin(t * 7)) * 0.2
    const jx = cx - d * 3.8, sx0 = cx + d * 3.8
    const pushed = t > this.tPush + 0.15
    const pu = clamp01((t - this.tPush - 0.15) / 0.9)
    const sx = sx0 + (pushed ? d * pu * pu * 40 : 0), sy = GROUND - FH - (pushed ? pu * 6 : 0)
    // blades ignite at the start and retract at the end
    const len = 5 * clamp01((t - DUEL0) / 0.25) * (1 - clamp01((t - (total - 0.7)) / 0.25))
    // the Jedi
    const jShoulder = [jx + d * 0.9, GROUND - FH + 7.4 * SC]
    const J = this.angleAt('J', t, jShoulder)
    const jy = GROUND - FH - J.lift
    const spinning = this.clashes.some((c) => c.move === 'spin' && t > c.t - 0.3 && t < c.t - 0.09)
    drawSprite(ctx, box, JEDI, JEDI_PAL, jx - FW / 2, jy - step, SC, (spinning && Math.floor(t * 20) % 2 ? d > 0 : d < 0))
    const jsh = [jShoulder[0], jShoulder[1] - J.lift - step]
    if (t < this.tPush || len > 0) this.arm(ctx, px, py, p, jsh, J.a, JEDI_PAL.T, fade * enter)
    // the Sith
    if (pushed) drawSpriteRot(ctx, px, py, p, SITH, SITH_PAL, sx + FW / 2 * 0, sy + FH / 2, SC, d * pu * 9)
    else drawSprite(ctx, box, SITH, SITH_PAL, sx - FW / 2, sy - step, SC, d > 0)
    const sShoulder = [sx - d * 0.9, sy + 7.4 * SC - step]
    const Sa = this.angleAt('S', t, sShoulder)
    const jHand = this.hand(jsh, J.a), sHand = this.hand(sShoulder, Sa.a)
    if (!pushed) this.arm(ctx, px, py, p, sShoulder, Sa.a, SITH_PAL.C, fade * enter)
    if (t > DUEL0) {
      if (t < this.tPush) {
        this.saber(ctx, px, py, p, 'J', jHand, J.a, len, this.blade, fade * enter)
        if (!pushed) {
          this.saber(ctx, px, py, p, 'S', sHand, Sa.a, len, RED, fade * enter)
          if (this.double) this.saber(ctx, px, py, p, 'S2', sHand, Sa.a + Math.PI, len * 0.9, RED, fade * enter)
        }
      } else {
        // the Force push: saber held back, palm out, waves rippling
        const u = clamp01((t - this.tPush) / 0.6)
        this.saber(ctx, px, py, p, 'J', jHand, Math.atan2(-1.6, -d * 0.6), len, this.blade, fade)
        stroke(ctx, px, py, p, jsh[0], jsh[1], jsh[0] + d * 2.4, jsh[1] + 0.2, JEDI_PAL.T, 0.55, fade)
        ctx.fillStyle = JEDI_PAL.S; box(jsh[0] + d * 2.4 - 0.3, jsh[1] - 0.1, 0.6, 0.6)
        for (let k = 0; k < 3; k++) ring(ctx, px, py, p, jsh[0] + d * 2.6, jsh[1], (u + k * 0.25) * 9, '#BFE6FF', 0.2, (1 - u) * 0.7 * fade)
        if (!pushed) this.saber(ctx, px, py, p, 'S', sHand, -Math.PI / 2 - d * 0.3, len, RED, fade)
      }
    }
    // clashes: sparks and a flash where the blades meet
    for (const c of this.clashes) {
      if (t < c.t || this.sparked.has(c)) continue
      this.sparked.add(c)
      for (let n = 0; n < 18; n++) this.sparks.push({ x: c.x, y: c.y, vx: rand(-13, 13), vy: rand(-13, 6), life: 0, max: rand(0.2, 0.45), size: rand(0.25, 0.55), color: pick(['#FFFFFF', '#FFF6C0', this.blade, RED]), g: 18 })
    }
    for (const c of this.clashes) if (t > c.t && t < c.t + 0.08) { ctx.globalAlpha = fade * 0.85 * (1 - (t - c.t) / 0.08); disc(ctx, box, c.x, c.y, 1.8, '#FFFFFF') }
    stepParticles(this.sparks, dt, ctx, box)
    ctx.globalAlpha = 1
  },
  hand(sh, a) { return [sh[0] + Math.cos(a) * 1.3, sh[1] + Math.sin(a) * 1.3] },
  arm(ctx, px, py, p, sh, a, color, alpha) {
    const h = this.hand(sh, a)
    stroke(ctx, px, py, p, sh[0], sh[1], h[0], h[1], color, 0.6, alpha)
  },
  saber(ctx, px, py, p, key, hand, angle, len, color, alpha) {
    const [hx, hy] = hand
    const ex = hx + Math.cos(angle) * (len + 0.9), ey = hy + Math.sin(angle) * (len + 0.9)
    const bx = hx + Math.cos(angle) * 0.9, by = hy + Math.sin(angle) * 0.9
    // motion trail: a fading fan between the last few blade tips
    const tr = this.trail[key] || (this.trail[key] = [])
    tr.unshift([ex, ey]); if (tr.length > 6) tr.pop()
    if (len > 0.5) {
      for (let k = 1; k < tr.length; k++) {
        ctx.globalAlpha = alpha * 0.22 * (1 - k / tr.length)
        ctx.fillStyle = color
        ctx.beginPath(); ctx.moveTo(px(bx), py(by)); ctx.lineTo(px(tr[k - 1][0]), py(tr[k - 1][1])); ctx.lineTo(px(tr[k][0]), py(tr[k][1])); ctx.closePath(); ctx.fill()
      }
    }
    stroke(ctx, px, py, p, hx, hy, bx, by, '#A0A0A8', 0.34, alpha)
    if (len <= 0.05) return
    stroke(ctx, px, py, p, bx, by, ex, ey, color, 0.7, alpha * 0.4)
    stroke(ctx, px, py, p, bx, by, ex, ey, color, 0.36, alpha)
    stroke(ctx, px, py, p, bx, by, ex, ey, '#FFFFFF', 0.15, alpha)
  },

  overlaySpace({ ctx, t, dt, total, L, box }) {
    const d = this.dir
    const fade = 1 - clamp01((t - (total - 0.5)) / 0.4)
    if (fade <= 0 || t < 0.9) return
    ctx.globalAlpha = fade
    // X-wings weaving across
    for (const s of this.xwings) {
      const x = s.x0 + d * this.vx * t, y = s.y + Math.sin(t * 3 + s.ph) * 0.8
      if (x > -10 && x < L.cols + 10) drawSprite(ctx, box, XWING, XWING_PAL, x, y, 0.5, d < 0)
    }
    // TIE fighters the other way, one of them blown apart
    this.ties.forEach((s, k) => {
      const x = s.x0 - d * this.vt * t, y = s.y + Math.sin(t * 4 + s.ph) * 1.2
      if (k === this.boomTie && t > this.boomAt) {
        if (!this.boomed) { this.boomed = true; for (let n = 0; n < 16; n++) this.sparks.push({ x: x + 2.2, y: y + 2.2, vx: rand(-9, 9), vy: rand(-9, 9), life: 0, max: rand(0.3, 0.6), size: rand(0.4, 1), grow: 0.8, color: pick(['#FFFFFF', '#FFD23F', '#FF8A3D', '#8A8A96']) }) }
        return
      }
      if (x > -6 && x < L.cols + 6) {
        drawSprite(ctx, box, TIE, TIE_PAL, x, y, 0.5)
        if (Math.floor(t * 3 + k) % 4 === 0) { ctx.fillStyle = '#5CFF6A'; box(x - d * 2 - ((t * 60) % 6) * d, y + 2.1, 1.6, 0.25) }
      }
    })
    // red laser bolts streaking to the letters
    for (const s of this.shots) {
      if (t < s.tf || t > s.hit) {
        if (t >= s.hit && !this.sparked.has(s)) {
          this.sparked.add(s)
          for (let n = 0; n < 8; n++) this.sparks.push({ x: s.x, y: s.y, vx: rand(-8, 8), vy: rand(-8, 5), life: 0, max: rand(0.2, 0.4), size: rand(0.3, 0.6), color: pick(['#FFFFFF', '#FF8A6A', '#FFD23F']), g: 14 })
        }
        continue
      }
      const u = (t - s.tf) / (s.hit - s.tf)
      const x = lerp(s.sx, s.x, u), y = lerp(s.sy, s.y, u)
      const ang = Math.atan2(s.y - s.sy, s.x - s.sx)
      ctx.fillStyle = '#FF3A2A'
      for (let k = 0; k < 4; k++) box(x - Math.cos(ang) * k * 0.45 - 0.15, y - Math.sin(ang) * k * 0.45 - 0.15, 0.3, 0.3)
      ctx.fillStyle = '#FFFFFF'; box(x - 0.1, y - 0.1, 0.2, 0.2)
    }
    stepParticles(this.sparks, dt, ctx, box)
    ctx.globalAlpha = 1
  },

  overlayBlasters({ ctx, t, dt, total, L, p, px, py, box }) {
    const d = this.dir
    const fade = 1 - clamp01((t - (total - 0.45)) / 0.4)
    if (fade <= 0 || t < 0.9) return
    const enter = clamp01((t - 0.9) / 0.3)
    ctx.globalAlpha = fade * enter
    // Han, popping up from behind the crate to shoot
    const shooting = this.hanShots.some((h) => t > h.tf - 0.25 && t < h.tf + 0.15)
    const duck = shooting ? 0 : 1.6
    ctx.save()
    ctx.beginPath(); ctx.rect(px(-2), py(0), px(L.cols + 2) - px(-2), py(GROUND) - py(0)); ctx.clip()
    drawSprite(ctx, box, HAN, HAN_PAL, this.hanX, GROUND - FH + duck, SC, d < 0)
    ctx.restore()
    if (shooting) { ctx.fillStyle = '#4A4A4A'; box(this.hanX + (d > 0 ? FW - 0.6 : -0.9), GROUND - FH + 7.6 * SC, 1.5, 0.45) }
    // the troopers: fire, and fall when Han hits them
    this.troopers.forEach((tr) => {
      const shot = this.hanShots.find((h) => h.tr === tr)
      if (t > shot.hit) {
        const u = clamp01((t - shot.hit) / 0.4)
        if (u < 1) drawSpriteRot(ctx, px, py, p, TROOPER, TROOPER_PAL, tr.x + FW / 2 + d * u * 1.5, GROUND - FH / 2 + u * 3, SC, d * u * 1.5, d > 0)
        else { ctx.globalAlpha = fade * 0.9; drawSpriteRot(ctx, px, py, p, TROOPER, TROOPER_PAL, tr.x + FW / 2 + d * 1.5, GROUND - 1.5, SC, d * Math.PI / 2, d > 0); ctx.globalAlpha = fade * enter }
        return
      }
      drawSprite(ctx, box, TROOPER, TROOPER_PAL, tr.x, GROUND - FH, SC, d > 0)
      ctx.fillStyle = '#2A2A2A'; box(tr.x + (d > 0 ? -1.2 : FW - 0.3), GROUND - FH + 7.6 * SC, 1.6, 0.4)
    })
    // bolts: troopers' (hitting the letters) and Han's (hitting troopers)
    const bolt = (x0, y0, x1, y1, u) => {
      const x = lerp(x0, x1, u), y = lerp(y0, y1, u), ang = Math.atan2(y1 - y0, x1 - x0)
      ctx.fillStyle = '#FF3A2A'
      for (let k = 0; k < 5; k++) box(x - Math.cos(ang) * k * 0.4 - 0.15, y - Math.sin(ang) * k * 0.4 - 0.15, 0.3, 0.3)
      ctx.fillStyle = '#FFFFFF'; box(x - 0.1, y - 0.1, 0.2, 0.2)
    }
    for (const b of this.bolts) {
      if (t >= b.tf && t < b.hit) bolt(b.sx, b.sy, b.x, b.y, (t - b.tf) / (b.hit - b.tf))
      if (t >= b.hit && !this.sparked.has(b)) {
        this.sparked.add(b)
        for (let n = 0; n < 7; n++) this.sparks.push({ x: b.x, y: b.y, vx: rand(-8, 8), vy: rand(-8, 4), life: 0, max: rand(0.2, 0.35), size: rand(0.3, 0.6), color: pick(['#FFFFFF', '#FF8A6A', '#FFD23F']), g: 14 })
      }
    }
    for (const h of this.hanShots) {
      if (t < h.tf || t > h.hit) continue
      const hx = this.hanX + (d > 0 ? FW + 0.6 : -0.6), hy = GROUND - FH + 7.8 * SC
      bolt(hx, hy, h.tr.x + FW / 2, GROUND - FH + 5, (t - h.tf) / (h.hit - h.tf))
    }
    stepParticles(this.sparks, dt, ctx, box)
    ctx.globalAlpha = 1
  },
}

export default starwars
