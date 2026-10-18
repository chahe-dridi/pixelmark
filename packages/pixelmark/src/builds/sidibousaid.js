// Pixel wordmark build: Sidi Bou Said. Loaded on demand by the engine.

import { GH, GROUND, SCENE_TOP, clamp01, disc, drawSprite, fadeInOut, finalColor, hash, hostOf, inOut, mainLetters, pick, rand, shuffled, PAD_T, choose } from '../engine/kit'

// ═══ Sidi Bou Said ═══════════════════════════════════════════════════════
const SBS = {
  wall: '#F1ECE2', speck: '#DDD5C6', trim: '#2D7FCC', interior: '#2A1E18', step: '#CFC6B5',
  blue: ['#1F5FA8', '#3D86D6', '#123A6B'], yellow: ['#E3B23C', '#F2CF6B', '#9A7414'],
  bloom: ['#D6337A', '#F05A9A', '#B01E5E'], leaf: '#3E7D3A',
}
const CAT = [['.K.....KK.', '.K.....KKK', 'K.KKKKKKKK', '.KKKKKKKK.', '.K.K..K.K.', '.K.K..K.K.'],
  ['.K.....KK.', '.K.....KKK', 'K.KKKKKKKK', '.KKKKKKKK.', '..KK..KK..', '.K..K.K..K']]

const sidibousaid = {
  name: 'sidibousaid',
  setup(L, S, V) {
    const doors = choose(V, 'doors', () => 'mixed')
    const mains = mainLetters(L)
    const order = shuffled(mains.length)
    this.doors = mains.map((ci, k) => ({
      ci, x0: L.CX0[ci] - 0.5, x1: L.CX1[ci] + 1.5, at: 0.5 + order[k] * 0.28,
      colors: doors === 'yellow' || (doors === 'mixed' && Math.random() < 0.2) ? SBS.yellow : SBS.blue,
    }))
    const openAt = L.CX0.map((_, ci) => this.doors.find((dr) => dr.ci === hostOf(L, ci)).at)
    for (let i = 0; i < L.N; i++) {
      S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
      S.DL[i] = openAt[L.CI[i]] + 0.22 + (hash(i, 8, 8) / 1000) * 0.12; S.DU[i] = 0.35
    }
    this.cat = choose(V, 'cat', () => Math.random() < 0.65) ? (Math.random() < 0.5 ? 1 : -1) : 0
    this.blooms = Array.from({ length: 16 }, () => {
      const left = Math.random() < 0.5
      return { x: left ? rand(0, 12) : rand(L.cols - 12, L.cols), y: rand(SCENE_TOP + 0.2, SCENE_TOP + 2.6), r: rand(0.4, 0.8), c: pick(SBS.bloom), ph: rand(0, 6) }
    })
    this.petals = []
    return 0.5 + (mains.length - 1) * 0.28 + 0.6 + 0.9
  },
  ease: () => 1,
  colorAt(k, i, L, pal, tn) { return k < 0.2 ? pal.spark : finalColor(L, pal, i, tn) },
  underlay({ ctx, t, total, L, box }) {
    const a = fadeInOut(t, total, 0.3, 0.6)
    if (a <= 0) return
    ctx.globalAlpha = a
    // the whitewashed wall with a blue trim
    ctx.fillStyle = SBS.wall; box(0, SCENE_TOP, L.cols, L.rows - SCENE_TOP)
    ctx.fillStyle = SBS.speck
    for (let x = 0; x < L.cols; x += 0.5) for (let y = SCENE_TOP; y < L.rows; y += 0.5) if (hash(x * 2, y * 2, 3) < 70) box(x, y, 0.5, 0.5)
    ctx.fillStyle = SBS.trim; box(0, SCENE_TOP, L.cols, 0.35)
    ctx.fillStyle = SBS.step; box(0, GROUND, L.cols, L.rows - GROUND)
    // the doors: arched, studded, swinging open
    for (const dr of this.doors) {
      const [main, light, dark] = dr.colors
      const w = dr.x1 - dr.x0, r = w / 2, top = PAD_T - 1.6
      const archInset = (y) => (y < top + r ? r - Math.sqrt(Math.max(0, r * r - (top + r - y) ** 2)) : 0)
      const open = inOut(clamp01((t - dr.at) / 0.5))
      // frame and dark interior
      for (let y = top - 0.4; y < GROUND; y += 0.25) {
        const ins = Math.max(0, archInset(y + 0.4) - 0.4)
        ctx.fillStyle = light; box(dr.x0 - 0.4 + ins, y, w + 0.8 - 2 * ins, 0.25)
      }
      for (let y = top; y < GROUND; y += 0.25) {
        const ins = archInset(y)
        ctx.fillStyle = open > 0 ? SBS.interior : main
        box(dr.x0 + ins, y, w - 2 * ins, 0.25)
      }
      ctx.globalAlpha = a
      // the two leaves narrowing towards the hinges as they open
      const leafW = (w / 2) * (1 - open * 0.85)
      for (const side of [0, 1]) {
        const lx = side === 0 ? dr.x0 : dr.x1 - leafW
        for (let y = top; y < GROUND; y += 0.25) {
          const ins = archInset(y)
          const x0 = Math.max(lx, dr.x0 + ins), x1 = Math.min(lx + leafW, dr.x1 - ins)
          if (x1 <= x0) continue
          ctx.fillStyle = open > 0.5 ? dark : main
          box(x0, y, x1 - x0, 0.25)
        }
        if (open < 0.9) {
          // studs: an inner arch line, a centre line and a row across
          ctx.fillStyle = '#1A1A1A'
          const sx = (u) => lx + u * leafW
          for (let y = top + r * 0.9; y < GROUND - 0.8; y += 1.1) box(sx(0.5) - 0.15, y, 0.3, 0.3)
          for (let u = 0.15; u < 0.9; u += 0.22) box(sx(u) - 0.15, top + GH * 0.55, 0.3, 0.3)
          ctx.fillStyle = '#F4F4F4'
          for (let y = top + r * 0.9; y < GROUND - 0.8; y += 1.1) box(sx(0.5) - 0.1, y, 0.12, 0.12)
        }
      }
      if (open < 0.3) {
        ctx.fillStyle = '#E8B93A'
        box(dr.x0 + w / 2 + 0.5, PAD_T + 6.5, 0.4, 0.9); box(dr.x0 + w / 2 + 0.35, PAD_T + 7.3, 0.7, 0.35)
      }
    }
    // bougainvillea spilling over the corners
    for (const b of this.blooms) {
      const sway = Math.sin(t * 2 + b.ph) * 0.12
      ctx.fillStyle = SBS.leaf; box(b.x + sway - b.r * 0.6, b.y + b.r * 0.4, b.r * 0.8, b.r * 0.5)
      disc(ctx, box, b.x + sway, b.y, b.r, b.c, 0.25)
    }
    ctx.globalAlpha = 1
  },
  overlay({ ctx, t, dt, total, L, box }) {
    const a = fadeInOut(t, total, 0.3, 0.6)
    if (a <= 0) return
    // jasmine flowers drifting down
    if (t < total - 0.6 && Math.random() < dt * 3.5) this.petals.push({ x: rand(0, L.cols), y: SCENE_TOP, vy: rand(1.5, 2.8), ph: rand(0, 6), life: 0 })
    ctx.globalAlpha = a
    for (let j = this.petals.length - 1; j >= 0; j--) {
      const q = this.petals[j]
      q.life += dt; q.y += q.vy * dt
      if (q.y > GROUND) { this.petals.splice(j, 1); continue }
      const x = q.x + Math.sin(q.life * 2 + q.ph) * 1.2
      ctx.fillStyle = '#FFFFFF'
      box(x - 0.25, q.y - 0.5, 0.5, 0.25); box(x - 0.25, q.y + 0.25, 0.5, 0.25); box(x - 0.5, q.y - 0.25, 0.25, 0.5); box(x + 0.25, q.y - 0.25, 0.25, 0.5)
      ctx.fillStyle = '#F2C14E'; box(x - 0.12, q.y - 0.12, 0.25, 0.25)
    }
    // a cat strolling past the doors
    if (this.cat) {
      const x = this.cat > 0 ? -6 + t * 7 : L.cols + 1 - t * 7
      drawSprite(ctx, box, CAT[Math.floor(t * 6) % 2], { K: '#1E1A18' }, x, GROUND - 3, 0.5, this.cat < 0)
    }
    ctx.globalAlpha = 1
  },
}

export default sidibousaid
