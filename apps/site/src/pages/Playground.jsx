import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BUILD_NAMES, CATALOG, COLOR_STYLES, Pixelmark } from 'pixelmark'
import CodeBlock from '../components/CodeBlock'
import { Field, PaletteSwatches, Segmented, Toggle, inputClass } from '../components/Controls'
import { SkipIcon } from '../components/Icons'
import { toJsx } from '../lib/code'
import { useDebounced } from '../lib/useDebounced'

const ACCENTS = [
  { value: 'none', label: 'None' },
  { value: 'first', label: 'First word' },
  { value: 'rest', label: 'After first' },
  { value: 'last', label: 'Last word' },
  { value: 'all', label: 'All' },
]
const titleOf = Object.fromEntries(CATALOG.map((b) => [b.name, b.title]))
const selectClass = `${inputClass} cursor-pointer`

export default function Playground() {
  const [params] = useSearchParams()
  const initialBuild = BUILD_NAMES.includes(params.get('build')) ? params.get('build') : ''

  const [text, setText] = useState('SOFTWARE ENGINEER')
  const [accent, setAccent] = useState('rest')
  const [palette, setPalette] = useState('ocean')
  const [custom, setCustom] = useState({ on: false, ink: '#F1F5FF', accent: '#3B82F6' })
  const [tone, setTone] = useState('auto')
  const [build, setBuild] = useState(initialBuild)
  const [colorStyle, setColorStyle] = useState('')
  const [label, setLabel] = useState('')
  const [hold, setHold] = useState(4)
  const [games, setGames] = useState(true)
  const [loop, setLoop] = useState(true)
  const [interactive, setInteractive] = useState(true)
  const [ambient, setAmbient] = useState(true)
  const [playing, setPlaying] = useState('')
  const mark = useRef(null)

  const liveText = useDebounced(text, 300)
  const liveLabel = useDebounced(label, 300)
  const multiline = liveText.includes('\n')
  const paletteValue = useMemo(
    () => (custom.on ? { ink: custom.ink, accent: custom.accent } : palette),
    [custom, palette],
  )

  const options = {
    text: liveText.trim() || 'PIXELMARK',
    accent, palette: paletteValue, tone,
    build: build || undefined,
    colorStyle: colorStyle || undefined,
    label: liveLabel || undefined,
    hold, games, loop, interactive, ambient,
  }
  const scene = CATALOG.find((b) => b.name === build)?.kind === 'scene'

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <header className="max-w-2xl">
        <p className="font-pixel text-xs uppercase tracking-wider text-accent">Playground</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl">Make it yours.</h1>
        <p className="mt-4 text-lg text-muted">Change anything on the left; the code below updates as you go.</p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* ── Controls ─────────────────────────────────────────── */}
        <form className="space-y-5 border border-line bg-surface p-5 lg:sticky lg:top-20 lg:self-start" onSubmit={(e) => e.preventDefault()}>
          <Field label="Text" htmlFor="pg-text" hint="Press Enter for a new line. Scenes need a single line.">
            <textarea id="pg-text" rows={2} value={text} onChange={(e) => setText(e.target.value)} className={`${inputClass} resize-y font-mono uppercase`} />
          </Field>

          <Field label="Build" htmlFor="pg-build">
            <select id="pg-build" value={build} onChange={(e) => setBuild(e.target.value)} className={selectClass}>
              <option value="">Rotate through all</option>
              <optgroup label="Classic">
                {CATALOG.filter((b) => b.kind === 'classic').map((b) => <option key={b.name} value={b.name}>{b.title}</option>)}
              </optgroup>
              <optgroup label="Game & story scenes">
                {CATALOG.filter((b) => b.kind === 'scene').map((b) => <option key={b.name} value={b.name}>{b.title}</option>)}
              </optgroup>
            </select>
          </Field>
          {scene && multiline && <p className="-mt-3 text-xs text-accent">Scenes play on one line only; showing classic builds.</p>}

          <Field label="Accent" htmlFor="pg-accent">
            <select id="pg-accent" value={accent} onChange={(e) => setAccent(e.target.value)} className={selectClass}>
              {ACCENTS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </Field>

          <Field label="Palette">
            <PaletteSwatches value={custom.on ? '' : palette} onChange={(v) => { setPalette(v); setCustom((c) => ({ ...c, on: false })) }} />
            <div className="flex items-center gap-3 pt-2 text-sm">
              <label className="flex items-center gap-2 text-muted">
                <input type="color" value={custom.ink} onChange={(e) => setCustom({ ...custom, on: true, ink: e.target.value })} className="size-7 cursor-pointer border border-line bg-transparent" />
                ink
              </label>
              <label className="flex items-center gap-2 text-muted">
                <input type="color" value={custom.accent} onChange={(e) => setCustom({ ...custom, on: true, accent: e.target.value })} className="size-7 cursor-pointer border border-line bg-transparent" />
                accent
              </label>
              {custom.on && <span className="font-pixel text-[10px] uppercase text-accent">custom</span>}
            </div>
          </Field>

          <Field label="Tone">
            <Segmented label="Tone" value={tone} onChange={setTone} options={[{ value: 'auto', label: 'Auto' }, { value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} />
          </Field>

          <Field label="Colour style" htmlFor="pg-style">
            <select id="pg-style" value={colorStyle} onChange={(e) => setColorStyle(e.target.value)} className={selectClass}>
              <option value="">Rotate</option>
              {COLOR_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          <Field label={`Hold · ${hold}s`} htmlFor="pg-hold">
            <input id="pg-hold" type="range" min={1} max={12} step={0.5} value={hold} onChange={(e) => setHold(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
          </Field>

          <Field label="Scene label" htmlFor="pg-label" hint="Printed by a few scenes (XP installer, Street Fighter). Defaults to the first word.">
            <input id="pg-label" value={label} maxLength={12} onChange={(e) => setLabel(e.target.value)} placeholder="first word" className={`${inputClass} font-mono uppercase`} />
          </Field>

          <div className="divide-y divide-line border-t border-line pt-2">
            <Toggle label="Game & story scenes" checked={games} onChange={setGames} />
            <Toggle label="Loop" checked={loop} onChange={setLoop} />
            <Toggle label="Interactive (hover, click to skip)" checked={interactive} onChange={setInteractive} />
            <Toggle label="Ambient particles" checked={ambient} onChange={setAmbient} />
          </div>
        </form>

        {/* ── Preview + code ───────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          <section aria-label="Preview" className="border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-2 text-xs">
              <span className="text-muted">
                Now playing: <span className="font-mono text-fg">{titleOf[playing] || '…'}</span>
              </span>
              <button type="button" onClick={() => mark.current?.next()} className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg">
                <SkipIcon size={14} /> Next
              </button>
            </div>
            <div className="pixel-grid flex min-h-72 items-center justify-center bg-bg px-4 py-12 sm:px-10">
              <Pixelmark ref={mark} {...options} onBuild={setPlaying} />
            </div>
          </section>

          <CodeBlock title="Logo.jsx" code={toJsx({ ...options, text: liveText.trim() || 'PIXELMARK' })} />
        </div>
      </div>
    </div>
  )
}
