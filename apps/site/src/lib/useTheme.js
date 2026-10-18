import { useCallback, useEffect, useState } from 'react'

// The site's light/dark switch. It toggles `dark`/`light` on <html>, which
// is also what every <Pixelmark tone="auto"> on the page follows.
const current = () => (document.documentElement.classList.contains('light') ? 'light' : 'dark')

export function useTheme() {
  const [theme, setTheme] = useState(current)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0B0B10' : '#F7F7F4')
    try { localStorage.setItem('pixelmark-theme', theme) } catch { /* private mode */ }
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  return { theme, toggle }
}
