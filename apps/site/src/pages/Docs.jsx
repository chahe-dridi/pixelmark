import { Link } from 'react-router-dom'
import { CATALOG, PALETTES, PALETTE_NAMES, Pixelmark } from 'pixelmark'
import CodeBlock, { InstallCommand } from '../components/CodeBlock'
import { REPO } from '../lib/site'

const SECTIONS = [
  ['install', 'Install'],
  ['usage', 'Usage'],
  ['props', 'Props'],
  ['palettes', 'Palettes'],
  ['accent', 'Accent'],
  ['builds', 'Builds'],
  ['vanilla', 'Without React'],
  ['notes', 'Performance & a11y'],
]

const PROPS = [
  ['text', 'string', "'PIXELMARK'", 'Text to draw. A–Z, 0–9, space and . ! ? - : \'. Case and accents are ignored; \\n starts a new line.'],
  ['accent', "'none' | 'all' | 'first' | 'rest' | 'last' | number[] | (char, i) => boolean", "'none'", 'Which characters take the accent colour.'],
  ['palette', 'PaletteName | Palette | { ink, accent, background? } | { dark, light }', "'ocean'", 'Colours. See Palettes below.'],
  ['tone', "'auto' | 'light' | 'dark'", "'auto'", 'auto follows a dark/light class or data-theme on <html>, then the OS setting.'],
  ['build', 'BuildName', '—', 'Pin one build; it replays every cycle.'],
  ['builds', 'BuildName[]', 'all', 'Only rotate through these builds.'],
  ['games', 'boolean', 'true', 'Include the game & story scenes. They need single-line text.'],
  ['colorStyle', "'bands' | 'solid' | 'letters' | 'mosaic' | 'stripes'", 'rotates', 'Pin one colour style.'],
  ['label', 'string', 'first word', 'Short text a few scenes print (XP installer, Street Fighter HUD, Marauder\'s Map).'],
  ['hold', 'number', '6', 'Seconds the finished wordmark holds before it rebuilds.'],
  ['loop', 'boolean', 'true', 'Keep rebuilding. false builds once and stays.'],
  ['interactive', 'boolean', 'true', 'Pixels dodge the mouse; a click skips to the next build.'],
  ['ambient', 'boolean', 'true', 'Loose pixels drift up off the letters while it holds.'],
  ['onBuild', '(name) => void', '—', 'Called with the build name each time one starts.'],
  ['maxWidth', 'number | string', '1100', 'CSS max-width. The canvas fills its container up to this.'],
  ['bleed', 'boolean', 'false', 'Pull the blank padding out with negative margins so the letters line up with text beside them.'],
  ['ref', 'PixelmarkHandle', '—', 'ref.current.next() skips ahead; ref.current.canvas is the element.'],
]

const USAGE = `import { useRef } from 'react'
import { Pixelmark } from 'pixelmark'

export function Hero() {
  const mark = useRef(null)
  return (
    <>
      <h1 className="sr-only">Software Engineer</h1>
      <Pixelmark
        ref={mark}
        text="Software Engineer"
        accent="rest"          // "ENGINEER" in the accent colour
        palette="ember"
        builds={['laser', 'matrix', 'mario', 'starwars']}
        onBuild={(name) => console.log('now playing', name)}
      />
      <button onClick={() => mark.current.next()}>Next</button>
    </>
  )
}`

const PALETTE_CODE = `// a preset
<Pixelmark palette="mint" />

// three colours, the tones are derived
<Pixelmark palette={{ ink: '#F5F5F4', accent: '#F97316', background: '#0C0A09' }} />

// a different palette per theme
<Pixelmark palette={{
  dark:  { ink: '#FFFFFF', accent: '#22D3EE' },
  light: { ink: '#0F172A', accent: '#0891B2', background: '#FFFFFF' },
}} />

// or full control: five tones each, index 0 = most contrast
<Pixelmark palette={{
  ink: ['#fff', '#ddd', '#bbb', '#999', '#777'],
  acc: ['#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c'],
  shadow: '#1c1917',
  spark: '#ffffff',
}} />`

const ACCENT_CODE = `<Pixelmark text="Software Engineer" accent="rest" />   // ENGINEER
<Pixelmark text="Hello World" accent="first" />          // HELLO
<Pixelmark text="CUBEXIO" accent={[4]} />                // just the X
<Pixelmark text="ABC" accent={(ch) => 'AEIOU'.includes(ch)} />`

const VANILLA = `import { mount } from 'pixelmark/vanilla'

const mark = mount(document.querySelector('#logo'), {
  text: 'HELLO',
  palette: 'violet',
  build: 'tetris',
})

mark.next()     // skip ahead
mark.destroy()  // stop and clean up`

const H2 = ({ id, children }) => (
  <h2 id={id} className="scroll-mt-24 border-t border-line pt-10 text-2xl font-bold tracking-tight text-fg">{children}</h2>
)
const Code = ({ children }) => <code className="bg-raised px-1.5 py-0.5 font-mono text-[0.85em] text-fg">{children}</code>

export default function Docs() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <header className="max-w-2xl">
        <p className="font-pixel text-xs uppercase tracking-wider text-accent">Docs</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl">Everything it takes.</h1>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[180px_1fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 space-y-2 text-sm">
            {SECTIONS.map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="text-muted transition-colors hover:text-fg">{label}</a></li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 max-w-3xl space-y-6 leading-relaxed text-fg/90">
          <h2 id="install" className="scroll-mt-24 text-2xl font-bold tracking-tight text-fg">Install</h2>
          <InstallCommand className="max-w-md" />
          <p className="text-muted">
            React 18 or newer is the only peer dependency. The package is ESM-only, ships its own types, and is safe to
            server-render: the engine only starts in the browser.
          </p>

          <H2 id="usage">Usage</H2>
          <p className="text-muted">
            The canvas fills its container's width (up to <Code>maxWidth</Code>) and keeps its aspect ratio. It is an{' '}
            <Code>img</Code> with your text as its label; if it replaces a heading, keep a visually hidden heading for search engines.
          </p>
          <CodeBlock title="Hero.jsx" code={USAGE} />

          <H2 id="props">Props</H2>
          <p className="text-muted">All optional. Any other prop (<Code>id</Code>, <Code>onClick</Code>…) goes to the canvas.</p>
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
                <tr><th className="px-3 py-2.5 font-medium">Prop</th><th className="px-3 py-2.5 font-medium">Type</th><th className="px-3 py-2.5 font-medium">Default</th><th className="px-3 py-2.5 font-medium">Description</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {PROPS.map(([name, type, def, desc]) => (
                  <tr key={name} className="align-top">
                    <td className="px-3 py-2.5 font-mono text-accent">{name}</td>
                    <td className="max-w-56 px-3 py-2.5 font-mono text-xs text-muted">{type}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{def}</td>
                    <td className="px-3 py-2.5 text-muted">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H2 id="palettes">Palettes</H2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PALETTE_NAMES.map((name) => (
              <div key={name} className="flex items-center gap-4 border border-line bg-surface p-3">
                <div className="w-28 shrink-0">
                  <Pixelmark text="AB" accent={[1]} palette={name} build="assemble" loop={false} interactive={false} ambient={false} aria-label={`${name} palette sample`} />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm text-fg">{name}</p>
                  <div className="mt-1.5 flex">
                    {[...PALETTES[name].dark.ink, ...PALETTES[name].dark.acc].map((c, i) => (
                      <span key={i} className="size-3" style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <CodeBlock title="palettes.jsx" code={PALETTE_CODE} />

          <H2 id="accent">Accent</H2>
          <p className="text-muted">
            Accent letters use the palette's accent tones. Indices count every character of the text, spaces and line breaks included.
          </p>
          <CodeBlock title="accent.jsx" code={ACCENT_CODE} />

          <H2 id="builds">Builds</H2>
          <p className="text-muted">
            {CATALOG.length} builds in two kinds. <strong className="text-fg">Classic</strong> builds are built into the engine
            and work on any text. <strong className="text-fg">Scenes</strong> are game and story cutscenes, each in its own
            chunk, downloaded only when it is about to play; they need single-line text. <Code>CATALOG</Code> exports the
            names, titles, tags and descriptions if you want to build your own picker.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CATALOG.map((b) => (
              <Link key={b.name} to={`/playground?build=${b.name}`} className={`border border-line px-2 py-1 font-mono text-xs transition-colors hover:border-accent hover:text-fg ${b.kind === 'scene' ? 'text-accent' : 'text-muted'}`}>
                {b.name}
              </Link>
            ))}
          </div>

          <H2 id="vanilla">Without React</H2>
          <p className="text-muted">
            <Code>pixelmark/vanilla</Code> mounts the same engine on any canvas: Vue, Svelte, Astro or a plain page.
          </p>
          <CodeBlock title="main.js" code={VANILLA} />

          <H2 id="notes">Performance & accessibility</H2>
          <ul className="list-disc space-y-2 pl-5 text-muted marker:text-accent">
            <li>One canvas and a few hundred <Code>fillRect</Code> calls a frame; React never re-renders while it animates.</li>
            <li>Frames only run while the canvas is on screen and the tab is visible. The idle hold is throttled to 20–30 fps.</li>
            <li>Device pixel ratio is capped at 2, and touch devices skip the pointer effects.</li>
            <li>With <Code>prefers-reduced-motion</Code>, the finished wordmark is drawn once, without animation.</li>
            <li>Scenes are code-split: a page that only plays classic builds never downloads them.</li>
          </ul>
          <p className="text-muted">
            Want to add a build? The contract is short; see{' '}
            <a href={`${REPO}/blob/main/CONTRIBUTING.md`} className="text-accent hover:underline">CONTRIBUTING.md</a>.
          </p>
        </article>
      </div>
    </div>
  )
}
