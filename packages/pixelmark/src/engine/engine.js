import { GH, PAD_X, PAD_T, PAD_B, hash, clamp01, pick } from './kit'
import { GAME_BUILDS } from '../registry'
import { GLYPHS, LINE_GAP, lineWidth, wordmarkSize } from './glyphs'
import { BUILDS, DESIGNS, EXITS } from './classic'
import { resolvePalette } from './palettes'

// The pixelmark engine. Draws a pixel-art wordmark on a single <canvas>: the
// word builds itself, holds for a few seconds (with a light sweep, sparkles
// and pixels that dodge the pointer), takes itself apart and rebuilds with a
// different build animation and colour style each time.
//
// Performance: one canvas, a few hundred fillRects per frame, no framework
// re-renders. Frames only run while the canvas is on screen and the tab is
// visible; the idle hold is throttled to 20–30fps. Reduced-motion visitors
// get the finished wordmark, drawn once.

// Which characters take the accent colour. `accent` is 'none', 'all',
// 'first' (the first word), 'rest' (every word after the first), 'last'
// (the last word), an array of character indices, or (char, index) => bool.
const accentTest = (accent, chars) => {
  if (typeof accent === 'function') return (ci) => !!accent(chars[ci], ci)
  if (Array.isArray(accent)) { const set = new Set(accent); return (ci) => set.has(ci) }
  const isGap = (c) => c === ' ' || c === '\n'
  const firstGap = chars.findIndex(isGap)
  const lastGap = chars.findLastIndex(isGap)
  if (accent === 'all') return () => true
  if (accent === 'rest') return (ci) => firstGap >= 0 && ci > firstGap
  if (accent === 'first') return (ci) => firstGap < 0 || ci < firstGap
  if (accent === 'last') return (ci) => ci > lastGap
  return () => false
}

const KEY = (x, y) => x * 1024 + y

export function layout(text, accent = 'none', label) {
  const xs = [], ys = [], gys = [], cis = [], accs = [], cx0 = [], cx1 = [], cy0 = []
  const chars = [...text]
  const isAcc = accentTest(accent, chars)
  const { cols, rows } = wordmarkSize(text)
  const lines = text.split('\n')
  let ci = 0 // index into chars (accent test)
  let gi = 0 // index of the drawn glyph (CI, CX0…)
  lines.forEach((lineText, li) => {
    const line = [...lineText]
    const top = PAD_T + li * (GH + LINE_GAP)
    // every line is centred inside the widest one
    let x = PAD_X + Math.floor((cols - PAD_X * 2 - lineWidth(lineText)) / 2)
    line.forEach((ch, k) => {
      const g = GLYPHS[ch]
      if (g) {
        cx0.push(x); cx1.push(x + g[0].length - 1); cy0.push(top)
        g.forEach((row, gy) => {
          for (let c = 0; c < row.length; c++) {
            if (row[c] !== '#') continue
            xs.push(x + c); ys.push(top + gy); gys.push(gy); cis.push(gi); accs.push(isAcc(ci) ? 1 : 0)
          }
        })
        x += g[0].length + (k < line.length - 1 ? (line[k + 1] === '.' ? 1 : 2) : 0)
        gi++
      }
      ci++
    })
    ci++ // the newline
  })
  // Drop shadow one pixel down-right, wherever it isn't covered by a letter
  const filled = new Set(xs.map((v, i) => KEY(v, ys[i])))
  const shx = [], shy = []
  xs.forEach((v, i) => {
    const key = KEY(v + 1, ys[i] + 1)
    if (!filled.has(key)) { filled.add(key); shx.push(v + 1); shy.push(ys[i] + 1) }
  })
  return {
    N: xs.length, cols, rows, chars: gi, lines: lines.length, CX0: cx0, CX1: cx1, CY0: cy0, MIDY: (PAD_T + rows - PAD_B) / 2,
    X: Int16Array.from(xs), Y: Int16Array.from(ys), GY: Uint8Array.from(gys), CI: Uint16Array.from(cis), ACC: Uint8Array.from(accs),
    SHX: Int16Array.from(shx), SHY: Int16Array.from(shy),
    // Short text some game builds print in their scenes (the XP installer, the
    // Street Fighter health bar, the Marauder's Map footprints)
    label: (label || lines[0].split(' ')[0] || 'PIXELMARK').toUpperCase(),
  }
}

// Game and story builds (Mario, Sonic, Donkey Kong, Dragon Ball…): one chunk
// each, fetched only when about to play. They draw a floor under one line of
// letters, so multi-line wordmarks only play the classic builds.
const fetched = {}
export function loadBuild(name) {
  if (!fetched[name]) fetched[name] = GAME_BUILDS[name]().then((m) => m.default)
  return fetched[name]
}
const pickOther = (list, cur) => {
  if (list.length < 2) return list[0]
  let n
  do n = pick(list); while (n === cur)
  return n
}
const byName = (list, name) => (typeof name === 'number' ? list[name] : list.find((d) => d.name === name))

/**
 * Start a wordmark on `canvas`. `text` must already be normalized (see
 * normalizeText). Returns a controller: { next(), destroy() }.
 */
export function createEngine(canvas, opts) {
  const { text, loop = true, interactive = true, ambient = true, tone = 'auto', reduced = false, accent = 'none' } = opts
  const L = layout(text, accent, opts.label)
  const ctx = canvas.getContext('2d')
  const S = { SX: new Float32Array(L.N), SY: new Float32Array(L.N), DL: new Float32Array(L.N), DU: new Float32Array(L.N) }
  const SW = new Float32Array(L.N) // per-pixel swirl direction
  const OX = new Float32Array(L.N), OY = new Float32Array(L.N) // pointer offsets
  const FT = new Uint8Array(L.N) // final tone per pixel
  // Pixels with nothing above them: where drifting particles lift off
  const occupied = new Set(Array.from(L.X, (x, i) => KEY(x, L.Y[i])))
  const TOP = []
  for (let i = 0; i < L.N; i++) if (!occupied.has(KEY(L.X[i], L.Y[i] - 1))) TOP.push(i)
  const coarse = window.matchMedia?.('(pointer: coarse)').matches
  const holdInterval = coarse ? 50 : 33

  let pal, p = 1, offX = 0, offY = 0
  // Builds come out of a shuffled bag, so none repeats until all have
  // played. The bag holds the classic builds (objects) and the names of
  // game builds (strings), whose chunks are fetched on demand: the next one
  // is prefetched while the current one plays. `build` pins one build;
  // `builds` limits the bag to the names listed.
  const singleLine = L.lines === 1
  const allow = Array.isArray(opts.builds) && opts.builds.length ? new Set(opts.builds) : null
  const isAllowed = (name) => !allow || allow.has(name)
  const canGame = (name) => !!GAME_BUILDS[name] && singleLine && !reduced
  const forced = opts.build && (BUILDS.some((b) => b.name === opts.build) || canGame(opts.build)) ? opts.build : null
  const games = (opts.games ?? true) && singleLine && !reduced ? Object.keys(GAME_BUILDS).filter(isAllowed) : []
  let classics = BUILDS.filter((b) => isAllowed(b.name))
  if (!classics.length && !games.length) classics = BUILDS
  const fixedDesign = opts.colorStyle != null ? byName(DESIGNS, opts.colorStyle) : null
  const HOLD = Math.max(0.5, opts.hold ?? 6), HOLD_FIRST = HOLD + 1, GAP = 0.15
  const loaded = new Map()
  let bag = [], lastEntry = null
  let build = null, cycles = 0, dead = false
  let exit = pick(EXITS)
  let design = fixedDesign || (reduced ? DESIGNS[1] : pick(DESIGNS))
  let phase = 'idle', t = 0, total = 0, seed = Math.floor(Math.random() * 1e6)
  const fetchGame = (name) => loadBuild(name).then((b) => { loaded.set(name, b); return b })
  function refill() {
    bag = [...classics, ...games].filter((e) => e !== lastEntry || classics.length + games.length < 2).sort(() => Math.random() - 0.5)
  }
  function prefetch() {
    if (forced) return
    if (!bag.length) refill()
    const e = bag[bag.length - 1]
    if (typeof e === 'string' && !loaded.has(e)) fetchGame(e).catch(() => {})
  }
  function nextBuild() {
    if (forced) {
      if (loaded.has(forced)) return loaded.get(forced)
      const core = BUILDS.find((b) => b.name === forced)
      if (core) return core
    }
    for (let tries = 0; tries < 60; tries++) {
      if (!bag.length) refill()
      const e = bag.pop()
      if (typeof e !== 'string') { lastEntry = e; return e }
      if (loaded.has(e)) { lastEntry = e; return loaded.get(e) }
      // not downloaded yet: start fetching and let it play a later turn
      fetchGame(e).catch(() => {})
      bag.unshift(e)
    }
    return pick(classics.length ? classics : BUILDS)
  }
  // If the very first build is a game, wait briefly for its chunk
  let ready = true
  if (!reduced) {
    refill()
    const top = bag[bag.length - 1]
    const first = forced ? (GAME_BUILDS[forced] ? forced : null) : typeof top === 'string' ? top : null
    if (first) {
      ready = false
      fetchGame(first).catch(() => {}).finally(() => { ready = true; sync() })
      if (!forced) setTimeout(() => { ready = true; sync() }, 600)
    }
  }
  let raf = 0, running = false, visible = false, last = 0, lastDraw = 0, fno = 0
  let pointer = null, offsetsLive = false, held = 0
  const parts = []

  // Light or dark: an explicit tone wins; otherwise a `dark`/`light` class
  // or data-theme on <html>, and failing that the OS colour scheme.
  const darkQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
  function readTheme() {
    let light
    if (tone === 'light' || tone === 'dark') light = tone === 'light'
    else {
      const root = document.documentElement
      const theme = root.dataset.theme || root.getAttribute('data-mode')
      if (root.classList.contains('dark') || theme === 'dark') light = false
      else if (root.classList.contains('light') || theme === 'light') light = true
      else light = !darkQuery?.matches
    }
    pal = resolvePalette(opts.palette, light)
  }

  function computeTones() {
    for (let i = 0; i < L.N; i++) {
      const gy = L.GY[i]
      const fn = L.ACC[i] && design.acc ? design.acc : design.tone
      FT[i] = fn(L.X[i], gy, L.CI[i], L.chars, seed)
    }
  }

  const colorOf = (i, tn) => (L.ACC[i] ? pal.acc : pal.ink)[tn]

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth
    if (!w) return
    const h = (w * L.rows) / L.cols
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    p = Math.max(1, Math.floor(canvas.width / L.cols))
    offX = Math.floor((canvas.width - p * L.cols) / 2)
    offY = Math.floor((canvas.height - p * L.rows) / 2)
  }

  function rect(x, y, s, sy = s) {
    ctx.fillRect(offX + x * p + (p * (1 - s)) / 2, offY + y * p + (p * (1 - sy)) / 2, p * s, p * sy)
  }

  // A hairline from (x0, y0) to (x1, y1) in grid units: the slash streaks
  function line(x0, y0, x1, y1, color, alpha) {
    const w = Math.max(1, Math.round(p * 0.14))
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.fillRect(
      offX + Math.min(x0, x1) * p, offY + Math.min(y0, y1) * p,
      Math.max(w, Math.abs(x1 - x0) * p), Math.max(w, Math.abs(y1 - y0) * p),
    )
    ctx.globalAlpha = 1
  }

  // A grid-unit rectangle snapped to device pixels, so neighbours tile
  // without hairline seams (used by sprites and scenery)
  function box(x, y, w, h) {
    const X0 = Math.round(offX + x * p), Y0 = Math.round(offY + y * p)
    ctx.fillRect(X0, Y0, Math.round(offX + (x + w) * p) - X0, Math.round(offY + (y + h) * p) - Y0)
  }

  function startBuild() {
    build = nextBuild()
    cycles++
    prefetch()
    for (let i = 0; i < L.N; i++) { SW[i] = Math.random() < 0.5 ? -1 : 1; OX[i] = 0; OY[i] = 0 }
    // scenes take their variant choices (see the `variants` option)
    total = build.setup(L, S, opts.variants?.[build.name] || {})
    computeTones()
    phase = 'build'; t = 0
    if (opts.onBuild) opts.onBuild(build.name)
  }

  function nextCycle() {
    seed = Math.floor(Math.random() * 1e6)
    exit = pickOther(EXITS, exit)
    if (!fixedDesign) design = pickOther(DESIGNS, design)
    startBuild()
  }

  function drawShadows(alpha) {
    if (alpha <= 0) return
    ctx.globalAlpha = alpha
    ctx.fillStyle = pal.shadow
    for (let j = 0; j < L.SHX.length; j++) rect(L.SHX[j], L.SHY[j], 1)
    ctx.globalAlpha = 1
  }

  function drawFinal(shine) {
    drawShadows(1)
    for (let i = 0; i < L.N; i++) {
      let tn = FT[i]
      if (shine !== null) {
        const d = Math.abs(L.X[i] + (L.GY[i]) * 0.5 - shine)
        if (d < 2.5) tn = Math.max(0, tn - (d < 1.2 ? 2 : 1))
      }
      ctx.fillStyle = colorOf(i, tn)
      rect(L.X[i] + OX[i], L.Y[i] + OY[i], 1)
    }
  }

  function drawBuild(dt) {
    const args = { ctx, t, dt, total, L, pal, p, rect, line, box, px: (x) => offX + x * p, py: (y) => offY + y * p }
    if (build.underlay) build.underlay(args)
    drawShadows(clamp01((t - (total - 0.35)) / 0.35))
    for (let i = 0; i < L.N; i++) {
      let k = (t - S.DL[i]) / S.DU[i]
      let size = 1, alpha = 1, sizeY
      if (k <= 0) {
        const w = build.waiting && build.waiting(t)
        if (!w) continue
        alpha = w.alpha; size = w.size; k = 0
      } else {
        if (k > 1) k = 1
        if (build.size) size = build.size(k)
        if (build.sizeY) sizeY = build.sizeY(k)
        if (build.alpha) alpha = build.alpha(k)
      }
      const e = build.ease(k)
      let x = S.SX[i] + (L.X[i] - S.SX[i]) * e
      let y = S.SY[i] + (L.Y[i] - S.SY[i]) * e
      if (build.offsetY && k > 0 && k < 1) y += build.offsetY(k)
      if (build.swirl && k < 1) {
        const sw = Math.sin(k * Math.PI) * build.swirl * SW[i] * (1 - e)
        x += -(S.SY[i] - L.Y[i]) * sw
        y += (S.SX[i] - L.X[i]) * sw * 0.45
      }
      let color
      if (build.colorAt) {
        color = build.colorAt(k, i, L, pal, FT[i], t)
      } else if (build.flash && k >= 1 && t - S.DL[i] - S.DU[i] < build.flash) {
        color = pal.spark
      } else if (build.flicker && k < 0.85) {
        const h = hash(i, Math.floor(t * 14), seed)
        color = (h & 1 ? pal.acc : pal.ink)[h % 5]
      } else if (build.spark && k < 1) {
        color = pal.spark
      } else {
        color = colorOf(i, FT[i])
      }
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      rect(x, y, size, sizeY)
    }
    ctx.globalAlpha = 1
    if (build.name === 'scan') drawScanNoise()
    if (build.overlay) build.overlay(args)
  }

  // The dithered band running just ahead of the scan front
  function drawScanNoise() {
    const f = (t / build.sweep) * L.cols
    const all = pal.ink.concat(pal.acc)
    for (let c = Math.floor(f); c <= f + 9; c++) {
      if (c < 0 || c >= L.cols) continue
      const d = c - f
      const prob = 720 - d * 75
      for (let r = PAD_T - 1; r < L.rows - PAD_B + 1; r++) {
        const h = hash(c, r, fno)
        if (h > prob) continue
        ctx.fillStyle = all[h % all.length]
        rect(c, r, h % 3 === 0 ? 0.9 : 0.55)
      }
    }
  }

  function drawExit() {
    drawShadows(1 - clamp01(t / 0.2))
    for (let i = 0; i < L.N; i++) {
      const k = clamp01((t - S.DL[i]) / S.DU[i])
      if (k >= 1) continue
      const e = exit.ease(k)
      ctx.globalAlpha = exit.shrink ? 1 : 1 - k
      ctx.fillStyle = colorOf(i, FT[i])
      rect(L.X[i] + (S.SX[i] - L.X[i]) * e, L.Y[i] + (S.SY[i] - L.Y[i]) * e, exit.shrink ? 1 - k : 1 - k * 0.4)
    }
    ctx.globalAlpha = 1
  }

  // A few loose pixels drifting up off the letters
  function drawParticles(dt) {
    if (!ambient) return
    // Spawn only once the letters stand, from pixels on a top edge
    if (phase === 'hold' && parts.length < 12 && Math.random() < dt * 5) {
      const i = TOP[Math.floor(Math.random() * TOP.length)]
      parts.push({ x: L.X[i], y: L.Y[i] - 1, vy: 0.9 + Math.random() * 1.4, life: 0, max: 1.4 + Math.random() * 1.4, acc: L.ACC[i], tn: Math.floor(Math.random() * 2) })
    }
    for (let j = parts.length - 1; j >= 0; j--) {
      const q = parts[j]
      q.life += dt; q.y -= q.vy * dt
      if (q.life >= q.max) { parts.splice(j, 1); continue }
      // Solid colour for most of its life, then a quick fade: crisp, not grey
      const k = q.life / q.max
      ctx.globalAlpha = Math.min(1, k * 8) * (1 - k ** 4)
      ctx.fillStyle = (q.acc ? pal.acc : pal.ink)[q.tn]
      rect(Math.round(q.x), Math.round(q.y), 1)
    }
    ctx.globalAlpha = 1
  }

  function drawSparkles() {
    const n = 3
    ctx.fillStyle = pal.spark
    for (let s = 0; s < n; s++) {
      const slot = Math.floor(held * 2.5) * n + s
      const i = hash(slot, 3, seed) % L.N
      const phaseIn = (held * 2.5) % 1
      ctx.globalAlpha = 0.7 * Math.sin(phaseIn * Math.PI)
      rect(L.X[i] + OX[i], L.Y[i] + OY[i], 1)
    }
    ctx.globalAlpha = 1
  }

  function updatePointer() {
    if (!interactive) return
    const R = 5, R2 = R * R
    let live = false
    for (let i = 0; i < L.N; i++) {
      let tx = 0, ty = 0
      if (pointer) {
        const dx = L.X[i] - pointer.x, dy = L.Y[i] - pointer.y
        const d2 = dx * dx + dy * dy
        if (d2 < R2 && d2 > 0.0001) {
          const d = Math.sqrt(d2), f = (1 - d / R) * 1.8
          tx = (dx / d) * f; ty = (dy / d) * f
        }
      }
      OX[i] += (tx - OX[i]) * 0.22
      OY[i] += (ty - OY[i]) * 0.22
      if (Math.abs(OX[i]) > 0.01 || Math.abs(OY[i]) > 0.01) live = true
    }
    offsetsLive = live
  }

  function render(dt) {
    fno++
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (phase === 'build') drawBuild(dt)
    else if (phase === 'hold') {
      updatePointer()
      const sweepAt = held - 1.4
      const shine = sweepAt > 0 && sweepAt < 1.3 ? (sweepAt / 1.3) * (L.cols + 10) - 5 : null
      drawFinal(shine)
      if (!reduced) drawSparkles()
    } else if (phase === 'exit') drawExit()
    drawParticles(dt)
  }

  function tick(now) {
    raf = 0
    if (!running) return
    // rAF's timestamp can predate the performance.now() taken in start():
    // never let time run backwards (sprite frame indices would go negative)
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
    last = now
    t += dt
    if (phase === 'build' && t >= total) { phase = 'hold'; t = 0; held = 0 }
    else if (phase === 'hold') {
      held += dt
      if (loop && held >= (cycles === 1 ? HOLD_FIRST : HOLD)) { total = exit.setup(L, S); phase = 'exit'; t = 0 }
    } else if (phase === 'exit' && t >= total) { phase = 'gap'; t = 0 }
    else if (phase === 'gap' && t >= GAP) nextCycle()

    const busy = pointer || offsetsLive
    if (phase !== 'hold' || busy || now - lastDraw >= holdInterval) {
      render(Math.max(dt, (now - lastDraw) / 1000 || dt))
      lastDraw = now
    }
    // A wordmark that doesn't loop and has nothing moving can stop drawing
    if (phase === 'hold' && !loop && !ambient && !busy) { running = false; return }
    raf = requestAnimationFrame(tick)
  }

  function start() {
    if (running || reduced) return
    running = true
    last = lastDraw = performance.now()
    raf = requestAnimationFrame(tick)
  }
  function stop() {
    running = false
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }
  function sync() {
    if (dead) return
    if (visible && !document.hidden) {
      if (phase === 'idle') {
        if (!ready) return
        startBuild()
      }
      start()
    } else stop()
  }

  readTheme()
  resize()
  if (reduced) {
    computeTones()
    phase = 'hold'
    render(0)
  }

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync() }, { rootMargin: '80px 0px' })
  io.observe(canvas)
  const ro = new ResizeObserver(() => { resize(); if (!running) render(0) })
  ro.observe(canvas)
  const mo = new MutationObserver(() => { readTheme(); if (!running) render(0) })
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-mode'] })
  const onScheme = () => { readTheme(); if (!running) render(0) }
  darkQuery?.addEventListener?.('change', onScheme)
  document.addEventListener('visibilitychange', sync)

  const toGrid = (e) => {
    const r = canvas.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * L.cols - 0.5, y: ((e.clientY - r.top) / r.height) * L.rows - 0.5 }
  }
  const onMove = (e) => { if (e.pointerType === 'mouse') { pointer = toGrid(e); start() } }
  const onLeave = () => { pointer = null }
  // Skipping ahead (a click, or next()): mid-animation it jumps straight to
  // the next build; a finished wordmark takes itself apart first
  const next = () => {
    if (dead || reduced || phase === 'idle') return
    if (phase === 'hold') { total = exit.setup(L, S); phase = 'exit'; t = 0 }
    else nextCycle()
    start()
  }
  const onClick = next
  if (interactive && !coarse) {
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
  }
  if (interactive) canvas.addEventListener('click', onClick)

  function destroy() {
    dead = true
    stop()
    io.disconnect(); ro.disconnect(); mo.disconnect()
    darkQuery?.removeEventListener?.('change', onScheme)
    document.removeEventListener('visibilitychange', sync)
    canvas.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('pointerleave', onLeave)
    canvas.removeEventListener('click', onClick)
  }

  return { next, destroy }
}
