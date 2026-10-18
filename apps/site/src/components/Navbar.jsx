import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { CloseIcon, GitHubIcon, MenuIcon, MoonIcon, NpmIcon, SunIcon } from './Icons'
import { useTheme } from '../lib/useTheme'
import { NPM, REPO, VERSION } from '../lib/site'

const LINKS = [
  { to: '/gallery', label: 'Gallery' },
  { to: '/playground', label: 'Playground' },
  { to: '/docs', label: 'Docs' },
]

const iconBtn = 'grid size-10 place-items-center text-muted transition-colors hover:bg-raised hover:text-fg'

export default function Navbar() {
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors ${scrolled || open ? 'border-line bg-bg/85 backdrop-blur-md' : 'border-transparent bg-bg'}`}>
      <nav className="wrap flex h-16 items-center gap-2" aria-label="Main">
        <Link to="/" className="group mr-6 flex items-center gap-2.5 text-fg" aria-label="pixelmark home">
          <Logo size={24} />
          <span className="font-pixel text-base tracking-wide">pixelmark</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `relative px-3 py-2 text-sm transition-colors hover:text-fg ${isActive ? 'text-fg after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:bg-accent' : 'text-muted'}`}
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <a href={`${REPO}/blob/main/CHANGELOG.md`} className="mr-2 hidden border border-line px-2 py-1 font-mono text-xs text-muted transition-colors hover:border-line-strong hover:text-fg sm:inline">
            v{VERSION}
          </a>
          <a href={NPM} className={`${iconBtn} hidden sm:grid`} aria-label="pixelmark on npm"><NpmIcon size={18} /></a>
          <a href={REPO} className={iconBtn} aria-label="pixelmark on GitHub"><GitHubIcon size={18} /></a>
          <button type="button" onClick={toggle} className={iconBtn} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <Link to="/playground" className="pixel-corners ml-2 hidden bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 lg:inline-block">
            Make yours
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`${iconBtn} md:hidden`}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-nav" className="wrap border-t border-line pb-5 pt-2 md:hidden">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `flex items-center justify-between border-b border-line py-3.5 text-lg ${isActive ? 'text-fg' : 'text-muted'}`}>
              {l.label}
              <span aria-hidden="true" className="font-pixel text-xs text-accent">→</span>
            </NavLink>
          ))}
          <Link to="/playground" className="pixel-corners mt-5 block bg-accent py-3 text-center font-medium text-accent-fg">
            Make yours
          </Link>
        </div>
      )}
    </header>
  )
}
