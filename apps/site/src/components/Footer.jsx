import { Link } from 'react-router-dom'
import { Pixelmark } from 'react-pixelmark'
import Logo from './Logo'
import { InstallCommand } from './CodeBlock'
import { AUTHOR, NPM, REPO, VERSION } from '../lib/site'

const COLS = [
  {
    title: 'Explore',
    links: [
      { to: '/gallery', label: 'Gallery' },
      { to: '/gallery?kind=classic', label: 'Classic builds' },
      { to: '/gallery?kind=scene', label: 'Game & story scenes' },
      { to: '/playground', label: 'Playground' },
    ],
  },
  {
    title: 'Docs',
    links: [
      { to: '/docs#install', label: 'Install' },
      { to: '/docs#props', label: 'Props' },
      { to: '/docs#variants', label: 'Scene variants' },
      { to: '/docs#vanilla', label: 'Without React' },
    ],
  },
  {
    title: 'Project',
    links: [
      { href: REPO, label: 'GitHub' },
      { href: NPM, label: 'npm' },
      { href: `${REPO}/blob/main/CHANGELOG.md`, label: 'Changelog' },
      { href: `${REPO}/blob/main/CONTRIBUTING.md`, label: 'Contribute a build' },
    ],
  },
]

const linkClass = 'text-fg/75 transition-colors hover:text-accent'

export default function Footer() {
  return (
    <footer className="mt-32 border-t border-line bg-surface">
      <div className="wrap grid gap-12 py-14 lg:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))]">
        <div className="max-w-sm">
          <Link to="/" className="flex items-center gap-2.5 text-fg" aria-label="pixelmark home">
            <Logo size={24} />
            <span className="font-pixel text-base">pixelmark</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Animated pixel-art wordmarks for React. One canvas, no dependencies, and every scene loads only when it plays.
          </p>
          <InstallCommand className="mt-6" />
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <h2 className="font-pixel text-[11px] uppercase tracking-widest text-muted">{col.title}</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.to
                    ? <Link to={l.to} className={linkClass}>{l.label}</Link>
                    : <a href={l.href} className={linkClass}>{l.label}</a>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* The wordmark, big and quiet, as the footer's sign-off */}
      <div className="wrap pb-6 opacity-60 transition-opacity hover:opacity-100">
        <Pixelmark text="PIXELMARK" games={false} hold={8} ambient={false} maxWidth="100%" palette="mono" aria-label="pixelmark" />
      </div>

      <div className="border-t border-line">
        <div className="wrap flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            MIT © 2026 <a href={AUTHOR.url} className="text-fg/80 underline decoration-line-strong underline-offset-2 hover:text-accent">{AUTHOR.name}</a> · v{VERSION}
          </p>
          <p>The game and film scenes are fan tributes, not affiliated with or endorsed by the rights holders.</p>
        </div>
      </div>
    </footer>
  )
}
