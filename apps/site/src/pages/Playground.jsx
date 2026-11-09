import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BUILD_NAMES, CATALOG, COLOR_STYLES, Pixelmark } from 'react-pixelmark'
import CodeBlock from '../components/CodeBlock'
import { Field, PaletteSwatches, Segmented, Toggle, inputClass } from '../components/Controls'
import { ChevronIcon, ShuffleIcon, SkipIcon } from '../components/Icons'
import Stage from '../components/Stage'
import VariantPicker from '../components/VariantPicker'
import { toJsx } from '../lib/code'
import { ROUTES } from '../lib/meta'
import { useDebounced } from '../lib/useDebounced'
import { useSEO } from '../lib/useSEO'
import { countPicks, toVariantsProp } from '../lib/variants'

const DEFAULT_TEXT = 'PIXEL MARK'
const ACCENTS = [
  { value: 'none', label: 'None' },
  { value: 'first', label: 'First word' },
  { value: 'rest', label: 'After the first word' },
  { value: 'last', label: 'Last word' },
  { value: 'all', label: 'Everything' },
]
const byName = Object.fromEntries(CATALOG.map((b) => [b.name, b]))
const CLASSICS = CATALOG.filter((b) => b.kind === 'classic')
const SCENES = CATALOG.filter((b) => b.kind === 'scene')
const selectClass = `${inputClass} cursor-pointer`

function Panel({ title, children, defaultOpen = true, badge }) {
  return (
    <details open={defaultOpen} className="group border-b border-line last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 font-pixel text-[11px] uppercase tracking-widest text-fg/90">
          {title}
          {badge}
        </span>
        <ChevronIcon size={14} className="text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-4 px-5 pb-5">{children}</div>
    </details>
  )
}

function BuildChips({ list, chosen, onToggle }) {
  return (
    <div className="flex flex-wrap gap-1">
      {list.map((b) => {
        const on = chosen.includes(b.name)
        return (
          <button key={b.name} type="button" aria-pressed={on} onClick={() => onToggle(b.name)}
            className={`border px-2 py-1 text-xs transition-colors ${on ? 'border-accent bg-accent text-accent-fg' : 'border-line text-muted hover:border-line-strong hover:text-fg'}`}>
            {b.title}
          </button>
        )
      })}
    </div>
  )
}

export default function Playground() {
  useSEO({ ...ROUTES['/playground'], path: '/playground' })
  const [params] = useSearchParams()
  const initial = BUILD_NAMES.includes(params.get('build')) ? params.get('build') : ''

  const [text, setText] = useState(params.get('text') || DEFAULT_TEXT)
  const [mode, setMode] = useState(initial ? 'one' : 'all')
  const [one, setOne] = useState(initial || 'mario')
  const [shortlist, setShortlist] = useState(initial ? [initial] : ['laser', 'matrix', 'mario', 'starwars'])
  const [variantPicks, setVariantPicks] = useState({})
  const [configScene, setConfigScene] = useState(byName[initial]?.kind === 'scene' ? initial : 'mario')
  const [accent, setAccent] = useState('rest')
  const [palette, setPalette] = useState('ocean')
  const [custom, setCustom] = useState({ on: false, ink: '#F1F5FF', accent: '#4B8DFF' })
  const [tone, setTone] = useState('auto')
  const [colorStyle, setColorStyle] = useState('')
  const [label, setLabel] = useState('')
  const [hold, setHold] = useState(4)
  const [games, setGames] = useState(true)
  const [loop, setLoop] = useState(true)
  const [interactive, setInteractive] = useState(true)
  const [ambient, setAmbient] = useState(true)
  const [playing, setPlaying] = useState('')
  const [stageBg, setStageBg] = useState('stage')
  const mark = useRef(null)

  const liveText = useDebounced(text, 300)
  const liveLabel = useDebounced(label, 300)
  const multiline = liveText.includes('\n')
  const paletteValue = useMemo(() => (custom.on ? { ink: custom.ink, accent: custom.accent } : palette), [custom, palette])

  // the scenes that can play with the current rotation: only their variants matter
  const scenesInPlay = (mode === 'one' ? [one] : mode === 'shortlist' ? shortlist : games ? SCENES.map((b) => b.name) : [])
    .filter((n) => byName[n]?.kind === 'scene')
  const sceneToConfig = scenesInPlay.includes(configScene) ? configScene : scenesInPlay[0]
  const relevantPicks = Object.fromEntries(Object.entries(variantPicks).filter(([s]) => scenesInPlay.includes(s)))
  const variants = toVariantsProp(relevantPicks)
  const variantCount = Object.values(relevantPicks).reduce((n, p) => n + countPicks(p), 0)

  const options = {
    text: liveText.trim() || DEFAULT_TEXT,
    accent, palette: paletteValue, tone,
    build: mode === 'one' ? one : undefined,
    builds: mode === 'shortlist' && shortlist.length ? shortlist : undefined,
    variants,
    colorStyle: colorStyle || undefined,
    label: liveLabel || undefined,
    hold, games: mode === 'all' ? games : undefined, loop, interactive, ambient,
  }

  const toggleShort = (n) => setShortlist((l) => (l.includes(n) ? l.filter((x) => x !== n) : [...l, n]))
  const randomize = () => {
    const pool = [...CLASSICS, ...SCENES].sort(() => Math.random() - 0.5)
    setMode('shortlist'); setShortlist(pool.slice(0, 5).map((b) => b.name))
    setPalette(['ocean', 'ember', 'mint', 'violet', 'rose', 'gold'][Math.floor(Math.random() * 6)]); setCustom((c) => ({ ...c, on: false }))
  }

  return (
    <div className="wrap pt-10 sm:pt-14">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="font-pixel text-xs uppercase tracking-widest text-accent">Playground</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-6xl">Make it yours.</h1>
          <div className="pixel-rule mt-5 w-40" aria-hidden="true" />
          <p className="mt-5 text-lg text-muted">Pick the builds, the scene variants and the colours. The code updates as you go.</p>
        </div>
        <button type="button" onClick={randomize} className="inline-flex items-center gap-2 self-start border border-line px-4 py-2.5 text-sm text-fg/90 transition-colors hover:border-accent md:self-auto">
          <ShuffleIcon size={14} /> Surprise me
        </button>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[400px_minmax(0,1fr)]">
        {/* ── Controls ─────────────────────────────────────────── */}
        <form className="border border-line bg-surface lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto" onSubmit={(e) => e.preventDefault()}>
          <Panel title="Text">
            <Field label="Wordmark" htmlFor="pg-text" hint="Enter starts a new line (classic builds only).">
              <textarea id="pg-text" rows={2} value={text} onChange={(e) => setText(e.target.value)} className={`${inputClass} resize-y font-mono uppercase`} />
            </Field>
            <Field label="Accent" htmlFor="pg-accent">
              <select id="pg-accent" value={accent} onChange={(e) => setAccent(e.target.value)} className={selectClass}>
                {ACCENTS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </Field>
          </Panel>

          <Panel title="Builds" badge={<span className="font-mono text-[10px] normal-case tracking-normal text-muted">{mode === 'all' ? 'all' : mode === 'one' ? '1' : shortlist.length}</span>}>
            <Segmented label="Rotation" value={mode} onChange={setMode} options={[{ value: 'all', label: 'All' }, { value: 'shortlist', label: 'Shortlist' }, { value: 'one', label: 'One' }]} />
            {mode === 'all' && (
              <>
                <p className="text-xs text-muted">Every build plays once before any repeats.</p>
                <Toggle label="Include game & story scenes" checked={games} onChange={setGames} />
              </>
            )}
            {mode === 'one' && (
              <select aria-label="Build" value={one} onChange={(e) => { setOne(e.target.value); if (byName[e.target.value].kind === 'scene') setConfigScene(e.target.value) }} className={selectClass}>
                <optgroup label="Classic">{CLASSICS.map((b) => <option key={b.name} value={b.name}>{b.title}</option>)}</optgroup>
                <optgroup label="Game & story scenes">{SCENES.map((b) => <option key={b.name} value={b.name}>{b.title}</option>)}</optgroup>
              </select>
            )}
            {mode === 'shortlist' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{shortlist.length ? `${shortlist.length} selected` : 'Pick at least one'}</span>
                  <span className="flex gap-3">
                    <button type="button" className="hover:text-fg" onClick={() => setShortlist(CATALOG.map((b) => b.name))}>All</button>
                    <button type="button" className="hover:text-fg" onClick={() => setShortlist([])}>None</button>
                  </span>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-muted">Classic</p>
                  <BuildChips list={CLASSICS} chosen={shortlist} onToggle={toggleShort} />
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-muted">Scenes</p>
                  <BuildChips list={SCENES} chosen={shortlist} onToggle={toggleShort} />
                </div>
              </div>
            )}
            {multiline && scenesInPlay.length > 0 && <p className="text-xs text-hot">Scenes need one line of text: only classic builds will play.</p>}
          </Panel>

          <Panel title="Scene variants" defaultOpen={byName[initial]?.kind === 'scene'} badge={variantCount > 0 && <span className="bg-accent px-1.5 font-mono text-[10px] normal-case tracking-normal text-accent-fg">{variantCount}</span>}>
            {scenesInPlay.length ? (
              <>
                {scenesInPlay.length > 1 && (
                  <select aria-label="Scene to configure" value={sceneToConfig} onChange={(e) => setConfigScene(e.target.value)} className={selectClass}>
                    {scenesInPlay.map((n) => (
                      <option key={n} value={n}>{byName[n].title}{countPicks(variantPicks[n]) ? ` (${countPicks(variantPicks[n])} set)` : ''}</option>
                    ))}
                  </select>
                )}
                <VariantPicker
                  scene={sceneToConfig}
                  picks={variantPicks[sceneToConfig] || {}}
                  onChange={(p) => setVariantPicks((all) => ({ ...all, [sceneToConfig]: p }))}
                />
              </>
            ) : (
              <p className="text-sm text-muted">No scene is in the rotation. Add one under Builds to choose its variants.</p>
            )}
          </Panel>

          <Panel title="Colour">
            <PaletteSwatches value={custom.on ? '' : palette} onChange={(v) => { setPalette(v); setCustom((c) => ({ ...c, on: false })) }} />
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2 text-muted">
                <input type="color" value={custom.ink} onChange={(e) => setCustom({ ...custom, on: true, ink: e.target.value })} className="size-8 cursor-pointer border border-line bg-transparent" />
                Ink
              </label>
              <label className="flex items-center gap-2 text-muted">
                <input type="color" value={custom.accent} onChange={(e) => setCustom({ ...custom, on: true, accent: e.target.value })} className="size-8 cursor-pointer border border-line bg-transparent" />
                Accent
              </label>
              {custom.on && <span className="font-pixel text-[10px] uppercase text-accent">custom</span>}
            </div>
            <Field label="Tone">
              <Segmented label="Tone" value={tone} onChange={setTone} options={[{ value: 'auto', label: 'Auto' }, { value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} />
            </Field>
            <Field label="Colour style" htmlFor="pg-style">
              <select id="pg-style" value={colorStyle} onChange={(e) => setColorStyle(e.target.value)} className={selectClass}>
                <option value="">Rotate through all</option>
                {COLOR_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </Panel>

          <Panel title="Behaviour" defaultOpen={false}>
            <Field label={`Hold · ${hold}s`} htmlFor="pg-hold">
              <input id="pg-hold" type="range" min={1} max={12} step={0.5} value={hold} onChange={(e) => setHold(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
            </Field>
            <Field label="Scene label" htmlFor="pg-label" hint="Printed by the XP installer, Street Fighter and Harry Potter scenes.">
              <input id="pg-label" value={label} maxLength={12} onChange={(e) => setLabel(e.target.value)} placeholder="first word" className={`${inputClass} font-mono uppercase`} />
            </Field>
            <div className="divide-y divide-line border-y border-line">
              <Toggle label="Loop" checked={loop} onChange={setLoop} />
              <Toggle label="Interactive (hover, click to skip)" checked={interactive} onChange={setInteractive} />
              <Toggle label="Ambient particles" checked={ambient} onChange={setAmbient} />
            </div>
          </Panel>
        </form>

        {/* ── Preview + code ───────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          <Stage
            title={(
              <>
                <span className="size-2 animate-blink bg-hot" aria-hidden="true" />
                <span>Now playing</span>
                <Link to={playing ? `/builds/${playing}` : '/gallery'} className="truncate font-mono text-fg hover:text-accent">{byName[playing]?.title || '…'}</Link>
              </>
            )}
            right={(
              <>
                <div role="radiogroup" aria-label="Preview background" className="hidden border border-line sm:flex">
                  {[['stage', 'Screen'], ['bg-bg', 'Page']].map(([v, l]) => (
                    <button key={v} type="button" role="radio" aria-checked={stageBg === v} onClick={() => setStageBg(v)}
                      className={`px-2 py-0.5 ${stageBg === v ? 'bg-raised text-fg' : 'text-muted hover:text-fg'}`}>{l}</button>
                  ))}
                </div>
                <button type="button" onClick={() => mark.current?.next()} className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg">
                  <SkipIcon size={14} /> Next
                </button>
              </>
            )}
            screenClass={`min-h-[clamp(16rem,34vw,38rem)] px-[5%] py-14 ${stageBg === 'bg-bg' ? 'bg-bg! bg-none!' : ''}`}
          >
            <Pixelmark ref={mark} {...options} maxWidth="100%" onBuild={setPlaying} />
          </Stage>

          <CodeBlock title="Logo.jsx" code={toJsx(options)} />
        </div>
      </div>
    </div>
  )
}
