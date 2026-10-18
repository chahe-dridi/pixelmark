import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pixelmark } from 'pixelmark'
import { ArrowIcon, LayersIcon, SkipIcon } from './Icons'
import VariantPicker from './VariantPicker'
import { countPicks, toSceneVariants } from '../lib/variants'

// One build in the gallery: a live preview pinned to that build, its name
// and story, and (for scenes) an inline picker for its variants.
export default function BuildCard({ entry, text, palette, accent, index }) {
  const mark = useRef(null)
  const [picks, setPicks] = useState({})
  const [open, setOpen] = useState(false)
  const isScene = entry.kind === 'scene'
  const nVariants = entry.variants.length
  const variants = useMemo(() => {
    const v = toSceneVariants(picks)
    return v ? { [entry.name]: v } : undefined
  }, [picks, entry.name])
  const active = countPicks(picks)

  return (
    <article className="group relative flex flex-col border border-line bg-surface transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong">
      <div className="stage relative z-10 border-b border-line px-[6%] py-7">
        <span className="absolute left-3 top-2.5 font-mono text-[10px] text-muted/70">{String(index + 1).padStart(2, '0')}</span>
        <Pixelmark
          ref={mark}
          text={text}
          build={entry.name}
          variants={variants}
          palette={palette}
          accent={accent}
          hold={3.5}
          ambient={false}
          aria-label={`${entry.title} build of ${text}`}
        />
        <button
          type="button"
          onClick={() => mark.current?.next()}
          className="absolute bottom-2 right-2 inline-flex items-center gap-1 border border-line bg-surface/90 px-2 py-1 text-[11px] text-muted opacity-0 transition-opacity hover:text-fg focus-visible:opacity-100 group-hover:opacity-100"
          aria-label={`Replay ${entry.title}`}
        >
          <SkipIcon size={12} /> Replay
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-tight text-fg">
            <Link to={`/builds/${entry.name}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
              {entry.title}
            </Link>
          </h3>
          <span className={`shrink-0 border px-1.5 py-0.5 font-pixel text-[9px] uppercase tracking-wider ${isScene ? 'border-accent/40 text-accent' : 'border-line text-muted'}`}>
            {isScene ? 'Scene' : 'Classic'}
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{entry.description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <span key={t} className="bg-raised px-2 py-0.5 font-mono text-[11px] text-muted">#{t}</span>
          ))}
        </div>

        <div className="relative z-10 mt-4 flex items-center justify-between gap-2 border-t border-line pt-3 text-sm">
          {nVariants ? (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className={`inline-flex items-center gap-1.5 transition-colors hover:text-fg ${open || active ? 'text-fg' : 'text-muted'}`}
            >
              <LayersIcon size={14} />
              {nVariants} variant{nVariants > 1 ? 's' : ''}
              {active > 0 && <span className="bg-accent px-1.5 font-mono text-[10px] text-accent-fg">{active} set</span>}
            </button>
          ) : (
            <span className="text-xs text-muted">{isScene ? 'One story' : 'Works on any text'}</span>
          )}
          <Link to={`/builds/${entry.name}`} className="inline-flex items-center gap-1.5 text-fg/80 transition-colors hover:text-accent">
            Details <ArrowIcon size={14} />
          </Link>
        </div>

        {open && (
          <div className="relative z-10 mt-3 border-t border-dashed border-line pt-3">
            <VariantPicker scene={entry.name} picks={picks} onChange={setPicks} compact />
          </div>
        )}
      </div>
    </article>
  )
}
