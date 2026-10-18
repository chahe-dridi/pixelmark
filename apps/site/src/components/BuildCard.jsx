import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Pixelmark } from 'pixelmark'
import { ArrowIcon, SkipIcon } from './Icons'

// One build in the gallery: a live preview pinned to that build, with its
// name, what happens, and links to replay it or open it in the playground.
export default function BuildCard({ entry, text, palette, accent }) {
  const mark = useRef(null)
  const isScene = entry.kind === 'scene'

  return (
    <article className="group flex flex-col border border-line bg-surface transition-colors hover:border-muted/60">
      <div className="pixel-grid relative border-b border-line bg-bg px-3 py-5">
        <Pixelmark
          ref={mark}
          text={text}
          build={entry.name}
          palette={palette}
          accent={accent}
          hold={3.5}
          ambient={false}
          aria-label={`${entry.title} build of ${text}`}
          className="mx-auto"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-semibold text-fg">{entry.title}</h3>
          <span className={`font-pixel text-[10px] uppercase tracking-wider ${isScene ? 'text-accent' : 'text-muted'}`}>
            {isScene ? 'Scene' : 'Classic'}
          </span>
        </div>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{entry.description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {entry.tags.map((t) => (
            <span key={t} className="bg-raised px-2 py-0.5 font-mono text-[11px] text-muted">{t}</span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
          <button
            type="button"
            onClick={() => mark.current?.next()}
            className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg"
          >
            <SkipIcon size={14} /> Replay
          </button>
          <Link
            to={`/playground?build=${entry.name}`}
            className="inline-flex items-center gap-1.5 text-fg/80 transition-colors hover:text-accent"
          >
            Customize <ArrowIcon size={14} />
          </Link>
        </div>
      </div>
    </article>
  )
}
