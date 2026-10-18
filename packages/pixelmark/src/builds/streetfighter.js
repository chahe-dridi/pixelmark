// Pixel wordmark build: Street Fighter. A best-of-three played one round per
// appearance: each time this build comes round it plays the next round of
// the match (ROUND 1, ROUND 2, FINAL ROUND), with the score carried over in
// the round markers, until someone has won two: then "<LABEL> WINS" (or
// BUGS) and the next match starts fresh. In a round the fighters trade
// punches, kicks, uppercuts, hurricane kicks and fireballs; every landed hit
// reveals the next stretch of the wordmark.

import { PAD_T, GROUND, SCENE_TOP, hash, clamp01, lerp, outCubic, rand, pick, disc, drawSprite, drawText, drawTextCentered, textWidth, stepParticles, finalColor, choose, dirOf } from '../engine/kit'

export const S_STANCE = ['....HHHH....', '...HHHHHH...', 'BB.BBBBBB...', '.B.SSSSSS...', '...SSESSE...', '....SSSS....', '..WWWWWWWW..', '.WWGWWWWGWW.',
  '.WW.WWWW.SSS', 'SSS.WWWW.SS.', '....KKKK....', '...WWWWWW...', '..WWW..WWW..', '.WWW....WWW.', 'WWW......WWW', 'FF........FF']
export const S_PUNCH = ['....HHHH....', '...HHHHHH...', 'BB.BBBBBB...', '.B.SSSSSS...', '...SSESSE...', '....SSSS....', '..WWWWWWWWSS', '.WWGWWWWWWSS',
  '.WW.WWWW....', 'SSS.WWWW....', '....KKKK....', '...WWWWWW...', '..WWW..WWW..', '.WWW....WWW.', 'WWW......WWW', 'FF........FF']
export const S_KICK = ['..HHHH......', '.HHHHHH.....', 'BBBBBBB.....', '.SSSSSS.....', '.SSESSE.....', '..SSSS......', '.WWWWWW.....', 'WWGWWWWW....',
  'SWWWWWWWWWFF', 'S..WWWWWWWFF', '...KKKK.....', '..WWWW......', '..WWW.......', '..WWW.......', '..WW........', '..FF........']
export const S_UPPER = ['..........SS', '....HHHH..SS', '...HHHHHHWW.', 'BB.BBBBBBWW.', '.B.SSSSSWW..', '...SSESSW...', '....SSSS....', '..WWWWWWW...',
  '.WWGWWWWW...', '.WW.WWWW....', 'SSS.KKKK....', '....WWWWW...', '...WWW.WW...', '..WWW...WW..', '..WW.....W..', '..FF.....FF.']
export const S_HADO = ['....HHHH....', '...HHHHHH...', 'BB.BBBBBB...', '.B.SSSSSS...', '...SSESSE...', '....SSSS....', '..WWWWWW....', '.WWWWWWWWWSS',
  '.WWWWWWWWWSS', '..WWWWWW....', '...KKKK.....', '..WWWWWWW...', '.WWWW..WWW..', 'WWW.....WWW.', 'WW.......WWW', 'FF.......FF.']
export const S_HIT = ['.....HHHH...', '....HHHHHH..', '...BBBBBBBB.', '....SSSSSS..', '....SESSES..', '.....SSSS...', '...WWWWWW...', '..WWWWWWWW..',
  '.SS.WWWW.SS.', '.SS.WWWW.SS.', '....KKKK....', '...WWWWWW...', '..WWW..WWW..', '..WW....WW..', '.WW......WW.', '.FF......FF.']
export const S_WIN = ['.........SS.', '....HHHH.SS.', '...HHHHHHWW.', 'BB.BBBBBBWW.', '.B.SSSSSSW..', '...SSESSEW..', '....SSSSW...', '..WWWWWWW...',
  '.WWGWWWWW...', '.WW.WWWW....', 'SSS.KKKK....', '...WWWWWW...', '..WWW..WWW..', '.WWW....WWW.', 'WWW......WWW', 'FF........FF']
export const S_DOWN = ['..........SS.HHHH.', 'FFWWWWWWWWWWSSHHHH', 'FFWWWWKKWWWWWSSHH.', '..WWWWWWWWWWW.....']
export const RYU = { H: '#2A1A10', B: '#D82020', S: '#F0B080', E: '#1A1A1A', W: '#F2F2F2', G: '#B9B9C8', K: '#1E1E1E', F: '#F0B080' }
export const KEN = { H: '#F2C640', B: '#F2C640', S: '#F0B080', E: '#1A1A1A', W: '#D83A20', G: '#8E2412', K: '#1E1E1E', F: '#F0B080' }
const WHITE = { H: '#FFF', B: '#FFF', S: '#FFF', E: '#FFF', W: '#FFF', G: '#FFF', K: '#FFF', F: '#FFF' }
export const BALL = ['#FFFFFF', '#9FE7FF', '#2A7FFF']
const SC = 0.6, FW = 12 * SC, FH = 16 * SC
// The left fighter carries the wordmark's label; the right one is always BUGS
const names = (L) => ({ L: L.label.slice(0, 10), R: 'BUGS' })
const MOVES = ['punch', 'kick', 'uppercut', 'tatsu', 'fireball']

const KEY = 'pixelmark-sf'
function loadMatch() {
  try {
    const m = JSON.parse(sessionStorage.getItem(KEY))
    if (m && m.L < 2 && m.R < 2) return { L: m.L | 0, R: m.R | 0 }
  } catch { /* storage blocked: start a fresh match */ }
  return { L: 0, R: 0 }
}
function saveMatch(m) { try { sessionStorage.setItem(KEY, JSON.stringify(m)) } catch { /* ignore */ } }

const other = (s) => (s === 'L' ? 'R' : 'L')
const dirOf = (s) => (s === 'L' ? 1 : -1)

const streetfighter = {
  name: 'streetfighter',
  setup(L, S, V) {
    this.pals = Math.random() < 0.5 ? { L: RYU, R: KEN } : { L: KEN, R: RYU }
    this.home = { L: 8, R: L.cols - 8 - FW }
    // this round's place in the match, and who takes it
    const match = loadMatch()
    this.prevWins = { ...match }
    const round = match.L + match.R
    const winner = choose(V, 'winner', () => (Math.random() < 0.62 ? 'L' : 'R'))
    match[winner]++
    const over = match[winner] >= 2
    saveMatch(over ? { L: 0, R: 0 } : match)
    this.events = []
    this.hits = []
    let t = 0.15
    let lastMove = null
    const addMove = (a, ko, dmg) => {
      let move
      do move = pick(MOVES); while (move === lastMove)
      lastMove = move
      const b = other(a), da = dirOf(a)
      const strikeX = a === 'L' ? this.home.R - FW + 0.8 : this.home.L + FW - 0.8
      const e = { type: 'move', move, a, b, t0: t, ko, dmg, strikeX }
      if (move === 'punch' || move === 'kick') { e.hit = t + 0.17; e.t1 = t + 0.42 }
      else if (move === 'uppercut') { e.hit = t + 0.22; e.t1 = t + 0.56 }
      else if (move === 'tatsu') { e.hit = t + 0.38; e.t1 = t + 0.56 }
      else {
        e.handX = this.home[a] + (da > 0 ? FW : 0)
        e.hit = t + 0.15 + Math.abs((this.home[b] + (da > 0 ? 1 : FW - 1)) - e.handX) / 60
        e.t1 = e.hit + 0.15
      }
      this.events.push(e)
      this.hits.push(e.hit)
      t = e.t1 + 0.05
    }
    const label = round === 2 ? 'FINAL ROUND' : `ROUND ${round + 1}`
    this.events.push({ type: 'intro', t0: t, t1: t + 0.8, label, round })
    t += 0.8
    const loser = other(winner)
    const hp = { L: 1, R: 1 }
    const n = 2 + (Math.random() < 0.5 ? 1 : 0)
    for (let k = 0; k < n; k++) {
      const a = Math.random() < 0.55 ? winner : loser
      const dmg = Math.min(rand(0.18, 0.3), hp[other(a)] - 0.15)
      hp[other(a)] -= dmg
      addMove(a, false, dmg)
    }
    addMove(winner, true, hp[loser])
    this.events.push({ type: 'ko', t0: t, t1: t + 0.75, winner, loser, round })
    t += 0.75
    if (over) { this.events.push({ type: 'final', t0: t, t1: t + 1.1, winner, loser }); t += 1.1 }
    this.end = t
    // every hit reveals the next stretch of the word, left to right
    const order = Array.from({ length: L.N }, (_, i) => i).sort((a, b) => L.X[a] - L.X[b] || L.Y[a] - L.Y[b])
    const H = this.hits.length
    order.forEach((i, rank) => {
      S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
      S.DL[i] = this.hits[Math.min(H - 1, Math.floor((rank * H) / L.N))] + (hash(i, 3, 3) / 1000) * 0.1; S.DU[i] = 0.4
    })
    this.sparks = []; this.sparked = new Set()
    return this.end + 0.3
  },
  ease: () => 1,
  colorAt(k, i, L, pal, tn) { return k < 0.15 ? '#FFF6C0' : k < 0.35 ? '#FFB040' : finalColor(L, pal, i, tn) },
  // which round we are in, health, wins, and whether each side is down
  status(t) {
    let round = 0
    const hp = { L: 1, R: 1 }, wins = { ...this.prevWins }, down = { L: null, R: null }
    for (const e of this.events) {
      if (e.t0 > t) break
      if (e.type === 'intro') { round = e.round; hp.L = 1; hp.R = 1; down.L = down.R = null }
      if (e.type === 'move' && t >= e.hit) {
        hp[e.b] = Math.max(0, hp[e.b] - e.dmg)
        if (e.ko) down[e.b] = { at: e.hit, launch: e.move === 'uppercut' || e.move === 'tatsu' }
      }
      if (e.type === 'ko') wins[e.winner]++
    }
    return { round, hp, wins, down }
  },
  overlay({ ctx, t, dt, total, L, box }) {
    const W = L.cols
    const fade = 1 - clamp01((t - (total - 0.35)) / 0.3)
    if (fade <= 0) return
    ctx.globalAlpha = fade
    // the event under way; in the short gaps between moves both fighters
    // simply stand their ground
    let e = this.events[0]
    for (const ev of this.events) if (ev.t0 <= t) e = ev
    if (t >= e.t1 && e.type !== 'final') e = { type: 'idle', t0: e.t1, t1: Infinity }
    const st = this.status(t)
    // ── HUD: health bars, KO badge, names, round markers ──
    const by = SCENE_TOP + 0.15, bh = 1.5, bw = W / 2 - 6
    for (const side of ['L', 'R']) {
      const x0 = side === 'L' ? 3 : W - 3 - bw
      ctx.fillStyle = '#1A1A1A'; box(x0 - 0.2, by - 0.2, bw + 0.4, bh + 0.4)
      ctx.fillStyle = '#C81E1E'; box(x0, by, bw, bh)
      ctx.fillStyle = '#F8D838'
      const fw = bw * st.hp[side]
      box(side === 'L' ? x0 + bw - fw : x0, by, fw, bh)
      drawText(ctx, box, names(L)[side], side === 'L' ? x0 + 0.4 : x0 + bw - 0.4 - textWidth(names(L)[side], 0.26), by + 0.1, 0.26, '#3A1A00')
      for (let k = 0; k < 2; k++) {
        const mx = side === 'L' ? x0 + bw - 1.2 - k * 1.5 : x0 + 0.4 + k * 1.5
        ctx.fillStyle = '#1A1A1A'; box(mx - 0.1, by + bh + 0.35, 1.0, 1.0)
        ctx.fillStyle = st.wins[side] > k ? '#F8D838' : '#4A4A4A'; box(mx, by + bh + 0.45, 0.8, 0.8)
      }
    }
    const koBlink = (e.type === 'ko' || e.type === 'final') && Math.floor(t * 8) % 2 === 0
    ctx.fillStyle = '#F8D838'; box(W / 2 - 2.8, by - 0.35, 5.6, bh + 0.7)
    ctx.fillStyle = koBlink ? '#FFFFFF' : '#C81E1E'; box(W / 2 - 2.55, by - 0.1, 5.1, bh + 0.2)
    drawTextCentered(ctx, box, 'KO', W / 2, by + 0.1, 0.26, koBlink ? '#C81E1E' : '#FFFFFF')
    // ── the fighters ──
    for (const side of ['L', 'R']) this.drawFighter(ctx, box, t, side, e, st)
    // ── fireballs ──
    if (e.type === 'move' && e.move === 'fireball' && t > e.t0 + 0.15 && t < e.hit) {
      const da = dirOf(e.a)
      const x = e.handX + da * 60 * (t - e.t0 - 0.15), y = GROUND - FH + 7.5 * SC
      for (let j = 3; j >= 1; j--) { ctx.globalAlpha = fade * (0.15 + 0.12 * (3 - j)); disc(ctx, box, x - da * j * 1.1, y, 1.6 - j * 0.25, BALL[2]) }
      ctx.globalAlpha = fade
      disc(ctx, box, x, y, 2.1, BALL[2]); disc(ctx, box, x, y, 1.5, BALL[1]); disc(ctx, box, x + da * 0.3, y, 0.9, BALL[0])
    }
    // ── hit sparks ──
    for (const ev of this.events) {
      if (ev.type !== 'move' || t < ev.hit || this.sparked.has(ev)) continue
      this.sparked.add(ev)
      const hx = ev.b === 'L' ? this.home.L + FW - 1 : this.home.R + 1
      const hy = GROUND - FH + (ev.move === 'kick' ? 4.5 : ev.move === 'uppercut' ? 2.5 : 3.8)
      for (let n = 0; n < (ev.ko ? 18 : 10); n++) this.sparks.push({ x: hx, y: hy, vx: rand(-12, 12), vy: rand(-10, 6), life: 0, max: rand(0.2, 0.4), size: rand(0.35, 0.7), color: pick(['#FFFFFF', '#FFF6C0', '#FFB040']), g: 14 })
    }
    stepParticles(this.sparks, dt, ctx, box)
    ctx.globalAlpha = fade
    // ── big text ──
    if (e.type === 'intro') {
      const u = t - e.t0, dur = e.t1 - e.t0
      if (u < dur - 0.28) drawTextCentered(ctx, box, e.label, W / 2, PAD_T + 3.5, 1, '#F8D838', '#B4441A')
      else drawTextCentered(ctx, box, 'FIGHT!', W / 2, PAD_T + 3, 1.2, '#FF5A2A', '#5A1A00')
    } else if (e.type === 'ko' || (e.type === 'move' && e.ko && t > e.hit)) {
      const flash = Math.floor(t * 10) % 2 === 0
      drawTextCentered(ctx, box, 'K.O.', W / 2, PAD_T + 3, 1.3, flash ? '#E8341C' : '#FFFFFF', flash ? '#FFFFFF' : '#E8341C')
    } else if (e.type === 'final') {
      const txt = `${names(L)[e.winner]} WINS`
      drawTextCentered(ctx, box, txt, W / 2, PAD_T + 3.5, textWidth(txt, 1) > W - 10 ? 0.8 : 1, '#F8D838', '#B4441A')
    }
    ctx.globalAlpha = 1
  },
  drawFighter(ctx, box, t, side, e, st) {
    const d = dirOf(side), flip = d < 0, pal = this.pals[side]
    const home = this.home[side]
    let x = home, y = GROUND - FH, rows = S_STANCE, colors = pal
    let bob = Math.floor(t * 5 + (side === 'L' ? 0 : 1)) % 2 ? 0.3 : 0
    const dn = st.down[side]
    if (dn) {
      // knocked down: launched, then lying, sliding back
      const u = clamp01((t - dn.at) / 0.4)
      const away = -d
      const lx = home + away * (outCubic(u) * 2.4) + (flip ? FW - 18 * SC : 0)
      const ly = GROUND - 4 * SC - Math.sin(u * Math.PI) * (dn.launch ? 4 : 1.5)
      if (u < 0.2) drawSprite(ctx, box, S_HIT, Math.floor(t * 30) % 2 ? WHITE : pal, home + away * 0.8, GROUND - FH, SC, flip)
      else drawSprite(ctx, box, S_DOWN, pal, lx, ly, SC, !flip)
      return
    }
    if (e.type === 'final' && e.winner === side) { rows = S_WIN; bob = 0 }
    if (e.type === 'move') {
      const u = t - e.t0
      if (e.a === side) {
        bob = 0
        if (e.move === 'punch' || e.move === 'kick') {
          if (u < 0.12) x = lerp(home, e.strikeX, u / 0.12)
          else if (u < 0.26) { x = e.strikeX; rows = e.move === 'punch' ? S_PUNCH : S_KICK }
          else x = lerp(e.strikeX, home, clamp01((u - 0.26) / 0.16))
        } else if (e.move === 'uppercut') {
          if (u < 0.1) x = lerp(home, e.strikeX, u / 0.1)
          else if (u < 0.4) { x = e.strikeX; rows = S_UPPER; y -= Math.sin(((u - 0.1) / 0.3) * Math.PI) * 3.2 }
          else x = lerp(e.strikeX, home, clamp01((u - 0.4) / 0.16))
        } else if (e.move === 'tatsu') {
          // the hurricane kick: spins across, legs out
          if (u < 0.4) { x = lerp(home, e.strikeX, u / 0.4); y -= Math.sin((u / 0.4) * Math.PI) * 1.8; rows = S_KICK; if (Math.floor(u * 16) % 2) return drawSprite(ctx, box, S_KICK, pal, x, y, SC, !flip) }
          else x = lerp(e.strikeX, home, clamp01((u - 0.4) / 0.16))
        } else if (u < 0.32) rows = S_HADO
      } else if (t >= e.hit && t < e.hit + 0.2) {
        rows = S_HIT; bob = 0
        x = home - d * 0.8 * Math.sin(((t - e.hit) / 0.2) * Math.PI)
        if (t - e.hit < 0.06) colors = WHITE
      }
    }
    drawSprite(ctx, box, rows, colors, x, y + bob, SC, flip)
  },
}

export default streetfighter
