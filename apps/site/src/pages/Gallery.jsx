import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CATALOG, PALETTE_NAMES, TAGS } from 'react-pixelmark'
import BuildCard from '../components/BuildCard'
import { Field, PaletteSwatches, inputClass } from '../components/Controls'
import { CloseIcon, FilterIcon, SearchIcon } from '../components/Icons'
import { useDebounced } from '../lib/useDebounced'
import { useSEO } from '../lib/useSEO'
import { ROUTES } from '../lib/meta'

const DEFAULT_TEXT = 'PIXEL MARK'
const KINDS = [
  { value: 'all', label: 'Everything' },
  { value: 'classic', label: 'Classic effects' },
  { value: 'scene', label: 'Game & story scenes' },
]
const VARIANT_FILTERS = [
  { value: 'any', label: 'Any' },
  { value: 'with', label: 'Has variants' },
  { value: 'many', label: '4 or more' },
]
const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'az', label: 'Name A–Z' },
  { value: 'variants', label: 'Most variants' },
  { value: 'kind', label: 'Kind' },
]
const SIZES = [
  { value: 's', label: 'S', min: '260px' },
  { value: 'm', label: 'M', min: '340px' },
  { value: 'l', label: 'L', min: '480px' },
]
const ACCENTS = [
  { value: 'rest', label: '2nd word' },
  { value: 'none', label: 'None' },
  { value: 'all', label: 'All' },
]

// Featured: classic and scenes interleaved, so the first screen shows both
const FEATURED = (() => {
  const c = CATALOG.filter((b) => b.kind === 'classic'), s = CATALOG.filter((b) => b.kind === 'scene')
  const out = []
  for (let i = 0; i < Math.max(c.length, s.length); i++) out.push(s[i], c[i])
  return out.filter(Boolean).map((b) => b.name)
})()
const tagCount = Object.fromEntries(TAGS.map((t) => [t, CATALOG.filter((b) => b.tags.includes(t)).length]))

function Section({ title, children }) {
  return (
    <div className="border-b border-line py-5 first:pt-0 last:border-0">
      <h2 className="mb-3 font-pixel text-[10px] uppercase tracking-widest text-muted">{title}</h2>
      {children}
    </div>
  )
}

function RadioList({ name, value, onChange, options, counts }) {
  return (
    <div role="radiogroup" aria-label={name} className="space-y-0.5">
      {options.map((o) => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`flex w-full items-center justify-between px-2.5 py-2 text-left text-sm transition-colors ${on ? 'bg-accent-soft text-fg' : 'text-muted hover:bg-raised hover:text-fg'}`}
          >
            <span className="flex items-center gap-2.5">
              <span aria-hidden="true" className={`size-2 ${on ? 'bg-accent' : 'border border-line-strong'}`} />
              {o.label}
            </span>
            {counts && <span className="font-mono text-xs opacity-70">{counts[o.value]}</span>}
          </button>
        )
      })}
    </div>
  )
}

export default function Gallery() {
  useSEO({ ...ROUTES['/gallery'], path: '/gallery' })
  const [params, setParams] = useSearchParams()
  const [drawer, setDrawer] = useState(false)
  const searchRef = useRef(null)

  const get = (key, allowed, fallback) => (allowed.includes(params.get(key)) ? params.get(key) : fallback)
  const kind = get('kind', ['classic', 'scene'], 'all')
  const vf = get('variants', ['with', 'many'], 'any')
  const sort = get('sort', ['az', 'variants', 'kind'], 'featured')
  const size = get('size', ['s', 'l'], 'm')
  const accent = get('accent', ['none', 'all'], 'rest')
  const palette = get('palette', PALETTE_NAMES, 'ocean')
  const tags = (params.get('tags') || '').split(',').filter((t) => TAGS.includes(t))
  const q = params.get('q') || ''
  const text = params.get('text') ?? DEFAULT_TEXT

  const set = (key, value, fallback = '') => {
    const next = new URLSearchParams(params)
    if (!value || value === fallback) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }
  const toggleTag = (t) => set('tags', (tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]).join(','))
  const clearFilters = () => {
    const next = new URLSearchParams()
    for (const k of ['text', 'palette', 'accent', 'size', 'sort']) if (params.get(k)) next.set(k, params.get(k))
    setParams(next, { replace: true })
  }

  // "/" jumps to the search box
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName)) { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'Escape') setDrawer(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawer])

  // Rebuilding 35 canvases on every keystroke would stutter: wait for a pause
  const previewText = useDebounced(text.trim() || DEFAULT_TEXT, 350)

  const base = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return CATALOG.filter((b) =>
      tags.every((t) => b.tags.includes(t)) &&
      (vf === 'any' || (vf === 'with' ? b.variants.length > 0 : b.variants.length >= 4)) &&
      (!needle || `${b.name} ${b.title} ${b.description} ${b.tags.join(' ')} ${b.variants.flatMap((v) => v.options.map((o) => o[1])).join(' ')}`.toLowerCase().includes(needle)))
  }, [tags, vf, q])
  const kindCounts = { all: base.length, classic: base.filter((b) => b.kind === 'classic').length, scene: base.filter((b) => b.kind === 'scene').length }

  const results = useMemo(() => {
    const list = base.filter((b) => kind === 'all' || b.kind === kind)
    if (sort === 'az') return [...list].sort((a, b) => a.title.localeCompare(b.title))
    if (sort === 'variants') return [...list].sort((a, b) => b.variants.length - a.variants.length)
    if (sort === 'kind') return [...list].sort((a, b) => a.kind.localeCompare(b.kind))
    return [...list].sort((a, b) => FEATURED.indexOf(a.name) - FEATURED.indexOf(b.name))
  }, [base, kind, sort])

  const active = [
    kind !== 'all' && { label: KINDS.find((k) => k.value === kind).label, clear: () => set('kind', '') },
    vf !== 'any' && { label: VARIANT_FILTERS.find((v) => v.value === vf).label, clear: () => set('variants', '') },
    q && { label: `“${q}”`, clear: () => set('q', '') },
    ...tags.map((t) => ({ label: `#${t}`, clear: () => toggleTag(t) })),
  ].filter(Boolean)

  const filters = (
    <>
      <Section title="Kind">
        <RadioList name="Kind" value={kind} onChange={(v) => set('kind', v, 'all')} options={KINDS} counts={kindCounts} />
      </Section>
      <Section title="Scene variants">
        <RadioList name="Scene variants" value={vf} onChange={(v) => set('variants', v, 'any')} options={VARIANT_FILTERS} />
      </Section>
      <Section title="Tags">
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map((t) => {
            const on = tags.includes(t)
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => toggleTag(t)}
                className={`border px-2 py-1 font-mono text-xs transition-colors ${on ? 'border-accent bg-accent text-accent-fg' : 'border-line text-muted hover:border-line-strong hover:text-fg'}`}
              >
                #{t} <span className="opacity-60">{tagCount[t]}</span>
              </button>
            )
          })}
        </div>
      </Section>
      <Section title="Preview">
        <div className="space-y-4">
          <Field label="Your text" htmlFor="g-text" hint="Scenes look best at 4 to 12 letters.">
            <input id="g-text" value={text} maxLength={18} onChange={(e) => set('text', e.target.value, DEFAULT_TEXT)} className={`${inputClass} font-mono uppercase`} />
          </Field>
          <Field label="Palette">
            <PaletteSwatches value={palette} onChange={(v) => set('palette', v, 'ocean')} />
          </Field>
          <Field label="Accent">
            <div className="grid grid-cols-3 border border-line">
              {ACCENTS.map((a) => (
                <button key={a.value} type="button" aria-pressed={accent === a.value} onClick={() => set('accent', a.value, 'rest')}
                  className={`py-1.5 text-xs transition-colors ${accent === a.value ? 'bg-raised text-fg' : 'text-muted hover:text-fg'}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>
    </>
  )

  const minCol = SIZES.find((s) => s.value === size).min

  return (
    <div className="wrap pt-10 sm:pt-14">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="font-pixel text-xs uppercase tracking-widest text-accent">Gallery</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-6xl">Every build, live.</h1>
          <div className="pixel-rule mt-5 w-40" aria-hidden="true" />
          <p className="mt-5 text-lg text-muted">
            Type your own text in the preview panel and watch all {CATALOG.length} builds draw it. Scenes have variants:
            open a card's variants to pick exactly which version plays.
          </p>
        </div>
        <dl className="grid grid-cols-3 border border-line text-center">
          {[['Builds', CATALOG.length], ['Scenes', CATALOG.filter((b) => b.kind === 'scene').length], ['Variants', CATALOG.reduce((n, b) => n + b.variants.reduce((m, v) => m + v.options.length, 0), 0)]].map(([k, v]) => (
            <div key={k} className="border-r border-line px-5 py-3 last:border-0">
              <dt className="font-pixel text-[10px] uppercase tracking-widest text-muted">{k}</dt>
              <dd className="mt-1 font-mono text-2xl text-fg">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2">{filters}</div>
        </aside>

        <section aria-labelledby="builds-heading" className="min-w-0">
          <h2 id="builds-heading" className="sr-only">Builds</h2>
          {/* toolbar */}
          <div className="flex flex-col gap-3 border border-line bg-surface p-3 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Search builds</span>
              <SearchIcon size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={searchRef}
                type="search"
                value={q}
                onChange={(e) => set('q', e.target.value)}
                placeholder="Search builds, tags, variants…"
                className={`${inputClass} pl-9 pr-10`}
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 border border-line px-1.5 font-mono text-[10px] text-muted sm:block">/</kbd>
            </label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setDrawer(true)} className="inline-flex items-center gap-2 border border-line px-3 py-2 text-sm text-fg/90 transition-colors hover:border-line-strong lg:hidden">
                <FilterIcon size={14} /> Filters
                {active.length > 0 && <span className="bg-accent px-1.5 font-mono text-[10px] text-accent-fg">{active.length}</span>}
              </button>
              <label className="flex items-center gap-2 text-sm text-muted">
                <span className="hidden sm:inline">Sort</span>
                <select value={sort} onChange={(e) => set('sort', e.target.value, 'featured')} className={`${inputClass} w-auto cursor-pointer py-1.5`} aria-label="Sort builds">
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
              <div role="radiogroup" aria-label="Card size" className="hidden border border-line sm:flex">
                {SIZES.map((s) => (
                  <button key={s.value} type="button" role="radio" aria-checked={size === s.value} onClick={() => set('size', s.value, 'm')}
                    className={`size-9 font-mono text-xs transition-colors ${size === s.value ? 'bg-raised text-fg' : 'text-muted hover:text-fg'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex min-h-8 flex-wrap items-center gap-2 text-sm">
            <p aria-live="polite" className="mr-2 text-muted">
              <span className="font-mono text-fg">{results.length}</span> {results.length === 1 ? 'build' : 'builds'}
            </p>
            {active.map((f) => (
              <button key={f.label} type="button" onClick={f.clear} className="inline-flex items-center gap-1.5 border border-line bg-raised px-2 py-1 text-xs text-fg/90 transition-colors hover:border-accent" aria-label={`Remove filter ${f.label}`}>
                {f.label} <CloseIcon size={10} />
              </button>
            ))}
            {active.length > 1 && <button type="button" onClick={clearFilters} className="text-xs text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">Clear all</button>}
          </div>

          {results.length ? (
            <div className="mt-4 grid gap-4 xl:gap-5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minCol}), 1fr))` }}>
              {results.map((b, i) => (
                <BuildCard key={b.name} entry={b} index={i} text={previewText} palette={palette} accent={accent} />
              ))}
            </div>
          ) : (
            <div className="stage mt-4 border border-dashed border-line px-6 py-20 text-center">
              <p className="font-pixel text-sm uppercase text-fg">No match</p>
              <p className="mt-2 text-sm text-muted">Nothing fits all of those filters.</p>
              <button type="button" onClick={clearFilters} className="mt-4 text-sm text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">Clear filters</button>
            </div>
          )}
        </section>
      </div>

      {/* mobile filter drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" aria-label="Close filters" onClick={() => setDrawer(false)} className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-y-0 right-0 flex w-[min(100%,380px)] flex-col border-l border-line bg-bg">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <span className="font-pixel text-sm uppercase">Filters</span>
              <button type="button" onClick={() => setDrawer(false)} className="grid size-10 place-items-center text-muted hover:text-fg" aria-label="Close filters"><CloseIcon /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{filters}</div>
            <div className="flex gap-3 border-t border-line p-4">
              <button type="button" onClick={clearFilters} className="flex-1 border border-line py-2.5 text-sm text-fg/90">Clear</button>
              <button type="button" onClick={() => setDrawer(false)} className="pixel-corners flex-1 bg-accent py-2.5 text-sm font-medium text-accent-fg">
                Show {results.length}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
