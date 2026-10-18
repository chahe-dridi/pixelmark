import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'

// Home ships in the main bundle; the other pages load when visited
const Gallery = lazy(() => import('./pages/Gallery'))
const BuildPage = lazy(() => import('./pages/BuildPage'))
const Playground = lazy(() => import('./pages/Playground'))
const Docs = lazy(() => import('./pages/Docs'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Og = lazy(() => import('./pages/Og'))

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  // the social-card source renders bare, without the site chrome
  if (pathname === '/og') return <Suspense fallback={null}><Og /></Suspense>

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg">
        Skip to content
      </a>
      <ScrollToTop />
      <Navbar />
      <main id="main" className="flex-1">
        {/* the placeholder fills the screen, so the footer never jumps when a page arrives */}
        <Suspense fallback={<div className="min-h-dvh" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/builds/:name" element={<BuildPage />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
