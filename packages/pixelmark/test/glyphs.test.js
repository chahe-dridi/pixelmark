import { describe, expect, it } from 'vitest'
import { GLYPHS, normalizeText, wordmarkSize } from '../src/engine/glyphs'
import { GH } from '../src/engine/kit'

describe('glyphs', () => {
  it('every glyph is 13 rows of equal width, drawn with # and .', () => {
    for (const [ch, rows] of Object.entries(GLYPHS)) {
      expect(rows, ch).toHaveLength(GH)
      const w = rows[0].length
      for (const row of rows) {
        expect(row, ch).toHaveLength(w)
        expect(row, ch).toMatch(/^[#.]+$/)
      }
    }
  })

  it('covers A–Z and 0–9', () => {
    for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') expect(GLYPHS[ch], ch).toBeDefined()
  })
})

describe('normalizeText', () => {
  it('upper-cases, strips accents and unknown characters', () => {
    expect(normalizeText('Ingénieur logiciel')).toBe('INGENIEUR LOGICIEL')
    expect(normalizeText('hi @ there #1')).toBe('HI THERE 1')
  })

  it('keeps line breaks and drops empty lines', () => {
    expect(normalizeText('software\n\nengineer')).toBe('SOFTWARE\nENGINEER')
  })
})

describe('wordmarkSize', () => {
  it('pads a single line', () => {
    // C (9) + gap (2) + I (7) = 18, plus 2 cells of padding each side
    expect(wordmarkSize('CI')).toEqual({ cols: 22, rows: 13 + 3 + 2 })
  })

  it('sizes multi-line text to the widest line', () => {
    const one = wordmarkSize('SOFTWARE')
    const two = wordmarkSize('SOFTWARE\nDEV')
    expect(two.cols).toBe(one.cols)
    expect(two.rows).toBe(one.rows + 13 + 3)
  })
})
