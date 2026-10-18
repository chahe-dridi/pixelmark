// Build the JSX snippet shown in the playground from its current options.
// Only props that differ from the component's defaults are written out.
const DEFAULTS = {
  accent: 'none', palette: 'ocean', tone: 'auto', games: true, hold: 6, loop: true, interactive: true, ambient: true,
}

const literal = (v) => (typeof v === 'string' ? JSON.stringify(v) : `{${JSON.stringify(v)}}`)

export function toJsx(o) {
  const props = []
  const text = o.text.includes('\n') ? `{${JSON.stringify(o.text)}}` : JSON.stringify(o.text)
  props.push(`text=${text}`)
  for (const key of ['accent', 'palette', 'tone', 'build', 'colorStyle', 'label', 'hold', 'games', 'loop', 'interactive', 'ambient']) {
    const v = o[key]
    if (v === undefined || v === '' || v === null || v === DEFAULTS[key]) continue
    if (typeof v === 'boolean') props.push(v ? key : `${key}={false}`)
    else if (typeof v === 'number') props.push(`${key}={${v}}`)
    else props.push(`${key}=${literal(v)}`)
  }
  const one = `<Pixelmark ${props.join(' ')} />`
  const body = one.length <= 72 ? one : `<Pixelmark\n${props.map((p) => `  ${p}`).join('\n')}\n/>`
  return `import { Pixelmark } from 'pixelmark'\n\nexport default function Logo() {\n  return (\n${body.split('\n').map((l) => `    ${l}`).join('\n')}\n  )\n}`
}
