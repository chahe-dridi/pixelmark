import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATALOG, CLASSIC_BUILD_NAMES, Pixelmark, SCENE_BUILD_NAMES } from 'pixelmark'
import CodeBlock, { InstallCommand } from '../components/CodeBlock'
import { ArrowIcon, SkipIcon } from '../components/Icons'

const titleOf = Object.fromEntries(CATALOG.map((b) => [b.name, b.title]))

const QUICK_START = `import { Pixelmark } from 'pixelmark'

export default function Hero() {
  return <Pixelmark text="Software Engineer" accent="rest" />
}`

const FEATURES = [
  { title: 'Any text', body: 'A–Z, 0–9, punctuation and line breaks. Accents are stripped, so "Ingénieur" just works.' },
  { title: 'One canvas', body: 'A few hundred rectangles a frame and no React re-renders. Zero runtime dependencies.' },
  { title: 'Scenes on demand', body: 'Each game scene is its own chunk, downloaded only when it is about to play.' },
  { title: 'Polite by default', body: 'Pauses off-screen and in hidden tabs, and shows the finished wordmark under reduced motion.' },
  { title: 'Themeable', body: 'Seven palettes, a three-colour shorthand, and it follows your light or dark theme.' },
  { title: 'Typed', body: 'Full TypeScript definitions, a React component and a framework-free mount().' },
]

function KindPanel({ kind, title, count, body, text, builds }) {
  return (
    <div className="flex flex-col border border-line bg-surface">
      <div className="pixel-grid border-b border-line bg-bg px-4 py-8">
        <Pixelmark text={text} builds={builds} hold={3} ambient={false} className="mx-auto" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline gap-3">
          <h3 className="text-xl font-semibold text-fg">{title}</h3>
          <span className="font-mono text-sm text-muted">{count}</span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{body}</p>
        <Link to={`/gallery?kind=${kind}`} className="mt-4 inline-flex items-center gap-1.5 text-sm text-fg/80 transition-colors hover:text-accent">
          Browse them <ArrowIcon size={14} />
        </Link>
      </div>
    </div>
  )
}

export default function Home() {
  const [playing, setPlaying] = useState('')
  const hero = useRef(null)

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pixel-grid border-b border-line">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
          <p className="font-pixel text-xs uppercase tracking-wider text-accent">React component · MIT</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-fg sm:text-6xl">
            Your name, built from pixels.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            pixelmark turns any text into a pixel-art wordmark that builds itself: with a laser, falling sand, Matrix rain, or a
            whole Mario level. Then it takes itself apart and does it again.
          </p>

          <div className="mt-12">
            <Pixelmark ref={hero} text="PIXEL MARK" accent="rest" hold={5} onBuild={setPlaying} maxWidth={1000} />
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <span>
                Now playing: <span className="font-mono text-fg">{titleOf[playing] || '…'}</span>
              </span>
              <button type="button" onClick={() => hero.current?.next()} className="inline-flex items-center gap-1.5 transition-colors hover:text-fg">
                <SkipIcon size={14} /> Skip (or click it)
              </button>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
            <InstallCommand className="sm:w-80" />
            <Link to="/gallery" className="pixel-corners inline-flex items-center justify-center gap-2 bg-accent px-5 py-3 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90">
              Browse all {CATALOG.length} builds <ArrowIcon size={14} />
            </Link>
            <Link to="/playground" className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm text-fg/80 transition-colors hover:text-accent">
              Open the playground
            </Link>
          </div>
        </div>
      </section>

      {/* ── Two kinds ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-fg">Two kinds of builds</h2>
        <p className="mt-3 max-w-2xl text-muted">
          By default the wordmark rotates through all of them, never repeating one until every build has played. Pin one, or pick your own shortlist.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <KindPanel
            kind="classic"
            title="Classic"
            count={CLASSIC_BUILD_NAMES.length}
            text="CLASSIC"
            builds={CLASSIC_BUILD_NAMES}
            body="Pure pixel effects: assemble, laser, sand, lightning, matrix, tetris, typewriter and more. They work on any text, including several lines."
          />
          <KindPanel
            kind="scene"
            title="Game & story scenes"
            count={SCENE_BUILD_NAMES.length}
            text="SCENES"
            builds={SCENE_BUILD_NAMES}
            body="Little cutscenes that build the word: Mario, Pac-Man, Street Fighter, Minecraft, Star Wars, Dragon Ball, Sidi Bou Said and more."
          />
        </div>
      </section>

      {/* ── Quick start ──────────────────────────────────────── */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-fg">Three lines to a hero</h2>
          <ol className="mt-6 space-y-5">
            {[
              ['Install', 'npm install pixelmark. React 18 or newer is the only peer.'],
              ['Drop it in', 'Give it text. It sizes itself to its container and keeps its aspect ratio.'],
              ['Tune it', 'Palette, accent words, a single build or a shortlist, hold time. Or skip React and use mount().'],
            ].map(([t, b], i) => (
              <li key={t} className="flex gap-4">
                <span className="font-pixel text-sm text-accent">0{i + 1}</span>
                <div>
                  <h3 className="font-semibold text-fg">{t}</h3>
                  <p className="mt-1 text-sm text-muted">{b}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link to="/docs" className="mt-8 inline-flex items-center gap-1.5 text-sm text-fg/80 transition-colors hover:text-accent">
            Read the docs <ArrowIcon size={14} />
          </Link>
        </div>
        <CodeBlock title="Hero.jsx" code={QUICK_START} />
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="grid border-l border-t border-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="border-b border-r border-line p-6">
              <h3 className="font-semibold text-fg">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
