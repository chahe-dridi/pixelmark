import { Link } from 'react-router-dom'
import { Pixelmark } from 'pixelmark'
import Stage from '../components/Stage'
import { useSEO } from '../lib/useSEO'

export default function NotFound() {
  useSEO({ title: 'Page not found | pixelmark', description: 'This page does not exist.', path: '/404', noindex: true })
  return (
    <div className="wrap flex flex-col items-center pt-16 text-center">
      <Stage className="w-full max-w-3xl" screenClass="px-[12%] py-14">
        <Pixelmark text="404" accent="all" palette="ember" builds={['glitch', 'scan', 'invaders', 'pacman']} hold={3} maxWidth={420} />
      </Stage>
      <h1 className="mt-10 text-3xl font-bold text-fg sm:text-4xl">This page fell apart.</h1>
      <p className="mt-3 text-muted">And unlike the wordmark, it is not going to rebuild itself.</p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="pixel-corners bg-accent px-5 py-3 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90">Back home</Link>
        <Link to="/gallery" className="border border-line px-5 py-3 text-sm text-fg/90 transition-colors hover:border-line-strong">Browse builds</Link>
      </div>
    </div>
  )
}
