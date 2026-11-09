// Build the JSX snippet the site shows from a set of options. Only props
// that differ from the component's defaults are written out.
const DEFAULTS = {
  accent: 'none', palette: 'ocean', tone: 'auto', games: true, hold: 6, loop: true, interactive: true, ambient: true,
}
const ORDER = ['accent', 'palette', 'tone', 'build', 'builds', 'variants', 'colorStyle', 'label', 'hold', 'games', 'loop', 'interactive', 'ambient']

const isIdent = (k) => /^[A-Za-z_$][\w$]*$/.test(k)

/** A JS literal with single quotes and unquoted keys, like you'd write by hand. */
export function js(v) {
  if (typeof v === 'string') return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  if (Array.isArray(v)) return `[${v.map(js).join(', ')}]`
  if (v && typeof v === 'object') {
    const body = Object.entries(v).map(([k, x]) => `${isIdent(k) ? k : js(k)}: ${js(x)}`).join(', ')
    return body ? `{ ${body} }` : '{}'
  }
  return String(v)
}

export function toJsx(o, name = 'Logo') {
  const props = []
  props.push(o.text.includes('\n') ? `text={${js(o.text)}}` : `text=${JSON.stringify(o.text)}`)
  for (const key of ORDER) {
    const v = o[key]
    if (v === undefined || v === '' || v === null || v === DEFAULTS[key]) continue
    if (Array.isArray(v) && !v.length) continue
    if (typeof v === 'boolean') props.push(v ? key : `${key}={false}`)
    else if (typeof v === 'string') props.push(`${key}=${JSON.stringify(v)}`)
    else props.push(`${key}={${js(v)}}`)
  }
  const one = `<Pixelmark ${props.join(' ')} />`
  const body = one.length <= 72 ? one : `<Pixelmark\n${props.map((p) => `  ${p}`).join('\n')}\n/>`
  return `import { Pixelmark } from 'react-pixelmark'\n\nexport default function ${name}() {\n  return (\n${body.split('\n').map((l) => `    ${l}`).join('\n')}\n  )\n}`
}
