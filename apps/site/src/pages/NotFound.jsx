import { Link } from 'react-router-dom'
import { Pixelmark } from 'pixelmark'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-20 text-center sm:px-6">
      <Pixelmark text="404" accent="all" builds={['glitch', 'scan', 'invaders', 'pacman']} maxWidth={360} />
      <h1 className="mt-8 text-2xl font-bold text-fg">This page fell apart.</h1>
      <p className="mt-2 text-muted">And unlike the wordmark, it is not going to rebuild itself.</p>
      <Link to="/" className="pixel-corners mt-8 bg-accent px-5 py-3 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90">
        Back home
      </Link>
    </div>
  )
}
