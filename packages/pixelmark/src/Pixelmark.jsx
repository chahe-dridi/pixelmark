import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { PAD_X, PAD_T } from './engine/kit'
import { normalizeText, wordmarkSize } from './engine/glyphs'

// The wordmark canvas. This file stays tiny so it can ship in the first paint:
// the canvas is sized and in the layout straight away, and the engine (plus
// any game build it plays) is a separate chunk that loads in an effect, so
// it is also safe to server-render.

const Pixelmark = forwardRef(function Pixelmark(
  {
    text = 'PIXELMARK',
    accent = 'none',
    palette = 'ocean',
    tone = 'auto',
    build,
    builds,
    games = true,
    variants,
    colorStyle,
    label,
    hold = 6,
    loop = true,
    interactive = true,
    ambient = true,
    maxWidth = 1100,
    bleed = false,
    onBuild,
    className = '',
    style,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const onBuildRef = useRef(onBuild)
  onBuildRef.current = onBuild

  const glyphText = useMemo(() => normalizeText(text) || ' ', [text])
  const { cols, rows } = wordmarkSize(glyphText)
  const mw = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth

  useImperativeHandle(ref, () => ({
    next: () => engineRef.current?.next(),
    canvas: canvasRef.current,
  }), [])

  // Objects and arrays are compared by value, so inline props don't restart
  // the engine on every render (a function accent should be memoized)
  const paletteKey = typeof palette === 'string' ? palette : JSON.stringify(palette)
  const buildsKey = Array.isArray(builds) ? builds.join(',') : ''
  const accentKey = Array.isArray(accent) ? accent.join(',') : accent
  const variantsKey = variants ? JSON.stringify(variants) : ''

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let cancelled = false
    import('./engine/engine.js').then(({ createEngine }) => {
      if (cancelled || !canvasRef.current) return
      engineRef.current = createEngine(canvasRef.current, {
        text: glyphText,
        accent: Array.isArray(accent) ? accent : accentKey,
        palette: typeof palette === 'string' ? palette : JSON.parse(paletteKey),
        tone, build, builds: buildsKey ? buildsKey.split(',') : null, games, colorStyle, label, hold,
        variants: variantsKey ? JSON.parse(variantsKey) : undefined,
        loop, interactive, ambient, reduced,
        onBuild: (name) => onBuildRef.current?.(name),
      })
    }).catch(() => { /* chunk failed to load: the canvas stays blank, the aria-label stays */ })
    return () => {
      cancelled = true
      engineRef.current?.destroy()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glyphText, accentKey, paletteKey, tone, build, buildsKey, variantsKey, games, colorStyle, label, hold, loop, interactive, ambient])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={ariaLabel ?? String(text)}
      className={className}
      style={{
        display: 'block',
        width: '100%',
        maxWidth,
        aspectRatio: `${cols} / ${rows}`,
        // bleed: pull the blank padding columns/rows out, so the letters line
        // up with the text around them (margins in % resolve against width)
        ...(bleed && {
          marginInlineStart: `calc(min(100%, ${mw}) * ${-PAD_X / cols})`,
          marginTop: `calc(min(100%, ${mw}) * ${-(PAD_T - 1) / cols})`,
          marginInlineEnd: 'auto',
        }),
        cursor: interactive ? 'pointer' : undefined,
        imageRendering: 'pixelated',
        ...style,
      }}
      {...rest}
    />
  )
})

export default Pixelmark
