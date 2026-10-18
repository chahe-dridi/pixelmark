// Pixel wordmark build: Space Invaders. Loaded on demand by the engine.

import { MINT, SCENE_TOP, clamp01, drawSprite, hostOf, inOut, isNarrow, lerp, letterMid, outCubic, shuffled, spriteW, PAD_T } from '../engine/kit'

// ═══ Space Invaders ══════════════════════════════════════════════════════
export const INVADER = [
  ['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...'],
  ['..#.....#..', '#..#...#..#', '#.#######.#', '###.###.###', '###########', '.#########.', '..#.....#..', '.#.......#.'],
]
export const SQUID = [
  ['...##...', '..####..', '.######.', '##.##.##', '########', '..#..#..', '.#.##.#.', '#.#..#.#'],
  ['...##...', '..####..', '.######.', '##.##.##', '########', '.#.##.#.', '#......#', '.#....#.'],
]
const CANNON = ['......#......', '.....###.....', '.....###.....', '.###########.', '#############', '#############', '#############', '#############']
const UFO = ['.....######.....', '...##########...', '..############..', '.##.##.##.##.##.', '################', '..###..##..###..', '...#........#...']
const BURST = [[0, 0], [-2, -2], [2, -2], [-2, 2], [2, 2], [0, -3], [0, 3], [-3, 0], [3, 0], [-1, -1], [1, 1], [1, -1], [-1, 1]]

const invaders = {
  name: 'invaders',
  setup(L, S) {
    this.order = shuffled(L.CX0.length).filter((ci) => !isNarrow(L, ci))
    this.kill = L.CX0.map((_, ci) => 0.6 + this.order.indexOf(hostOf(L, ci)) * 0.3)
    this.kind = L.CX0.map(() => (Math.random() < 0.3 ? SQUID : INVADER))
    this.acc = L.CX0.map(() => false)
    this.ufo = Math.random() < 0.6 ? (Math.random() < 0.5 ? 1 : -1) : 0
    for (let i = 0; i < L.N; i++) {
      if (L.ACC[i]) this.acc[hostOf(L, L.CI[i])] = true
      S.SX[i] = letterMid(L, hostOf(L, L.CI[i])); S.SY[i] = PAD_T + 5
      S.DL[i] = this.kill[L.CI[i]]; S.DU[i] = 0.34
    }
    return 0.6 + (this.order.length - 1) * 0.3 + 0.34 + 0.45
  },
  ease: outCubic,
  size: (k) => 0.4 + 0.6 * k,
  flash: 0.06,
  overlay({ ctx, t, total, L, pal, box }) {
    const step = Math.floor(t * 4)
    const march = step % 2 ? 0.6 : -0.6
    const fadeIn = clamp01(t / 0.25)
    for (const ci of this.order) {
      const mid = letterMid(L, ci), since = t - this.kill[ci]
      if (since >= 0) {
        if (since < 0.14) {
          ctx.fillStyle = pal.spark
          for (const [dx, dy] of BURST) box(Math.round(mid + dx) - 0.35, PAD_T + 5 + dy + 0.15, 0.7, 0.7)
        }
        continue
      }
      ctx.globalAlpha = fadeIn
      const rows = this.kind[ci][step % 2], sc = 0.8
      drawSprite(ctx, box, rows, { '#': this.acc[ci] ? pal.acc[2] : pal.ink[1] }, mid - spriteW(rows, sc) / 2 + march, PAD_T + 2.5, sc)
      ctx.globalAlpha = 1
    }
    // the mystery ship gliding across the top
    if (this.ufo) {
      const u = clamp01((t - 0.3) / 2.4)
      if (u > 0 && u < 1) drawSprite(ctx, box, UFO, { '#': '#FF3B5C' }, this.ufo > 0 ? lerp(-9, L.cols + 1, u) : lerp(L.cols + 1, -9, u), SCENE_TOP, 0.5)
    }
    // the cannon glides under the next target, then fires
    const times = this.order.map((ci) => this.kill[ci])
    let j = times.findIndex((k) => k > t)
    const fade = 1 - clamp01((t - (total - 0.45)) / 0.35)
    if (fade <= 0) return
    const done = j < 0
    if (done) j = times.length
    const from = j === 0 ? L.cols / 2 : letterMid(L, this.order[j - 1])
    const to = done ? from : letterMid(L, this.order[j])
    const t0 = j === 0 ? 0.2 : times[j - 1], t1 = done ? t0 + 1 : times[j] - 0.16
    const x = lerp(from, to, inOut(clamp01((t - t0) / Math.max(0.01, t1 - t0))))
    const oy = L.rows - 4.3
    ctx.globalAlpha = fade
    drawSprite(ctx, box, CANNON, { '#': MINT }, x - 3.25, oy, 0.5)
    if (!done && t > times[j] - 0.16) {
      const f = (t - (times[j] - 0.16)) / 0.16
      ctx.fillStyle = pal.spark
      box(x - 0.15, oy - f * (oy - PAD_T - 6), 0.3, 1.4)
    }
    ctx.globalAlpha = 1
  },
}

export default invaders
