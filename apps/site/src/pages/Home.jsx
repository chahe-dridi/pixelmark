import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CATALOG, CLASSIC_BUILD_NAMES, PALETTES, Pixelmark, SCENE_BUILD_NAMES, VARIANTS } from 'pixelmark'
import CodeBlock, { InstallCommand } from '../components/CodeBlock'
import { ArrowIcon, SkipIcon } from '../components/Icons'
import Marquee from '../components/Marquee'
import Stage from '../components/Stage'
import { inputClass } from '../components/Controls'
import { ROUTES } from '../lib/meta'
import { useDebounced } from '../lib/useDebounced'
import { useSEO } from '../lib/useSEO'

const byName = Object.fromEntries(CATALOG.map((b) => [b.name, b]))
const HERO_PALETTES = ['ocean', 'ember', 'mint', 'violet', 'rose']

const QUICK_START = `import { Pixelmark } from 'pixelmark'

export default function Hero() {
  return (
    <Pixelmark
      text="Software Engineer"
      accent="rest"
      variants={{ starwars: { scene: 'duel' } }}
    />
  )
}`

const FEATURES = [
  ['Any text', 'A–Z, 0–9, punctuation and several lines. Accents are stripped, so "Ingénieur" just works.'],
  ['One canvas', 'A few hundred rectangles a frame and no React re-renders. Zero runtime dependencies.'],
  ['Scenes on demand', 'Each game scene is its own chunk, downloaded only when it is about to play.'],
  ['Variants you control', 'Pin Mario to the world map, Star Wars to the duel, or shuffle between the ones you like.'],
  ['Polite by default', 'Pauses off-screen and in hidden tabs; reduced-motion users get the finished wordmark.'],
  ['Typed, framework-free too', 'Full TypeScript definitions, a React component, and mount() for everything else.'],
]

// The scenes the variants spotlight can switch between, and which option it toggles
const SPOTLIGHT = [
  { scene: 'starwars', key: 'scene' },
  { scene: 'mario', key: 'mode' },
  { scene: 'dragonball', key: 'mode' },
  { scene: 'harrypotter', key: 'spell' },
]

function VariantSpotlight() {
  const [tab, setTab] = useState(0)
  const { scene, key } = SPOTLIGHT[tab]
  const opt = VARIANTS[scene].find((v) => v.key === key)
  const [value, setValue] = useState(opt.options[0][0])
  const choose = (t) => { setTab(t); const o = VARIANTS[SPOTLIGHT[t].scene].find((v) => v.key === SPOTLIGHT[t].key); setValue(o.options[0][0]) }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-stretch">
      <div className="flex flex-col">
        <div role="tablist" aria-label="Scene" className="flex flex-wrap gap-1.5">
          {SPOTLIGHT.map((s, t) => (
            <button key={s.scene} type="button" role="tab" aria-selected={tab === t} onClick={() => choose(t)}
              className={`px-3 py-2 text-sm transition-colors ${tab === t ? 'bg-fg text-bg' : 'border border-line text-muted hover:border-line-strong hover:text-fg'}`}>
              {byName[s.scene].title}
            </button>
          ))}
        </div>
        <p className="mt-6 font-pixel text-[11px] uppercase tracking-widest text-muted">{opt.label}</p>
        <div className="mt-3 grid gap-2">
          {opt.options.map(([v, label]) => (
            <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => setValue(v)}
              className={`group flex items-center justify-between border px-4 py-3 text-left transition-colors ${value === v ? 'border-accent bg-accent-soft text-fg' : 'border-line text-muted hover:border-line-strong hover:text-fg'}`}>
              <span>{label}</span>
              <span aria-hidden="true" className={`font-mono text-xs ${value === v ? 'text-accent' : 'opacity-0 group-hover:opacity-60'}`}>{key}: {JSON.stringify(v)}</span>
            </button>
          ))}
        </div>
        <p className="mt-auto pt-6 text-sm text-muted">
          Every scene has its own options. <Link to={`/builds/${scene}`} className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">See all of {byName[scene].title}'s variants</Link>.
        </p>
      </div>
      <Stage
        title={<span className="font-mono">{`variants={{ ${scene}: { ${key}: ${JSON.stringify(value).replaceAll('"', "'")} } }}`}</span>}
        screenClass="min-h-72 px-[5%] py-10"
      >
        <Pixelmark text="PIXEL MARK" accent="rest" build={scene} variants={{ [scene]: { [key]: value } }} hold={3} maxWidth="100%" aria-label={`${byName[scene].title} scene, ${value}`} />
      </Stage>
    </div>
  )
}

export default function Home() {
  useSEO({ ...ROUTES['/'], path: '/' })
  const [playing, setPlaying] = useState('')
  const [plays, setPlays] = useState(0)
  const [text, setText] = useState('PIXEL MARK')
  const [palette, setPalette] = useState('ocean')
  const [name, setName] = useState('')
  const liveText = useDebounced(text.trim() || 'PIXEL MARK', 350)
  const hero = useRef(null)
  const navigate = useNavigate()

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pixel-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,#000_20%,transparent_70%)]" aria-hidden="true" />
        <div className="wrap relative pb-16 pt-12 sm:pt-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
            <div>
              <Link to="/docs#variants" className="inline-flex items-center gap-2 border border-line bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-fg">
                <span className="bg-accent px-1.5 font-pixel text-[9px] uppercase text-accent-fg">New</span>
                Choose exactly which scene variants play
                <ArrowIcon size={12} />
              </Link>
              <h1 className="mt-6 text-[clamp(2.6rem,7vw,6.5rem)] font-bold leading-[0.95] tracking-tight text-fg">
                Your name,<br />built from <span className="text-accent">pixels</span><span className="text-hot">.</span>
              </h1>
            </div>
            <div className="lg:pb-3">
              <p className="text-lg leading-relaxed text-muted">
                A React component that draws any text as a pixel-art wordmark, then takes it apart and builds it again, a different
                way each time: a laser, falling sand, Matrix rain, or a whole Mario level.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link to="/gallery" className="pixel-corners inline-flex items-center justify-center gap-2 bg-accent px-6 py-3.5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90">
                  Browse all {CATALOG.length} builds <ArrowIcon size={14} />
                </Link>
                <InstallCommand className="sm:flex-1" />
              </div>
            </div>
          </div>

          <Stage
            className="mt-12"
            title={(
              <>
                <span className="size-2 animate-blink bg-hot" aria-hidden="true" />
                <span className="hidden sm:inline">Now playing</span>
                <Link to={playing ? `/builds/${playing}` : '/gallery'} className="truncate font-mono text-fg hover:text-accent">{byName[playing]?.title || '…'}</Link>
                <span className="hidden font-mono text-muted/70 md:inline">#{String(plays).padStart(3, '0')}</span>
              </>
            )}
            right={(
              <>
                <div className="hidden items-center gap-1 sm:flex" role="radiogroup" aria-label="Palette">
                  {HERO_PALETTES.map((p) => (
                    <button key={p} type="button" role="radio" aria-checked={palette === p} aria-label={`${p} palette`} onClick={() => setPalette(p)}
                      className={`size-5 border-2 transition-transform hover:scale-110 ${palette === p ? 'border-fg' : 'border-transparent'}`}
                      style={{ background: PALETTES[p].dark.acc[2] }} />
                  ))}
                </div>
                <button type="button" onClick={() => hero.current?.next()} className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg">
                  <SkipIcon size={14} /> Next
                </button>
              </>
            )}
            screenClass="min-h-[clamp(15rem,30vw,36rem)] px-[4%] py-12"
          >
            <Pixelmark
              ref={hero}
              text={liveText}
              accent="rest"
              palette={palette}
              hold={4.5}
              maxWidth="100%"
              onBuild={(n) => { setPlaying(n); setPlays((k) => k + 1) }}
            />
          </Stage>
          <label className="mt-3 flex items-center gap-3 border border-line bg-surface px-3 py-2">
            <span className="shrink-0 font-pixel text-[10px] uppercase tracking-widest text-muted">Try your text</span>
            <input value={text} maxLength={20} onChange={(e) => setText(e.target.value)} className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase text-fg focus:outline-none" aria-label="Text for the wordmark above" />
            <span className="hidden text-xs text-muted sm:inline">or click the wordmark to skip</span>
          </label>
        </div>
      </section>

      <Marquee />

      {/* ── Numbers ──────────────────────────────────────────── */}
      <section aria-label="At a glance" className="border-b border-line">
        <dl className="wrap grid grid-cols-2 md:grid-cols-5">
          {[
            [CLASSIC_BUILD_NAMES.length, 'classic builds'],
            [SCENE_BUILD_NAMES.length, 'game & story scenes'],
            [Object.values(VARIANTS).reduce((n, v) => n + v.length, 0), 'scene options'],
            ['0', 'runtime dependencies'],
            ['1', 'canvas, no re-renders'],
          ].map(([n, l], k) => (
            <div key={l} className={`border-line py-8 md:border-r md:px-6 md:first:pl-0 md:last:border-0 ${k % 2 ? 'pl-6' : ''} ${k < 4 ? 'max-md:border-b' : ''}`}>
              <dt className="sr-only">{l}</dt>
              <dd>
                <span className="block font-mono text-4xl text-fg sm:text-5xl">{n}</span>
                <span className="mt-1 block text-sm text-muted">{l}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Two kinds ────────────────────────────────────────── */}
      <section className="wrap pt-24">
        <div className="max-w-2xl">
          <p className="font-pixel text-xs uppercase tracking-widest text-accent">The builds</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl">Two kinds, one rotation.</h2>
          <p className="mt-4 text-lg text-muted">
            By default it plays every build once before any repeats. Pin one, hand-pick a shortlist, or keep the whole show.
          </p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {[
            { kind: 'classic', title: 'Classic effects', n: CLASSIC_BUILD_NAMES.length, text: 'CLASSIC', builds: CLASSIC_BUILD_NAMES, body: 'Pure pixel effects: assemble, laser, sand, lightning, matrix, tetris, typewriter and more. They work on any text, several lines included.' },
            { kind: 'scene', title: 'Game & story scenes', n: SCENE_BUILD_NAMES.length, text: 'SCENES', builds: SCENE_BUILD_NAMES, body: 'Little cutscenes that build the word: Mario, Pac-Man, Street Fighter, Minecraft, Star Wars, Dragon Ball, Sidi Bou Said and more, most with variants.' },
          ].map((k) => (
            <Link key={k.kind} to={`/gallery?kind=${k.kind}`} className="group flex flex-col border border-line bg-surface transition-colors hover:border-line-strong">
              <div className="stage border-b border-line px-[8%] py-10">
                <Pixelmark text={k.text} builds={k.builds} hold={3} ambient={false} interactive={false} aria-label={`${k.title} preview`} />
              </div>
              <div className="flex items-end justify-between gap-6 p-6">
                <div>
                  <h3 className="flex items-baseline gap-3 text-2xl font-semibold text-fg">{k.title}<span className="font-mono text-base text-muted">{k.n}</span></h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">{k.body}</p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center border border-line text-muted transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg">
                  <ArrowIcon />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Variants ─────────────────────────────────────────── */}
      <section className="wrap pt-28">
        <div className="max-w-2xl">
          <p className="font-pixel text-xs uppercase tracking-widest text-accent">Scene variants</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl">Same scene, your cut.</h2>
          <p className="mt-4 text-lg text-muted">
            Most scenes roll their own dice: Mario or Luigi, a duel or a space battle, which villain shows up. Leave them random,
            pin the one you love, or shuffle between a few.
          </p>
        </div>
        <div className="mt-10">
          <VariantSpotlight />
        </div>
      </section>

      {/* ── Quick start ──────────────────────────────────────── */}
      <section className="wrap grid gap-12 pt-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <div>
          <p className="font-pixel text-xs uppercase tracking-widest text-accent">Quick start</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl">Three lines to a hero.</h2>
          <ol className="mt-10 space-y-7">
            {[
              ['Install it', 'npm install pixelmark. React 18 or newer is the only peer.'],
              ['Give it text', 'It fills its container, keeps its aspect ratio and follows your light/dark theme.'],
              ['Tune it', 'Palette, accent words, a single build or a shortlist, scene variants, hold time. Or skip React and use mount().'],
            ].map(([t, b], i) => (
              <li key={t} className="flex gap-5">
                <span className="grid size-10 shrink-0 place-items-center border border-line font-pixel text-sm text-accent">{i + 1}</span>
                <div>
                  <h3 className="text-lg font-semibold text-fg">{t}</h3>
                  <p className="mt-1 text-muted">{b}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link to="/docs" className="mt-10 inline-flex items-center gap-2 text-fg/85 transition-colors hover:text-accent">
            Read the docs <ArrowIcon size={14} />
          </Link>
        </div>
        <CodeBlock title="Hero.jsx" code={QUICK_START} />
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="wrap pt-28">
        <div className="grid border-l border-t border-line sm:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map(([t, b], i) => (
            <div key={t} className="group border-b border-r border-line p-7 transition-colors hover:bg-surface">
              <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-4 text-xl font-semibold text-fg">{t}</h3>
              <p className="mt-2 leading-relaxed text-muted">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="wrap pt-28">
        <div className="stage border border-line px-6 py-16 text-center sm:px-12 sm:py-24">
          <h2 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-fg sm:text-6xl">Now try it with your name.</h2>
          <form
            className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
            onSubmit={(e) => { e.preventDefault(); navigate(`/playground?text=${encodeURIComponent(name.trim() || 'PIXEL MARK')}`) }}
          >
            <label className="sr-only" htmlFor="cta-name">Your name</label>
            <input id="cta-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="YOUR NAME" maxLength={20} className={`${inputClass} flex-1 py-3 font-mono uppercase`} />
            <button type="submit" className="pixel-corners inline-flex items-center justify-center gap-2 bg-accent px-6 py-3 font-medium text-accent-fg transition-opacity hover:opacity-90">
              Build it <ArrowIcon size={14} />
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
