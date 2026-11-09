import { Link } from 'react-router-dom'
import { CATALOG } from 'react-pixelmark'

// Every build's name, scrolling. Each one links to its page. The list is
// doubled so the loop is seamless; the copy is hidden from screen readers.
export default function Marquee() {
  const row = (hidden) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {CATALOG.map((b) => (
        <li key={b.name} className="flex items-center">
          <Link
            to={`/builds/${b.name}`}
            tabIndex={hidden ? -1 : undefined}
            className={`px-5 font-pixel text-sm uppercase tracking-wider transition-colors hover:text-fg ${b.kind === 'scene' ? 'text-accent' : 'text-muted'}`}
          >
            {b.title}
          </Link>
          <span aria-hidden="true" className="size-1.5 bg-line-strong" />
        </li>
      ))}
    </ul>
  )
  return (
    <div className="group overflow-hidden border-y border-line bg-surface py-4 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <nav aria-label="All builds" className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </nav>
    </div>
  )
}
