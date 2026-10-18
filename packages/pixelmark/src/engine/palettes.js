// Colour palettes. A palette has five ink tones (the letters), five accent
// tones (accent letters), a drop-shadow colour and a spark colour (flashes,
// sweeps, sparkles). Index 0 is always the highest-contrast tone against the
// page, so every colour style reads correctly in both themes; acc[2] is the
// "brand" accent itself.

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Mix two hex colours: weight 0 = a, 1 = b. */
export const mix = (a, b, weight) => {
  const ca = hexToRgb(a), cb = hexToRgb(b)
  return `#${ca.map((v, i) => Math.round(v + (cb[i] - v) * weight).toString(16).padStart(2, '0')).join('')}`
}

/**
 * Build a full palette from three colours: the letters' colour, the accent
 * and the page background behind the canvas.
 */
export function makePalette({ ink, accent, background, light = false }) {
  return {
    ink: [0, 0.15, 0.3, 0.45, 0.6].map((k) => mix(ink, background, k)),
    acc: [mix(accent, ink, 0.45), mix(accent, ink, 0.22), accent, mix(accent, background, 0.22), mix(accent, background, 0.45)],
    shadow: light ? 'rgba(0,0,0,0.12)' : mix(background, '#000000', 0.45),
    spark: light ? accent : '#FFFFFF',
  }
}

const generated = (accent, darkInk = '#F4F4F5', lightInk = '#18181B') => ({
  dark: makePalette({ ink: darkInk, accent, background: '#0B0B10' }),
  light: makePalette({ ink: lightInk, accent, background: '#FAFAFA', light: true }),
})

export const PALETTES = {
  // Cool whites with a blue accent: the "Software Engineer" portfolio look
  ocean: {
    dark: {
      ink: ['#F1F5FF', '#CFDBF5', '#A3B6DC', '#6E82AD', '#46577E'],
      acc: ['#A5F3FC', '#38BDF8', '#3B82F6', '#2563EB', '#1E3A8A'],
      shadow: '#0B1226',
      spark: '#FFFFFF',
    },
    light: {
      ink: ['#0F172A', '#1E293B', '#334155', '#475569', '#64748B'],
      acc: ['#1E3A8A', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA'],
      shadow: 'rgba(15,23,42,0.16)',
      spark: '#2563EB',
    },
  },
  // Warm creams with an orange accent: the Cubexio look
  ember: {
    dark: {
      ink: ['#FFF3E6', '#F9DDC2', '#EDBB92', '#C48A5E', '#86593A'],
      acc: ['#FFB48A', '#F78E5A', '#E05C28', '#B8461B', '#82300F'],
      shadow: '#2A1C12',
      spark: '#FFFFFF',
    },
    light: {
      ink: ['#1F1914', '#3A2C22', '#544031', '#6F5543', '#8C6F59'],
      acc: ['#A63C12', '#C84E1E', '#E05C28', '#EE7B47', '#F59A6C'],
      shadow: 'rgba(28,26,23,0.16)',
      spark: '#E05C28',
    },
  },
  mint: generated('#00C9A7', '#ECFDF8', '#0B1F1B'),
  violet: generated('#8B5CF6', '#F5F3FF', '#1E1636'),
  rose: generated('#F43F5E', '#FFF1F2', '#2A0F16'),
  gold: generated('#EAB308', '#FEFCE8', '#231C05'),
  mono: generated('#A1A1AA'),
}

export const PALETTE_NAMES = Object.keys(PALETTES)

const isFull = (p) => p && Array.isArray(p.ink) && Array.isArray(p.acc)

/**
 * Turn whatever was passed as `palette` into a concrete palette for the
 * current theme. Accepts a preset name, a full palette, a { dark, light }
 * pair of either, or the three-colour shorthand { ink, accent, background }.
 */
export function resolvePalette(palette, light) {
  const mode = light ? 'light' : 'dark'
  if (!palette) return PALETTES.ocean[mode]
  if (typeof palette === 'string') return (PALETTES[palette] || PALETTES.ocean)[mode]
  if (palette.dark || palette.light) return resolvePalette(palette[mode] || palette.dark || palette.light, light)
  if (isFull(palette)) {
    return { shadow: light ? 'rgba(0,0,0,0.12)' : '#000000', spark: light ? palette.acc[2] : '#FFFFFF', ...palette }
  }
  if (HEX.test(palette.ink || '') && HEX.test(palette.accent || '')) {
    const background = HEX.test(palette.background || '') ? palette.background : light ? '#FFFFFF' : '#000000'
    return makePalette({ ink: palette.ink, accent: palette.accent, background, light })
  }
  return PALETTES.ocean[mode]
}
