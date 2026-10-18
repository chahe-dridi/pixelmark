// Pixel wordmark build: Pac-Man. Loaded on demand by the engine.

import { SCENE_TOP, clamp01, disc, drawSprite, drawTextCentered, fadeInOut, lerp, letterMid, mainLetters, pick, shuffled, PAD_T } from '../engine/kit'

// ═══ Pac-Man ═════════════════════════════════════════════════════════════
export const GHOST = [
  ['.....####.....', '...########...', '..##########..', '.##WW####WW##.', '.#WWWW##WWWW#.', '.#WWPP##WWPP#.', '##WWPP##WWPP##',
    '###WW####WW###', '##############', '##############', '##############', '##############', '##.###..###.##', '#...##..##...#'],
  ['.....####.....', '...########...', '..##########..', '.##WW####WW##.', '.#WWWW##WWWW#.', '.#WWPP##WWPP#.', '##WWPP##WWPP##',
    '###WW####WW###', '##############', '##############', '##############', '##############', '#.###.##.###.#', '...##....##...'],
]
export const GHOST_SCARED = [
  ['.....####.....', '...########...', '..##########..', '.############.', '.###FF##FF###.', '.###FF##FF###.', '##############',
    '##############', '##FF##FF##FF##', '#F##FF##FF##F#', '##############', '##############', '##.###..###.##', '#...##..##...#'],
  ['.....####.....', '...########...', '..##########..', '.############.', '.###FF##FF###.', '.###FF##FF###.', '##############',
    '##############', '##FF##FF##FF##', '#F##FF##FF##F#', '##############', '##############', '#.###.##.###.#', '...##....##...'],
]
export const GHOST_COLORS = { blinky: '#FF2D2D', pinky: '#FFA1D6', inky: '#2DE1FF', clyde: '#FFAE3D' }
const CHERRY = ['.....GGG', '....G..G', '...G...G', '.RRG..RR', 'RWRR.RWR', 'RRRR.RRR', '.RR...RR']
const CHERRY_PAL = { G: '#3CB043', R: '#E8202A', W: '#FFFFFF' }
const PAC_T = 3.2, MAZE = '#2B3BE0'
export const PAC_YELLOW = '#FFD23F'

function drawPac(ctx, box, cx, cy, r, dir, mouth) {
  ctx.fillStyle = PAC_YELLOW
  const res = 0.5
  for (let y = -r; y < r; y += res) {
    for (let x = -r; x < r; x += res) {
      const mx = x + res / 2, my = y + res / 2
      if (mx * mx + my * my > r * r) continue
      if (mx * dir > 0 && Math.abs(Math.atan2(my, mx * dir)) < mouth) continue
      box(cx + x, cy + y, res, res)
    }
  }
  ctx.fillStyle = '#100F0D'
  box(cx + dir * 0.6 - 0.3, cy - r * 0.55, 0.7, 0.7)
}

const pacman = {
  name: 'pacman',
  setup(L, S) {
    const d = this.dir = Math.random() < 0.5 ? 1 : -1
    this.start = d > 0 ? -7 : L.cols + 7
    this.v = (L.cols + 14) / PAC_T
    this.cy = PAD_T + 6.5
    const names = shuffled(4).map((k) => ['blinky', 'pinky', 'inky', 'clyde'][k])
    this.ahead = names[0]
    this.chasers = names.slice(1, Math.random() < 0.5 ? 3 : 4)
    // the power pellet: far enough in that the ghost ahead gets eaten on screen
    const mains = mainLetters(L)
    const ok = mains.slice(1).filter((ci) => (d > 0 ? letterMid(L, ci) + 20 < L.cols : letterMid(L, ci) - 20 > 0))
    this.pp = letterMid(L, ok.length ? pick(ok) : mains[1])
    this.tp = ((this.pp - this.start) * d) / this.v
    this.cherry = Math.random() < 0.55 ? letterMid(L, mains[d > 0 ? 1 : mains.length - 2]) : null
    this.ax0 = this.pp + d * 15
    this.va = this.v * 0.38
    this.xaTp = this.ax0 + Math.sin(this.tp * 3) * 2
    this.te = this.tp + Math.max(0.05, ((this.xaTp - this.pacX(this.tp)) * d - 4) / (this.v - this.va))
    this.xaTe = this.xaTp + d * this.va * (this.te - this.tp)
    this.cherryEaten = false; this.pops = []; this.eatenScored = false
    for (let i = 0; i < L.N; i++) {
      S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
      S.DL[i] = ((L.X[i] - this.start) * d) / this.v + 0.04 + (L.Y[i] - PAD_T) * 0.006; S.DU[i] = 0.26
    }
    return PAC_T + 0.4
  },
  pacX(t) { return this.start + this.dir * this.v * t },
  ease: () => 1,
  size: (k) => (k < 0.6 ? (k / 0.6) * 1.25 : 1.25 - ((k - 0.6) / 0.4) * 0.25),
  flash: 0.08,
  underlay({ ctx, t, total, L, p, px, py, box }) {
    const a = fadeInOut(t, total, 0.2, 0.45)
    if (a <= 0) return
    // the maze: double blue walls with the side tunnels open
    const trace = clamp01(t / 0.5)
    ctx.globalAlpha = a
    ctx.strokeStyle = MAZE; ctx.lineWidth = Math.max(1, p * 0.16); ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    const tun0 = this.cy - 6.2, tun1 = this.cy + 6.2
    for (const inset of [0, 0.75]) {
      const x0 = 0.4 + inset, x1 = L.cols - 0.4 - inset
      const y0 = SCENE_TOP + 0.3 + inset, y1 = L.rows - 0.4 - inset, r = 1.6 - inset * 0.6
      const len = (x1 - x0) + 2 * (tun0 - y0) + 4
      ctx.setLineDash([len * trace * p, 1e5])
      for (const [ya, yb, yc] of [[tun0, y0, y0 + r], [tun1, y1, y1 - r]]) {
        ctx.beginPath()
        ctx.moveTo(px(0), py(ya + (yb < ya ? -1 : 1) * (0.75 - inset)))
        ctx.lineTo(px(x0), py(ya + (yb < ya ? -1 : 1) * (0.75 - inset)))
        ctx.lineTo(px(x0), py(yc))
        ctx.quadraticCurveTo(px(x0), py(yb), px(x0 + r), py(yb))
        ctx.lineTo(px(x1 - r), py(yb))
        ctx.quadraticCurveTo(px(x1), py(yb), px(x1), py(yc))
        ctx.lineTo(px(x1), py(ya + (yb < ya ? -1 : 1) * (0.75 - inset)))
        ctx.lineTo(px(L.cols), py(ya + (yb < ya ? -1 : 1) * (0.75 - inset)))
        ctx.stroke()
      }
    }
    ctx.setLineDash([])
    if (t < 0.55) {
      ctx.globalAlpha = a * (Math.floor(t * 8) % 2 ? 1 : 0.6)
      drawTextCentered(ctx, box, 'READY!', L.cols / 2, this.cy - 1.2, 0.55, PAC_YELLOW)
    }
    ctx.globalAlpha = 1
  },
  overlay({ ctx, t, L, box }) {
    const d = this.dir, cy = this.cy, pacX = this.pacX(t)
    const ahead = (x, gap) => (x - pacX) * d > gap
    // pellets, the power pellet and maybe a cherry, still uneaten
    ctx.fillStyle = '#FFC9A8'
    for (let x = 1.5; x < L.cols; x += 3) {
      if (Math.abs(x - this.pp) < 2 || (this.cherry && Math.abs(x - this.cherry) < 2.5)) continue
      if (ahead(x, 5)) box(x - 0.2, cy - 0.2, 0.4, 0.4)
    }
    if (ahead(this.pp, 5) && Math.floor(t * 5) % 2 === 0) disc(ctx, box, this.pp, cy, 1.05, '#FFC9A8')
    if (this.cherry !== null) {
      if (ahead(this.cherry, 4)) drawSprite(ctx, box, CHERRY, CHERRY_PAL, this.cherry - 2, cy - 2, 0.5)
      else if (!this.cherryEaten) { this.cherryEaten = true; this.pops.push({ text: '100', x: this.cherry, t0: t }) }
    }
    const scared = t >= this.tp
    const flashing = scared && t > PAC_T - 0.9 && Math.floor(t * 8) % 2 === 0
    const frame = Math.floor(t * 8) % 2
    const drawGhost = (name, x, facing, eyesOnly) => {
      if (eyesOnly) {
        drawSprite(ctx, box, GHOST[0], { W: '#FFFFFF', P: '#2131C8' }, x - 5.25, cy - 5.25, 0.75, facing < 0)
      } else if (scared) {
        drawSprite(ctx, box, GHOST_SCARED[frame], flashing ? { '#': '#FFFFFF', F: '#FF2D2D' } : { '#': '#2131C8', F: '#FFB8AE' }, x - 5.25, cy - 5.25, 0.75)
      } else {
        drawSprite(ctx, box, GHOST[frame], { '#': GHOST_COLORS[name], W: '#FFFFFF', P: '#2131C8' }, x - 5.25, cy - 5.25, 0.75, facing < 0)
      }
    }
    // chasers follow him in; once he eats the power pellet they turn and flee
    this.chasers.forEach((name, k) => {
      const gap = 13 + 11.5 * k
      const x = t < this.tp ? pacX - d * gap : this.pacX(this.tp) - d * gap - d * this.v * 0.55 * (t - this.tp)
      drawGhost(name, x, t < this.tp ? d : -d, false)
    })
    // the ghost patrolling ahead gets caught: 200 points, eyes fly home
    if (t < this.te) {
      const x = t < this.tp ? this.ax0 + Math.sin(t * 3) * 2 : this.xaTp + d * this.va * (t - this.tp)
      drawGhost(this.ahead, x, t < this.tp ? Math.sign(Math.cos(t * 3)) || 1 : d, false)
    } else {
      if (!this.eatenScored) { this.eatenScored = true; this.pops.push({ text: '200', x: this.xaTe, t0: t }) }
      const u = clamp01((t - this.te) / 0.7)
      if (u < 1) drawGhost(this.ahead, lerp(this.xaTe, L.cols / 2, u), -d, true)
    }
    for (const q of this.pops) {
      const u = (t - q.t0) / 0.8
      if (u < 0 || u >= 1) continue
      ctx.globalAlpha = 1 - u * u
      drawTextCentered(ctx, box, q.text, Math.max(3, Math.min(L.cols - 3, q.x)), cy - 7 - u * 1.5, 0.45, '#2DE1FF')
      ctx.globalAlpha = 1
    }
    drawPac(ctx, box, pacX, cy, 5.25, d, Math.abs(Math.sin(t * 20)) * 0.85)
  },
}

export default pacman
