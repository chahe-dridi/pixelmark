import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CATALOG, PALETTE_NAMES, TAGS } from 'pixelmark'
import BuildCard from '../components/BuildCard'
import { Chip, Field, PaletteSwatches, Segmented, inputClass } from '../components/Controls'
import { useDebounced } from '../lib/useDebounced'

const DEFAULT_TEXT = 'PIXEL MARK'
const counts = {
  all: CATALOG.length,
  classic: CATALOG.filter((b) => b.kind === 'classic').length,
  scene: CATALOG.filter((b) => b.kind === 'scene').length,
}

// Every filter lives in the URL (?kind=scene&tags=retro,film&q=…), so a
// filtered view can be shared or bookmarked
export default function Gallery() {
  const [params, setParams] = useSearchParams()
  const kind = ['classic', 'scene'].includes(params.get('kind')) ? params.get('kind') : 'all'
  const tags = (params.get('tags') || '').split(',').filter((t) => TAGS.includes(t))
  const q = params.get('q') || ''
  const text = params.get('text') ?? DEFAULT_TEXT
  const palette = PALETTE_NAMES.includes(params.get('palette')) ? params.get('palette') : 'ocean'

  const set = (key, value, fallback = '') => {
    const next = new URLSearchParams(params)
    if (!value || value === fallback) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }
  const toggleTag = (t) => set('tags', (tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]).join(','))

  // Rebuilding 35 canvases on every keystroke would stutter: wait for a pause
  const previewText = useDebounced(text.trim() || DEFAULT_TEXT, 350)

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return CATALOG.filter((b) =>
      (kind === 'all' || b.kind === kind) &&
      tags.every((t) => b.tags.includes(t)) &&
      (!needle || `${b.name} ${b.title} ${b.description} ${b.tags.join(' ')}`.toLowerCase().includes(needle)))
  }, [kind, tags, q])

  const hasFilters = kind !== 'all' || tags.length || q

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <header className="max-w-2xl">
        <p className="font-pixel text-xs uppercase tracking-wider text-accent">Gallery</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl">Every build, live.</h1>
        <p className="mt-4 text-lg text-muted">
          {counts.classic} classic pixel effects and {counts.scene} game & story scenes. Type your own text to preview it on all of them, then open one in the playground to get the code.
        </p>
      </header>

      <section aria-label="Filters" className="mt-10 space-y-5 border border-line bg-surface p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <Field label="Search" htmlFor="q">
            <input id="q" type="search" value={q} onChange={(e) => set('q', e.target.value)} placeholder="mario, glitch, film…" className={inputClass} />
          </Field>
          <Field label="Preview text" htmlFor="text" hint="A–Z, 0–9 and . ! ? - : ' — scenes look best at 4 to 10 letters.">
            <input id="text" value={text} maxLength={16} onChange={(e) => set('text', e.target.value, DEFAULT_TEXT)} className={`${inputClass} font-mono uppercase`} />
          </Field>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <Field label="Kind">
            <Segmented
              label="Kind"
              value={kind}
              onChange={(v) => set('kind', v, 'all')}
              options={[
                { value: 'all', label: 'All', count: counts.all },
                { value: 'classic', label: 'Classic', count: counts.classic },
                { value: 'scene', label: 'Scenes', count: counts.scene },
              ]}
            />
          </Field>
          <Field label="Palette">
            <PaletteSwatches value={palette} onChange={(v) => set('palette', v, 'ocean')} />
          </Field>
        </div>

        <Field label="Tags">
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((t) => (
              <Chip key={t} active={tags.includes(t)} onClick={() => toggleTag(t)} count={CATALOG.filter((b) => b.tags.includes(t)).length}>
                {t}
              </Chip>
            ))}
          </div>
        </Field>
      </section>

      <div className="mt-6 flex items-center justify-between text-sm text-muted">
        <p aria-live="polite">{results.length} {results.length === 1 ? 'build' : 'builds'}</p>
        {hasFilters && (
          <button type="button" onClick={() => setParams({}, { replace: true })} className="transition-colors hover:text-fg">
            Clear filters
          </button>
        )}
      </div>

      {results.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((b) => (
            <BuildCard key={b.name} entry={b} text={previewText} palette={palette} accent="rest" />
          ))}
        </div>
      ) : (
        <div className="mt-4 border border-dashed border-line px-6 py-16 text-center">
          <p className="text-fg">No build matches those filters.</p>
          <button type="button" onClick={() => setParams({}, { replace: true })} className="mt-3 text-sm text-accent hover:underline">
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
