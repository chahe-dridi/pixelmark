// Pixel wordmark build: Windows XP: boot, desktop, install wizard. Loaded on demand by the engine.

import { GROUND, SCENE_TOP, clamp01, disc, drawSprite, drawText, hash, inOut, lerp, outBack, rand, textWidth, PAD_T } from '../engine/kit'

// ═══ Windows XP: boot, desktop, install wizard ═══════════════════════════
const XP_CUBE = ['.....TT.....', '...TTTTTT...', '.TTTTTTTTTT.', 'LTTTTTTTTTTR', 'LLLTTTTTTRRR', 'LLLLLTTRRRRR',
  'LLLLLLRRRRRR', 'LLLLLLRRRRRR', 'LLLLLLRRRRRR', '.LLLLLRRRRR.', '...LLLRRR...', '.....LR.....']
const XP_CUBE_PAL = { T: '#E05C28', L: '#F0EBE3', R: '#8A5A3A' }
const XP_CURSOR = ['#.........', '##........', '#W#.......', '#WW#......', '#WWW#.....', '#WWWW#....', '#WWWWW#...', '#WWWWWW#..',
  '#WWWWWWW#.', '#WWWWW####', '#WW#WW#...', '#W#.#WW#..', '##..#WW#..', '#....#WW#.', '.....####.']
const XP = {
  boot: 1.25, desk: 1.25, open: 1.65, prog0: 1.95, prog1: 2.7, arrive: 2.8, click: 2.9, close: 2.95, dissolve: 3.0, spread: 0.6,
}
const hillY = (x) => GROUND - 3.6 - 2.3 * Math.sin(x * 0.055 + 0.8) - 1.1 * Math.sin(x * 0.16 + 2)

const xpboot = {
  name: 'xpboot',
  setup(L, S) {
    for (let i = 0; i < L.N; i++) {
      S.SX[i] = L.X[i]; S.SY[i] = L.Y[i]
      // each pixel arrives exactly where its patch of desktop dissolves
      S.DL[i] = XP.dissolve + (hash(L.X[i], L.Y[i], 7) / 1000) * XP.spread; S.DU[i] = 0.12
    }
    this.clouds = [[rand(8, 20), PAD_T + 1.5, 2.2], [rand(30, 45), PAD_T + 0.8, 1.6], [rand(55, 70), PAD_T + 2, 2.6]]
    return XP.dissolve + XP.spread + 0.45
  },
  ease: () => 1,
  flash: 0.06,
  underlay({ ctx, t, total, L, box }) {
    const W = L.cols, top = SCENE_TOP, H = L.rows - top
    if (t < XP.boot + 0.3) {
      // boot screen: black, the logo, and the three blue blocks gliding
      const a = clamp01(t / 0.15) * (1 - clamp01((t - XP.boot) / 0.3))
      ctx.globalAlpha = a
      ctx.fillStyle = '#000000'; box(0, top, W, H)
      const lx = W / 2 - 12
      drawSprite(ctx, box, XP_CUBE, XP_CUBE_PAL, lx, PAD_T + 0.6, 0.5)
      drawText(ctx, box, L.label.slice(0, 8), lx + 7.5, PAD_T + 2, 0.7, '#FFFFFF')
      drawText(ctx, box, 'XP', lx + 7.5 + textWidth(L.label.slice(0, 8), 0.7) + 0.6, PAD_T + 1.2, 0.45, '#F28C28')
      const BW = 18, bx = W / 2 - BW / 2, by = PAD_T + 8.2
      ctx.fillStyle = '#B9B9B9'
      box(bx + 0.4, by, BW - 0.8, 0.15); box(bx + 0.4, by + 2.05, BW - 0.8, 0.15); box(bx, by + 0.4, 0.15, 1.4); box(bx + BW - 0.15, by + 0.4, 0.15, 1.4)
      const g = ((t * 13) % (BW + 7)) - 7
      for (let b = 0; b < 3; b++) {
        const x = bx + g + b * 2.2
        if (x < bx + 0.5 || x > bx + BW - 2) continue
        ctx.fillStyle = '#A9C4FF'; box(x, by + 0.5, 1.6, 0.6)
        ctx.fillStyle = '#2B5FE0'; box(x, by + 1.1, 1.6, 0.6)
      }
      ctx.globalAlpha = 1
    }
    if (t < XP.desk) return
    // the desktop: sky, Bliss-like hill, clouds, taskbar
    const a = clamp01((t - XP.desk) / 0.3)
    const dissolving = t > XP.dissolve
    ctx.globalAlpha = a
    const sky = (y) => {
      const k = clamp01((y - top) / (GROUND - top))
      const c0 = [31, 95, 208], c1 = [150, 196, 244]
      return `rgb(${Math.round(lerp(c0[0], c1[0], k))},${Math.round(lerp(c0[1], c1[1], k))},${Math.round(lerp(c0[2], c1[2], k))})`
    }
    const cellColor = (x, y) => {
      if (y >= L.rows - 1.2) return y < L.rows - 1.05 ? '#4A86F0' : x < 6.5 ? '#3A9B3A' : x > W - 7 ? '#1A8DEB' : '#2458D6'
      const hy = hillY(x + 0.5)
      if (y + 0.5 >= hy) return y + 0.5 - hy < 1.2 ? '#62C23E' : y + 0.5 - hy < 3 ? '#4FAE34' : '#3C8F27'
      return sky(y + 0.5)
    }
    if (!dissolving) {
      for (let y = top; y < L.rows; y++) { ctx.fillStyle = sky(y + 0.5); box(0, y, W, 1) }
      for (let x = 0; x < W; x += 0.5) {
        const hy = hillY(x + 0.25)
        ctx.fillStyle = '#62C23E'; box(x, hy, 0.5, 1.2)
        ctx.fillStyle = '#4FAE34'; box(x, hy + 1.2, 0.5, 1.8)
        ctx.fillStyle = '#3C8F27'; box(x, hy + 3, 0.5, L.rows - hy - 3)
      }
      for (const [cx, cy, r] of this.clouds) {
        disc(ctx, box, cx + t * 0.6, cy, r, 'rgba(255,255,255,0.85)')
        disc(ctx, box, cx + t * 0.6 + r * 1.2, cy + 0.4, r * 0.8, 'rgba(255,255,255,0.85)')
      }
      ctx.fillStyle = '#2458D6'; box(0, L.rows - 1.2, W, 1.2)
      ctx.fillStyle = '#4A86F0'; box(0, L.rows - 1.2, W, 0.15)
      ctx.fillStyle = '#1A8DEB'; box(W - 7, L.rows - 1.05, 7, 1.05)
      ctx.fillStyle = '#3A9B3A'; box(0, L.rows - 1.05, 6.5, 1.05)
      drawText(ctx, box, 'START', 0.9, L.rows - 0.95, 0.17, '#FFFFFF')
      drawText(ctx, box, '9:41', W - 5, L.rows - 0.95, 0.17, '#FFFFFF')
      // two desktop icons
      ctx.fillStyle = '#DCE6F4'; box(1.2, PAD_T, 2.4, 1.8); ctx.fillStyle = '#3A6FD8'; box(1.45, PAD_T + 0.25, 1.9, 1.1)
      ctx.fillStyle = '#9EB4C8'; box(1.7, PAD_T + 4, 1.6, 2); ctx.fillStyle = '#C9D8E4'; box(1.5, PAD_T + 3.8, 2, 0.4)
    } else {
      // dissolve cell by cell, revealing the wordmark underneath
      for (let y = Math.floor(top); y < L.rows; y++) {
        for (let x = 0; x < W; x++) {
          if (t > XP.dissolve + (hash(x, y, 7) / 1000) * XP.spread) continue
          ctx.fillStyle = cellColor(x, y); box(x, y, 1, 1)
        }
      }
    }
    ctx.globalAlpha = 1
  },
  overlay({ ctx, t, L, box }) {
    if (t < XP.open || t > XP.close + 0.2) return
    const W = L.cols
    const ww = 40, wh = 10.6, wx = W / 2 - ww / 2, wy = PAD_T + 0.8
    const s = t < XP.close ? 0.6 + 0.4 * outBack(clamp01((t - XP.open) / 0.18)) : 1 - clamp01((t - XP.close) / 0.15)
    const cx = wx + ww / 2, cy = wy + wh / 2
    const B = (x, y, w, h, color) => { ctx.fillStyle = color; box(cx + (wx + x - cx) * s, cy + (wy + y - cy) * s, w * s, h * s) }
    // window frame, Luna title bar and buttons
    B(-0.3, -0.3, ww + 0.6, wh + 0.6, '#0831D9')
    B(0, 0, ww, 0.5, '#3D95FF'); B(0, 0.5, ww, 1, '#0A5FEC'); B(0, 1.5, ww, 0.35, '#0446C8')
    B(ww - 1.9, 0.3, 1.4, 1.25, '#E2493B'); B(ww - 3.6, 0.3, 1.4, 1.25, '#2F6FF0'); B(ww - 5.3, 0.3, 1.4, 1.25, '#2F6FF0')
    B(0, 1.85, ww, wh - 1.85, '#ECE9D8')
    if (s < 0.98) return
    const X = (x) => wx + x, Y = (y) => wy + y
    // white X on the close button, glyphs on the others
    ctx.fillStyle = '#FFFFFF'
    for (let k = 0; k < 4; k++) { box(X(ww - 1.6 + k * 0.22), Y(0.55 + k * 0.2), 0.22, 0.22); box(X(ww - 0.94 - k * 0.22), Y(0.55 + k * 0.2), 0.22, 0.22) }
    box(X(ww - 3.3), Y(1.15), 0.8, 0.18); box(X(ww - 5.0), Y(0.6), 0.8, 0.7)
    ctx.fillStyle = '#2F6FF0'; box(X(ww - 4.85), Y(0.8), 0.5, 0.35)
    drawText(ctx, box, `INSTALLING ${L.label}`, X(0.7), Y(0.45), 0.2, '#FFFFFF', '#0A2A8A')
    drawText(ctx, box, `PLEASE WAIT WHILE SETUP INSTALLS ${L.label}`, X(1.5), Y(2.9), 0.18, '#1E1E1E')
    // the progress bar, green chunks filling up
    const prog = clamp01((t - XP.prog0) / (XP.prog1 - XP.prog0))
    ctx.fillStyle = '#7F9DB9'; box(X(1.5), Y(4.6), ww - 3, 1.5)
    ctx.fillStyle = '#FFFFFF'; box(X(1.65), Y(4.75), ww - 3.3, 1.2)
    const chunks = Math.floor(prog * 34)
    for (let k = 0; k < chunks; k++) {
      ctx.fillStyle = '#37B337'; box(X(1.85 + k * 1.05), Y(4.9), 0.85, 0.9)
      ctx.fillStyle = '#8BE08B'; box(X(1.85 + k * 1.05), Y(4.9), 0.85, 0.25)
    }
    drawText(ctx, box, `${Math.round(prog * 100)}%`, X(1.5), Y(6.6), 0.2, '#1E1E1E')
    // Cancel / Finish buttons; Finish lights up when done
    const fx = ww - 7, fy = wh - 2.4
    ctx.fillStyle = '#003C74'; box(X(ww - 13.6), Y(fy), 5.6, 1.6); box(X(fx), Y(fy), 5.6, 1.6)
    ctx.fillStyle = '#F4F3EE'; box(X(ww - 13.45), Y(fy + 0.15), 5.3, 1.3)
    const pressed = t > XP.click && t < XP.click + 0.08
    ctx.fillStyle = prog >= 1 ? (pressed ? '#E3A13A' : '#F8B33C') : '#F4F3EE'; box(X(fx + 0.15), Y(fy + 0.15), 5.3, 1.3)
    ctx.fillStyle = '#F4F3EE'; box(X(fx + 0.4), Y(fy + 0.4), 4.8, 0.8)
    drawText(ctx, box, 'CANCEL', X(ww - 12.4), Y(fy + 0.55), 0.18, '#1E1E1E')
    drawText(ctx, box, 'FINISH', X(fx + 1.1), Y(fy + 0.55), 0.18, '#1E1E1E')
    // the mouse glides over and clicks Finish
    const m = inOut(clamp01((t - 2.2) / (XP.arrive - 2.2)))
    const mx = lerp(W * 0.86, X(fx + 3.2), m), my = lerp(L.rows - 1.5, Y(fy + 0.8), m)
    drawSprite(ctx, box, XP_CURSOR, { '#': '#000000', W: '#FFFFFF' }, mx + (pressed ? 0.1 : 0), my + (pressed ? 0.1 : 0), 0.3)
  },
}

export default xpboot
