// Page titles and descriptions, shared by the running site (useSEO) and the
// build-time prerender script, which bakes them into each route's HTML so
// crawlers and link previews see them without running JavaScript.
// Plain data only: no imports, so Node can load this file as is.

export const SITE_URL = 'https://pixelmark.vercel.app'
export const SITE_NAME = 'pixelmark'

const DEFAULT_DESCRIPTION =
  'Turn any text into an animated pixel-art wordmark for React: 19 classic pixel effects and 16 game & story cutscenes with selectable variants. One canvas, zero dependencies.'

export const ROUTES = {
  '/': {
    title: 'pixelmark: animated pixel-art wordmarks for React',
    description: DEFAULT_DESCRIPTION,
  },
  '/gallery': {
    title: 'Gallery: all 35 builds, live | pixelmark',
    description: 'Every pixelmark build playing live: laser, sand, Matrix rain, Tetris, plus Mario, Pac-Man, Street Fighter, Star Wars and more. Filter by kind, tag and variants, and preview your own text.',
  },
  '/playground': {
    title: 'Playground: design your wordmark | pixelmark',
    description: 'Type your text, pick builds, scene variants, palette and accent, and copy the ready-to-paste React code.',
  },
  '/docs': {
    title: 'Docs: props, palettes, variants | pixelmark',
    description: 'Install pixelmark and learn every prop: palettes, accent words, pinned builds, shortlists, scene variants, and the framework-free mount().',
  },
}

export const buildMeta = (entry) => ({
  title: `${entry.title} ${entry.kind === 'scene' ? 'scene' : 'pixel build'} | pixelmark`,
  description: `${entry.description} A ${entry.kind === 'scene' ? 'game & story cutscene' : 'classic pixel effect'} for the pixelmark React wordmark${entry.variants?.length ? `, with ${entry.variants.length} selectable variants` : ''}.`,
})

export const DEFAULT_META = ROUTES['/']
