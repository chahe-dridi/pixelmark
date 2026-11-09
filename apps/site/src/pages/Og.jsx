import { Pixelmark } from 'react-pixelmark'
import Logo from '../components/Logo'
import { useSEO } from '../lib/useSEO'

// The source of /og.png (the 1200×630 social preview). Not linked anywhere:
// `npm run og` screenshots it with headless Chrome.
export default function Og() {
  useSEO({ title: 'pixelmark', description: 'Social card source', path: '/og', noindex: true })
  return (
    <div className="stage flex h-[630px] w-[1200px] flex-col justify-between overflow-hidden p-16">
      <div className="flex items-center gap-3 text-fg">
        <Logo size={40} />
        <span className="font-pixel text-3xl">pixelmark</span>
      </div>
      <Pixelmark text="PIXEL MARK" accent="rest" build="assemble" colorStyle="solid" loop={false} ambient={false} interactive={false} maxWidth="100%" tone="dark" />
      <div className="flex items-end justify-between">
        <p className="text-3xl font-semibold text-fg">Animated pixel-art wordmarks for React</p>
        <p className="font-mono text-xl text-muted">35 builds · 0 deps</p>
      </div>
    </div>
  )
}
