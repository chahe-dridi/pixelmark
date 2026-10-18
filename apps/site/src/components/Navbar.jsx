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

const linkClass = ({ isActive }) =>
  `px-3 py-2 text-sm transition-colors hover:text-fg ${isActive ? 'text-fg' : 'text-muted'}`

const iconBtn = 'grid size-9 place-items-center text-muted transition-colors hover:bg-raised hover:text-fg'

export default function Navbar() {
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6" aria-label="Main">
        <Link to="/" className="mr-4 flex items-center gap-2 text-fg">
          <Logo />
          <span className="font-pixel text-[15px] tracking-wide">pixelmark</span>
        </Link>

        <div className="hidden items-center md:flex">
          {LINKS.map((l) => <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>)}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <span className="mr-2 hidden border border-line px-2 py-0.5 font-mono text-xs text-muted sm:inline">v{VERSION}</span>
          <a href={NPM} className={`${iconBtn} hidden sm:grid`} aria-label="pixelmark on npm"><NpmIcon size={18} /></a>
          <a href={REPO} className={iconBtn} aria-label="pixelmark on GitHub"><GitHubIcon size={17} /></a>
          <button type="button" onClick={toggle} className={iconBtn} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`${iconBtn} md:hidden`}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Menu"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-nav" className="border-t border-line px-4 py-3 md:hidden">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `block py-2.5 text-base ${isActive ? 'text-fg' : 'text-muted'}`}>
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
