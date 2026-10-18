// Pixel wordmark build: Sahara. Loaded on demand by the engine.

import { GROUND, SCENE_TOP, disc, drawSprite, fadeInOut, finalColor, hash, outCubic, pick, rand, PAD_T } from '../engine/kit'

// ═══ Sahara ══════════════════════════════════════════════════════════════
const SAHARA = {
  dusk: { sun: ['#FFC27A', '#FF8A3D', '#E8501E'], dunes: ['#B86A3A', '#D48850', '#ECA868'], sand: '#F2C58A', sil: '#2A160C' },
  night: { moon: true, dunes: ['#2E2A44', '#3C3658', '#4E4670'], sand: '#D8C8EE', sil: '#120E1C' },
  noon: { sun: ['#FFF8E0', '#FFEAA8', '#FFD67A'], dunes: ['#D9B074', '#E8C58C', '#F4D9A8'], sand: '#F7E2B4', sil: null },
}
const CAMEL = [
  ['............KK..', '...KK.......KKKK', '..KKKK.....KK...', '.KKKKKK...KK....', 'KKKKKKKKKKKK....', 'KKKKKKKKKKK.....', '.KKKKKKKKKK.....', '.K.K....K.K.....', '.K.K....K.K.....', '.K.K....K.K.....'],
  ['............KK..', '...KK.......KKKK', '..KKKK.....KK...', '.KKKKKK...KK....', 'KKKKKKKKKKKK....', 'KKKKKKKKKKK.....', '.KKKKKKKKKK.....', '..KK...K.K......', '..KK...K.K......', '.K..K.K...K.....'],
]
const GUIDE = [['.BBBB.', '.BBBB.', '.BSBB.', '..BB..', '.BBBB.', 'BBBBBB', 'BBBBBB', '.BBBB.', '.B..B.', '.B..B.'],
  ['.BBBB.', '.BBBB.', '.BSBB.', '..BB..', '.BBBB.', 'BBBBBB', 'BBBBBB', '.BBBB.', '..BB..', '.B..B.']]
const DUNE = [
  { base: 6.2, a: 2.2, f: 0.045, ph: 0.7, drift: 0.05 },
  { base: 3.8, a: 1.6, f: 0.07, ph: 2.1, drift: 0.09 },
  { base: 1.3, a: 1.1, f: 0.11, ph: 4.0, drift: 0.14 },
]

const sahara = {
  name: 'sahara',
  setup(L, S) {
    this.time = pick(['dusk', 'dusk', 'night', 'noon'])
    this.look = SAHARA[this.time]
    const w = this.wind = Math.random() < 0.5 ? 1 : -1
    this.cdir = Math.random() < 0.5 ? 1 : -1
    this.caravan = rand(L.cols * 0.25, L.cols * 0.65)
    this.camels = Math.random() < 0.5 ? 2 : 3
    this.palm = Math.random() < 0.5 ? (Math.random() < 0.5 ? 6 : L.cols - 8) : null
    this.stars = Array.from({ length: 34 }, () => [rand(0, L.cols), rand(SCENE_TOP, GROUND - 7)])
    this.streaks = Array.from({ length: 18 }, () => ({ x: rand(0, L.cols), y: rand(PAD_T, GROUND), len: rand(2, 5), v: rand(24, 38) }))
    for (let i = 0; i < L.N; i++) {
      const u = w > 0 ? L.X[i] / L.cols : 1 - L.X[i] / L.cols
      S.SX[i] = L.X[i] - w * rand(16, 40); S.SY[i] = L.Y[i] + rand(-3, 3)
      S.DL[i] = 0.4 + u * 1.7 + rand(0, 0.3); S.DU[i] = 0.9
    }
    return 0.4 + 1.7 + 0.3 + 0.9 + 0.75
  },
  duneY(k, x, t) {
    const q = DUNE[k]
    return GROUND - q.base + q.a * Math.sin(x * q.f + q.ph + t * q.drift * this.wind)
  },
  ease: outCubic,
  size: (k) => 0.45 + 0.55 * k,
  offsetY: (k) => Math.sin(k * Math.PI * 2) * 0.8 * (1 - k),
  colorAt(k, i, L, pal, tn) { return k < 0.82 ? this.look.sand : finalColor(L, pal, i, tn) },
  underlay({ ctx, t, total, L, box }) {
    const a = fadeInOut(t, total, 0.35, 0.6)
    if (a <= 0) return
    const look = this.look
    ctx.globalAlpha = a
    if (this.time === 'night') {
      for (const [x, y] of this.stars) {
        ctx.globalAlpha = a * (0.4 + 0.6 * (hash(Math.floor(x * 10), Math.floor(t * 3), 2) / 1000))
        ctx.fillStyle = '#FFFFFF'; box(x, y, 0.25, 0.25)
      }
      ctx.globalAlpha = a
      disc(ctx, box, L.cols * 0.16, PAD_T + 1.2, 2.3, '#F2EBD3', 0.25)
      ctx.save(); ctx.globalCompositeOperation = 'destination-out'
      disc(ctx, box, L.cols * 0.16 + 1.1, PAD_T + 0.7, 2.1, '#000', 0.25)
      ctx.restore()
    } else {
      const [c0, c1, c2] = look.sun
      const big = this.time === 'dusk'
      const sx = big ? L.cols * 0.68 : L.cols * 0.84, sy = big ? GROUND - 4.5 : PAD_T + 0.8, r = big ? 6 : 2.4
      ctx.globalAlpha = a * 0.25; disc(ctx, box, sx, sy, r + 2.2, c2)
      ctx.globalAlpha = a * 0.5; disc(ctx, box, sx, sy, r + 1, c1)
      ctx.globalAlpha = a; disc(ctx, box, sx, sy, r, c0)
    }
    const fill = (k, color) => {
      ctx.fillStyle = color
      for (let x = 0; x < L.cols; x += 0.5) { const y = this.duneY(k, x + 0.25, t); box(x, y, 0.5, L.rows - y) }
    }
    fill(0, look.dunes[0])
    // a palm tree on the far dune
    if (this.palm !== null) {
      const baseY = this.duneY(0, this.palm, t)
      const trunk = look.sil || '#7A5230', frond = look.sil || '#3E7D3A'
      ctx.fillStyle = trunk
      for (let k = 0; k < 9; k++) box(this.palm + Math.sin(k * 0.25) * 1.2, baseY - k * 0.75, 0.55, 0.8)
      const tx = this.palm + Math.sin(2) * 1.2 + 0.25, ty = baseY - 6.8
      ctx.fillStyle = frond
      for (const dir of [-1, -0.5, 0.5, 1, 0]) {
        for (let s = 0; s < 6; s++) box(tx + dir * s * 0.65, ty + (s * s) * 0.06 * Math.abs(dir) - (dir === 0 ? s * 0.3 : 0), 0.5, 0.35)
      }
    }
    fill(1, look.dunes[1])
    // the caravan: a guide and camels plodding along the middle dune
    for (let n = 0; n <= this.camels; n++) {
      const x = this.caravan + this.cdir * (t * 4.5 - n * 8.5)
      const guide = n === 0
      const rows = guide ? GUIDE[Math.floor(t * 4) % 2] : CAMEL[Math.floor(t * 4 + n) % 2]
      const w = rows[0].length * 0.5, h = rows.length * 0.5
      const y = this.duneY(1, x + w / 2, t) - h + 0.4 + (Math.floor(t * 4 + n) % 2) * 0.1
      const pal = look.sil ? { K: look.sil, B: look.sil, S: look.sil } : { K: '#B88A5A', B: '#2B3F8F', S: '#C68B5E' }
      drawSprite(ctx, box, rows, pal, x, y, 0.5, this.cdir < 0)
    }
    fill(2, look.dunes[2])
    ctx.globalAlpha = 1
  },
  overlay({ ctx, t, dt, total, L, box }) {
    // wind: thin streaks of sand blowing across
    const a = fadeInOut(t, total, 0.3, 0.6) * 0.45
    if (a <= 0) return
    ctx.globalAlpha = a
    ctx.fillStyle = this.look.sand
    for (const s of this.streaks) {
      s.x += this.wind * s.v * dt
      if (s.x > L.cols + 6) s.x = -6
      if (s.x < -6) s.x = L.cols + 6
      box(s.x, s.y, s.len, 0.14)
    }
    ctx.globalAlpha = 1
  },
}

export default sahara
