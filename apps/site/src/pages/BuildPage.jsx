import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CATALOG, Pixelmark } from 'react-pixelmark'
import BuildCard from '../components/BuildCard'
import CodeBlock from '../components/CodeBlock'
import { Field, PaletteSwatches, inputClass } from '../components/Controls'
import { ArrowIcon, SkipIcon } from '../components/Icons'
import Stage from '../components/Stage'
import VariantPicker from '../components/VariantPicker'
import NotFound from './NotFound'
import { buildMeta } from '../lib/meta'
import { toJsx } from '../lib/code'
import { useDebounced } from '../lib/useDebounced'
import { useSEO } from '../lib/useSEO'
import { toSceneVariants } from '../lib/variants'

export default function BuildPage() {
  const { name } = useParams()
  const entry = CATALOG.find((b) => b.name === name)
  // remount the page when moving between builds so state starts fresh
  return entry ? <BuildDetail key={entry.name} entry={entry} /> : <NotFound />
}

function BuildDetail({ entry }) {
  useSEO({ ...buildMeta(entry), path: `/builds/${entry.name}` })
  const mark = useRef(null)
  const [text, setText] = useState('PIXEL MARK')
  const [palette, setPalette] = useState('ocean')
  const [picks, setPicks] = useState({})
  const [plays, setPlays] = useState(0)
  const liveText = useDebounced(text.trim() || 'PIXEL MARK', 300)
  const isScene = entry.kind === 'scene'

  const sceneVariants = toSceneVariants(picks)
  const variants = useMemo(() => (sceneVariants ? { [entry.name]: sceneVariants } : undefined), [sceneVariants, entry.name])

  const i = CATALOG.indexOf(entry)
  const prev = CATALOG[(i - 1 + CATALOG.length) % CATALOG.length]
  const next = CATALOG[(i + 1) % CATALOG.length]
  const related = CATALOG
    .filter((b) => b !== entry)
    .map((b) => ({ b, score: b.tags.filter((t) => entry.tags.includes(t)).length * 2 + (b.kind === entry.kind ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.b)

  const code = toJsx({ text: liveText, accent: 'rest', palette, build: entry.name, variants })

  return (
    <div className="wrap pt-8 sm:pt-12">
      <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link to="/gallery" className="hover:text-fg">Gallery</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link to={`/gallery?kind=${entry.kind}`} className="hover:text-fg">{isScene ? 'Scenes' : 'Classic'}</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-fg">{entry.title}</li>
        </ol>
      </nav>

      <header className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className={`font-pixel text-xs uppercase tracking-widest ${isScene ? 'text-accent' : 'text-muted'}`}>
            {isScene ? 'Game & story scene' : 'Classic build'}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-fg sm:text-6xl">{entry.title}</h1>
          <p className="mt-4 text-lg text-muted">{entry.description}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <Link key={t} to={`/gallery?tags=${t}`} className="border border-line px-2 py-1 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-fg">#{t}</Link>
          ))}
        </div>
      </header>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Stage
            title={<><span className="font-mono text-fg">{entry.name}</span><span>· played {plays}×</span></>}
            right={(
              <button type="button" onClick={() => mark.current?.next()} className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg">
                <SkipIcon size={14} /> Replay
              </button>
            )}
            screenClass="min-h-[clamp(14rem,32vw,34rem)] px-[5%] py-12"
          >
            <Pixelmark
              ref={mark}
              text={liveText}
              build={entry.name}
              variants={variants}
              palette={palette}
              accent="rest"
              hold={4}
              maxWidth="100%"
              onBuild={() => setPlays((n) => n + 1)}
            />
          </Stage>
          <CodeBlock title={`${entry.title.replace(/\W+/g, '')}.jsx`} code={code} />
        </div>

        <aside className="space-y-6">
          {isScene && (
            <section className="border border-line bg-surface p-5">
              <h2 className="text-lg font-semibold text-fg">Variants</h2>
              <p className="mt-1 text-sm text-muted">
                Every play picks these at random. Pick one to pin it, or several to shuffle between them only.
              </p>
              <div className="mt-5">
                <VariantPicker scene={entry.name} picks={picks} onChange={setPicks} />
              </div>
            </section>
          )}
          <section className="space-y-4 border border-line bg-surface p-5">
            <h2 className="text-lg font-semibold text-fg">Preview</h2>
            <Field label="Text" htmlFor="b-text" hint={isScene ? 'Scenes need one line of text.' : 'Works on any text.'}>
              <input id="b-text" value={text} maxLength={20} onChange={(e) => setText(e.target.value)} className={`${inputClass} font-mono uppercase`} />
            </Field>
            <Field label="Palette">
              <PaletteSwatches value={palette} onChange={setPalette} />
            </Field>
            <Link
              to={`/playground?build=${entry.name}`}
              className="pixel-corners flex items-center justify-center gap-2 bg-accent py-2.5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
            >
              Open in the playground <ArrowIcon size={14} />
            </Link>
          </section>
        </aside>
      </div>

      <nav aria-label="Other builds" className="mt-10 grid grid-cols-2 gap-4">
        <Link to={`/builds/${prev.name}`} className="group border border-line p-4 transition-colors hover:border-line-strong">
          <span className="font-mono text-xs text-muted">← Previous</span>
          <span className="mt-1 block text-lg font-semibold text-fg group-hover:text-accent">{prev.title}</span>
        </Link>
        <Link to={`/builds/${next.name}`} className="group border border-line p-4 text-right transition-colors hover:border-line-strong">
          <span className="font-mono text-xs text-muted">Next →</span>
          <span className="mt-1 block text-lg font-semibold text-fg group-hover:text-accent">{next.title}</span>
        </Link>
      </nav>

      <section className="mt-20">
        <h2 className="text-2xl font-bold tracking-tight text-fg">More like this</h2>
        <div className="mt-6 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}>
          {related.map((b, k) => <BuildCard key={b.name} entry={b} index={CATALOG.indexOf(b)} text={liveText} palette={palette} accent="rest" />)}
        </div>
      </section>
    </div>
  )
}
