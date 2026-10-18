import { Link } from 'react-router-dom'
import Logo from './Logo'
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
      { to: '/docs#palettes', label: 'Palettes' },
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

const linkClass = 'text-fg/80 transition-colors hover:text-accent'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link to="/" className="flex items-center gap-2 text-fg">
            <Logo />
            <span className="font-pixel text-[15px]">pixelmark</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Animated pixel-art wordmarks for React. One canvas, no dependencies, and every scene loads only when it plays.
          </p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <h2 className="font-pixel text-xs uppercase tracking-wider text-muted">{col.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
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
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            MIT © 2026 <a href={AUTHOR.url} className="text-fg/80 hover:text-accent">{AUTHOR.name}</a> · v{VERSION}
          </p>
          <p>The game and film scenes are fan tributes, not affiliated with or endorsed by the rights holders.</p>
        </div>
      </div>
    </footer>
  )
}
