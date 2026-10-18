// Pixel wordmark build: Among Us. Two stories that take turns (the build
// rotation puts plenty of other designs between them):
//   kill   crewmates fill the letters like fuel tasks, gather in the middle,
//          the impostor strikes and escapes down a vent
//   eject  the killer from the last kill is voted out: they tumble through
//          space while "<COLOUR> WAS THE IMPOSTOR." types out, and the letters
//          gather from the stars
// Every kill story picks a different impostor than the previous one.

import { PAD_T, GH, GROUND, SCENE_TOP, hash, clamp01, lerp, outCubic, rand, shuffled, letterMid, mainLetters, hostOf, drawSprite, drawSpriteRot, drawText, drawTextCentered, textWidth, finalColor } from '../engine/kit'

export const CREW = [
  ['....CCCC....', '...CCCCCC...', '..CCCVVVVV..', '.DCCVVWWVVV.', 'DDCCVVVVVVV.', 'DDCCCVVVVV..', 'DDCCCCCCCC..', 'DDCCCCCCCC..',
    '.DCCCCCCCC..', '..CCCCCCCC..', '..CCC..CCC..', '..CCC..CCC..'],
  ['....CCCC....', '...CCCCCC...', '..CCCVVVVV..', '.DCCVVWWVVV.', 'DDCCVVVVVVV.', 'DDCCCVVVVV..', 'DDCCCCCCCC..', 'DDCCCCCCCC..',
    '.DCCCCCCCC..', '..CCCCCCCC..', '...CCC.CCC..', '..CCC...CC..'],
]
const BODY = ['....WW......', '...WWWW.....', '....WW......', '..CCCCCCCC..', '.DCCCCCCCC..', 'DDCCCCCCCC..', '.DCCCCCCCC..', '..CCC..CCC..', '..CCC..CCC..']
export const COLORS = [['#38FEDC', '#24A8A0'], ['#50EF39', '#15A742'], ['#F5F557', '#C38823'], ['#F07D0D', '#B33E15'],
  ['#EE54BB', '#AC2BAE'], ['#D6E0F0', '#8394BF'], ['#6B30BC', '#3B177C'], ['#3D5AFE', '#1A2AA8'], ['#C51111', '#7A0838']]
const NAMES = ['CYAN', 'LIME', 'YELLOW', 'ORANGE', 'PINK', 'WHITE', 'PURPLE', 'BLUE', 'RED']
const VISOR = { V: '#9FD9EC', W: '#E6FAFF' }
const AU = { walk: 26, task: 0.3, sc: 0.55 }
const KILL_T = 1.0 // the kill close-up
const BONE = ['.WW.', 'WWWW', '.WW.', '.WW.']
const SW = 12 * AU.sc, SH = 12 * AU.sc
const KEY = 'pixelmark-amongus'
const KILLER = 'pixelmark-amongus-killer'
const lastKiller = () => { try { const v = sessionStorage.getItem(KILLER); return v === null ? -1 : Number(v) } catch { return -1 } }

function nextStory() {
  let n = 0
  try { n = Number(sessionStorage.getItem(KEY)) || 0; sessionStorage.setItem(KEY, String(n + 1)) } catch { n = Math.floor(Math.random() * 2) }
  return n % 2 === 0 ? 'kill' : 'eject'
}
const palOf = (c) => ({ C: c[0], D: c[1], ...VISOR })

const amongus = {
  name: 'amongus',
  setup(L, S) {
    this.story = nextStory()
    return this.story === 'kill' ? this.setupKill(L, S) : this.setupEject(L, S)
  },

  // ── kill ────────────────────────────────────────────────────────────────
  setupKill(L, S) {
    // a new impostor every time: never the one who killed last
    const prev = lastKiller()
    const pickC = shuffled(COLORS.length).filter((c) => c !== prev)
    try { sessionStorage.setItem(KILLER, String(pickC[2])) } catch { /* ignore */ }
    const mains = mainLetters(L)
    const k = Math.max(1, Math.floor(mains.length / 3))
    this.crew = [
      { colors: COLORS[pickC[0]], letters: mains.slice(0, k), side: -1 },
      { colors: COLORS[pickC[1]], letters: mains.slice(mains.length - k).reverse(), side: 1 },
      { colors: COLORS[pickC[2]], letters: mains.slice(k, mains.length - k), side: 0 },
    ]
    this.taskAt = L.CX0.map(() => 0)
    let tasksEnd = 0
    for (const c of this.crew) {
      let x = c.side < 0 ? -7 : c.side > 0 ? L.cols + 1 : (c.letters.length ? letterMid(L, c.letters[0]) - SW / 2 - 4 : L.cols / 2)
      let t = 0.2 + (c.side > 0 ? 0.12 : 0)
      c.plan = []
      for (const ci of c.letters) {
        const tx = letterMid(L, ci) - SW / 2, dur = Math.abs(tx - x) / AU.walk
        c.plan.push({ t0: t, t1: t + dur, x0: x, x1: tx })
        t += dur
        c.plan.push({ t0: t, t1: t + AU.task, x0: tx, x1: tx, task: ci })
        this.taskAt[ci] = t
        t += AU.task; x = tx
      }
      c.x = x; c.t = t
      tasksEnd = Math.max(tasksEnd, t)
    }
    L.CX0.forEach((_, ci) => { this.taskAt[ci] = this.taskAt[hostOf(L, ci)] })
    // everyone gathers in the middle; the middle one is the impostor
    const mid = L.cols / 2
    const [a, b, imp] = this.crew
    const victim = Math.random() < 0.5 ? a : b, bystander = victim === a ? b : a
    this.victim = victim; this.imp = imp; this.bystander = bystander
    const meet = tasksEnd + 0.1
    const walk = (c, tx, t0) => { const dur = Math.abs(tx - c.x) / AU.walk; c.plan.push({ t0: Math.max(t0, c.t), t1: Math.max(t0, c.t) + dur, x0: c.x, x1: tx }); c.t = Math.max(t0, c.t) + dur; c.x = tx }
    walk(victim, mid + (victim.side < 0 ? -5 : 5) - SW / 2, meet)
    walk(bystander, mid + (bystander.side < 0 ? -14 : 14) - SW / 2, meet)
    walk(imp, mid - SW / 2, meet)
    const vside = victim.x < imp.x ? -1 : 1
    this.tKill = Math.max(victim.t, imp.t) + 0.35
    this.killStyle = Math.random() < 0.6 ? 'knife' : 'tongue'
    this.splat = []
    imp.plan.push({ t0: imp.t, t1: this.tKill, x0: imp.x, x1: victim.x - vside * 3.2 })
    imp.x = victim.x - vside * 3.2; imp.t = this.tKill
    this.bodyX = victim.x
    // the vent, a few steps away; the impostor dives in
    this.ventX = imp.x + SW / 2 - vside * 7
    const runAt = this.tKill + KILL_T + 0.1
    this.tVent = runAt + Math.abs(this.ventX - SW / 2 - imp.x) / AU.walk
    imp.plan.push({ t0: runAt, t1: this.tVent, x0: imp.x, x1: this.ventX - SW / 2 })
    // the bystander wanders off, none the wiser
    bystander.plan.push({ t0: this.tKill + KILL_T, t1: this.tKill + KILL_T + 1.5, x0: bystander.x, x1: bystander.x + (bystander.side < 0 ? -40 : 40) })
    for (let i = 0; i < L.N; i++) {
      const gy = L.Y[i] - PAD_T
      S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
      S.DL[i] = this.taskAt[L.CI[i]] + ((GH - 1 - gy) / GH) * AU.task * 0.85; S.DU[i] = 0.12
    }
    this.tasks = mains.length
    this.tasksEnd = tasksEnd
    return this.tVent + 1.1
  },

  // ── eject ───────────────────────────────────────────────────────────────
  setupEject(L, S) {
    // the crewmate who did the last kill is the one thrown out
    let k = lastKiller()
    if (!(k >= 0 && k < COLORS.length)) k = Math.floor(Math.random() * COLORS.length)
    this.colors = COLORS[k]
    this.stars = Array.from({ length: 70 }, () => ({ x: rand(0, L.cols), y: rand(SCENE_TOP, L.rows), z: Math.random() < 0.35 ? 2 : 1 }))
    this.text = `${NAMES[k]} WAS THE IMPOSTOR.`
    for (let i = 0; i < L.N; i++) {
      S.SX[i] = rand(0, L.cols); S.SY[i] = rand(SCENE_TOP, L.rows)
      S.DL[i] = 2.1 + rand(0, 0.5); S.DU[i] = 0.7
    }
    return 3.75
  },

  ease: outCubic,
  colorAt(k, i, L, pal, tn) {
    if (this.story === 'eject') return k < 0.6 ? '#FFFFFF' : finalColor(L, pal, i, tn)
    return k < 0.6 ? '#F8E04A' : finalColor(L, pal, i, tn)
  },
  size(k) { return this.story === 'eject' ? 0.35 + 0.65 * k : 1 },

  underlay({ ctx, t, total, L, box }) {
    if (this.story !== 'eject') return
    // deep space, stars streaming past
    const a = clamp01(t / 0.25) * (1 - clamp01((t - (total - 0.55)) / 0.45))
    if (a <= 0) return
    ctx.globalAlpha = a
    ctx.fillStyle = '#05060F'; box(0, SCENE_TOP, L.cols, L.rows - SCENE_TOP)
    for (const s of this.stars) {
      const x = ((s.x - t * (s.z === 2 ? 22 : 9)) % L.cols + L.cols) % L.cols
      ctx.fillStyle = s.z === 2 ? '#FFFFFF' : '#8A93B8'
      box(x, s.y, s.z === 2 ? 0.3 : 0.2, s.z === 2 ? 0.3 : 0.2)
    }
    ctx.globalAlpha = 1
  },

  overlay(args) {
    if (this.story === 'eject') this.overlayEject(args)
    else this.overlayKill(args)
  },

  overlayEject({ ctx, t, L, p, px, py, box }) {
    // the ejected crewmate, tumbling end over end across the void
    const u = clamp01((t - 0.15) / 1.9)
    if (u > 0 && u < 1) drawSpriteRot(ctx, px, py, p, CREW[0], palOf(this.colors), lerp(-5, L.cols + 5, u), PAD_T + 6.5 + Math.sin(u * 5) * 1.2, AU.sc * 1.1, t * 5)
    // the verdict, typed out
    const a = 1 - clamp01((t - 2.15) / 0.3)
    if (a > 0 && t > 0.45) {
      const n = Math.min(this.text.length, Math.floor((t - 0.45) * 17))
      ctx.globalAlpha = a
      const sc = Math.min(0.5, (L.cols - 6) / (this.text.length * 4))
      const x0 = L.cols / 2 - textWidth(this.text, sc) / 2
      drawText(ctx, box, this.text.slice(0, n), x0, PAD_T + 4.6, sc, '#FFFFFF')
      if (t > 1.85) drawTextCentered(ctx, box, '0 IMPOSTORS REMAIN', L.cols / 2, PAD_T + 8.4, sc * 0.6, '#C9CCE0')
      ctx.globalAlpha = 1
    }
  },

  overlayKill(args) {
    const { ctx, t, total, L, box, px, py } = args
    const fade = 1 - clamp01((t - (total - 0.45)) / 0.4)
    if (fade <= 0) return
    ctx.globalAlpha = fade
    // task bar
    let done = 0, part = 0
    for (const c of this.crew) for (const s of c.plan) {
      if (s.task === undefined) continue
      if (t >= s.t1) done++
      else if (t > s.t0) part += (t - s.t0) / (s.t1 - s.t0)
    }
    const bw = 22, bx = 1.2, by = SCENE_TOP + 0.15
    ctx.fillStyle = '#1E2A2A'; box(bx - 0.2, by - 0.2, bw + 0.4, 1.4)
    ctx.fillStyle = '#4E5A5A'; box(bx, by, bw, 1)
    ctx.fillStyle = '#43D35F'; box(bx, by, bw * clamp01((done + part) / this.tasks), 1)
    drawText(ctx, box, 'TOTAL TASKS COMPLETED', bx + 0.4, by + 0.15, 0.14, '#FFFFFF')
    // the vent
    const open = t > this.tVent - 0.15 && t < this.tVent + 0.45
    ctx.fillStyle = '#2E3236'; box(this.ventX - 1.6, GROUND - 0.6, 3.2, 0.6)
    ctx.fillStyle = '#6A7076'
    for (let k = 0; k < 4; k++) box(this.ventX - 1.4 + k * 0.8, GROUND - 0.5 - (open ? 0.8 : 0), 0.45, 0.4)
    // the body left behind
    if (t >= this.tKill) {
      drawSprite(ctx, box, BODY, palOf(this.victim.colors), this.bodyX, GROUND - 9 * AU.sc, AU.sc, this.victim.x > this.imp.x)
    }
    // the kill flash
    for (const c of this.crew) {
      if (c === this.victim && t >= this.tKill) continue
      const seg = c.plan.find((s) => t >= s.t0 && t < s.t1) || (t < c.plan[0].t0 ? c.plan[0] : c.plan.filter((s) => s.t0 <= t).pop())
      const u = clamp01((t - seg.t0) / (seg.t1 - seg.t0))
      const x = lerp(seg.x0, seg.x1, u)
      const moving = seg.x1 !== seg.x0 && u > 0 && u < 1
      let facing = seg.x1 === seg.x0 ? (c.side || 1) * -1 : Math.sign(seg.x1 - seg.x0)
      if (c === this.imp && t > this.tKill - 0.3 && t < this.tKill + 0.25) facing = Math.sign(this.victim.x - this.imp.x) || 1
      if (c.side === 0) ctx.globalAlpha = fade * clamp01(t / 0.3)
      let y = GROUND - SH + (moving ? (Math.floor(t * 8) % 2) * -0.2 : 0)
      if (c === this.imp && t > this.tVent) {
        // dives into the vent
        const v = clamp01((t - this.tVent) / 0.25)
        if (v >= 1) continue
        ctx.save()
        ctx.beginPath(); ctx.rect(px(-2), py(0), px(L.cols + 2) - px(-2), py(GROUND - 0.4) - py(0)); ctx.clip()
        drawSprite(ctx, box, CREW[0], palOf(c.colors), x, y + v * SH, AU.sc, facing < 0)
        ctx.restore()
        continue
      }
      drawSprite(ctx, box, moving ? CREW[Math.floor(t * 8) % 2] : CREW[0], palOf(c.colors), x, y, AU.sc, facing < 0)
      ctx.globalAlpha = fade
      if (seg.task !== undefined && u > 0 && u < 1) {
        ctx.fillStyle = '#1E2A2A'; box(x + 1.3, GROUND - 8.4, 4, 0.7)
        ctx.fillStyle = '#43D35F'; box(x + 1.4, GROUND - 8.3, 3.8 * u, 0.5)
        const ci = seg.task
        ctx.globalAlpha = fade * 0.8
        ctx.fillStyle = '#FFF59A'; box(L.CX0[ci], GROUND - 1 - u * GH * 0.9, L.CX1[ci] - L.CX0[ci] + 1, 0.3)
        ctx.globalAlpha = fade
      }
    }
    if (t > this.tasksEnd && t < this.tasksEnd + 0.7) drawText(ctx, box, 'TASK COMPLETE!', bx + bw + 1, by - 0.1, 0.28, '#43D35F', '#0E3A16')
    this.killCut(ctx, box, px, py, args.p, t, args.dt, L, fade)
    ctx.globalAlpha = 1
  },

  // the kill, as the game shows it: a red close-up panel snaps open, the
  // impostor strikes (a knife stab, or the tongue), the victim is cut in two
  // with the bone showing, and the panel snaps shut on the body left behind
  killCut(ctx, box, px, py, p, t, dt, L, fade) {
    const u = (t - this.tKill) / KILL_T
    if (u < 0 || u > 1) return
    const open = Math.min(1, u / 0.08, (1 - u) / 0.08)
    const cy = PAD_T + 6.5, half = 6.2 * open
    ctx.globalAlpha = fade
    ctx.fillStyle = '#0A0A0A'; box(0, cy - half - 0.3, L.cols, half * 2 + 0.6)
    for (let y = -half; y < half; y += 0.5) {
      const k = 1 - Math.abs(y) / 6.2
      ctx.fillStyle = `rgb(${Math.round(70 + 90 * k)},${Math.round(6 + 10 * k)},${Math.round(8 + 10 * k)})`
      box(0, cy + y, L.cols, 0.5)
    }
    // speed streaks across the panel
    ctx.fillStyle = 'rgba(255,120,120,0.18)'
    for (let k = 0; k < 6; k++) box(((hash(k, 3, 1) / 1000) * L.cols + t * 60) % (L.cols + 10) - 10, cy - half + ((k * 2.1) % (half * 2)), 8, 0.2)
    if (open < 1) return
    const sc = 0.8, w = 12 * sc
    const mid = L.cols / 2
    const imp = palOf(this.imp.colors), vic = palOf(this.victim.colors)
    const top = cy - 6 * sc - 2.2
    const lunge = u < 0.25 ? -6 + (u / 0.25) * 2 : u < 0.36 ? -4 + ((u - 0.25) / 0.11) * 3 : -1
    const ix = mid - w - 0.5 + lunge, vx = mid + 0.5
    drawSprite(ctx, box, CREW[0], imp, ix, top, sc)
    const hit = u > 0.36
    if (this.killStyle === 'knife') {
      // the knife, held out, then driven in
      const kx = ix + w - 0.6, ky = top + 6.5 * sc
      ctx.fillStyle = '#5A3A1E'; box(kx, ky, 1, 0.5)
      ctx.fillStyle = '#D8DCE4'; box(kx + 1, ky - 0.05, hit ? 2.6 : 2.2, 0.6)
      ctx.fillStyle = '#FFFFFF'; box(kx + 1, ky - 0.05, hit ? 2.6 : 2.2, 0.15)
    } else if (u > 0.22) {
      // the visor splits into jaws; a tongue spears out
      const jx = ix + w - 1.8, jy = top + 3.2 * sc
      ctx.fillStyle = '#2A0505'; box(jx, jy, 2.2, 2.2)
      ctx.fillStyle = '#FFFFFF'; for (let k = 0; k < 4; k++) { box(jx + k * 0.55, jy, 0.3, 0.45); box(jx + k * 0.55, jy + 1.75, 0.3, 0.45) }
      const reach = clamp01((u - 0.24) / 0.12) * (1 - clamp01((u - 0.5) / 0.15))
      ctx.fillStyle = '#E8607A'; box(jx + 2, jy + 0.85, (vx + 3 - jx - 2) * reach, 0.5)
      if (reach > 0.95) { ctx.fillStyle = '#FFFFFF'; box(jx + 2 + (vx + 3 - jx - 2) - 0.4, jy + 0.6, 0.6, 1) }
    }
    if (!hit) { drawSprite(ctx, box, CREW[0], vic, vx, top, sc, true); return }
    // the victim: a white flash, then the top half flies off and the legs
    // stay standing, bone sticking out
    const v = (u - 0.36) / 0.64
    if (v < 0.08) { drawSprite(ctx, box, CREW[0], Object.fromEntries(Object.keys(vic).map((k) => [k, '#FFFFFF'])), vx, top, sc, true); return }
    drawSprite(ctx, box, CREW[0].slice(6), vic, vx, top + 6 * sc, sc, true)
    drawSprite(ctx, box, BONE, { W: '#F4F0E6' }, vx + w / 2 - 1.6 * sc * 1.25, top + 6 * sc - 4 * sc * 0.9, sc * 0.9)
    const fly = Math.min(1, v * 1.4)
    if (fly < 1) {
      const px0 = vx + w / 2 + fly * 6, py0 = top + 3 * sc - fly * 5 + fly * fly * 7
      ctx.save(); ctx.globalAlpha = fade * (1 - fly)
      ctx.beginPath(); ctx.rect(px(0), py(cy - 6.2), px(L.cols) - px(0), py(cy + 6.2) - py(cy - 6.2)); ctx.clip()
      const rows = CREW[0].slice(0, 6)
      for (let r = 0; r < rows.length; r++) for (let c = 0; c < 12; c++) {
        const col = vic[rows[r][11 - c]]
        if (!col) continue
        const a = fly * 4, cx = (c - 6) * sc, cyy = (r - 3) * sc
        ctx.fillStyle = col
        ctx.fillRect(px(px0 + cx * Math.cos(a) - cyy * Math.sin(a)), py(py0 + cx * Math.sin(a) + cyy * Math.cos(a)), sc * p + 0.6, sc * p + 0.6)
      }
      ctx.restore()
    }
    if (v > 0.08 && v < 0.2 && this.splat.length < 10) for (let n = 0; n < 4; n++) this.splat.push({ x: vx + w / 2, y: top + 6 * sc, vx: rand(-6, 6), vy: rand(-8, -2), life: 0, max: 0.5, size: 0.35, color: '#B01020', g: 20 })
    for (let j = this.splat.length - 1; j >= 0; j--) {
      const q = this.splat[j]; q.life += dt; q.vy += 20 * dt; q.x += q.vx * dt; q.y += q.vy * dt
      if (q.life > q.max) { this.splat.splice(j, 1); continue }
      ctx.globalAlpha = fade * (1 - q.life / q.max); ctx.fillStyle = q.color; box(q.x, q.y, 0.35, 0.35)
    }
    ctx.globalAlpha = fade
  },
}

export default amongus
