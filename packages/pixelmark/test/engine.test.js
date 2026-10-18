import { describe, expect, it } from 'vitest'
import { layout } from '../src/engine/engine'
import { BUILDS, DESIGNS, EXITS } from '../src/engine/classic'
import { GAME_BUILDS } from '../src/registry'
import { CATALOG, CLASSIC_BUILD_NAMES, SCENE_BUILD_NAMES } from '../src/catalog'

describe('layout', () => {
  it('marks accent pixels by mode', () => {
    const count = (L) => L.ACC.reduce((a, b) => a + b, 0)
    expect(count(layout('AB CD', 'none'))).toBe(0)
    expect(count(layout('AB CD', 'all'))).toBe(layout('AB CD').N)
    const rest = layout('AB CD', 'rest'), first = layout('AB CD', 'first')
    expect(count(rest) + count(first)).toBe(rest.N)
    expect(count(layout('AB CD', [0]))).toBe(count(layout('A', 'all')))
  })

  it('defaults the scene label to the first word', () => {
    expect(layout('SOFTWARE ENGINEER').label).toBe('SOFTWARE')
    expect(layout('X', 'none', 'Chaher').label).toBe('CHAHER')
  })

  it('places every line inside the canvas', () => {
    const L = layout('SOFTWARE\nENGINEER\nTUNIS')
    expect(L.lines).toBe(3)
    for (let i = 0; i < L.N; i++) {
      expect(L.X[i]).toBeLessThan(L.cols)
      expect(L.Y[i]).toBeLessThan(L.rows)
    }
  })
})

describe('catalog', () => {
  it('lists exactly the builds the engine has', () => {
    expect(CLASSIC_BUILD_NAMES.sort()).toEqual(BUILDS.map((b) => b.name).sort())
    expect(SCENE_BUILD_NAMES.sort()).toEqual(Object.keys(GAME_BUILDS).sort())
    expect(new Set(CATALOG.map((b) => b.name)).size).toBe(CATALOG.length)
  })

  it('names every colour style and exit', () => {
    for (const d of [...DESIGNS, ...EXITS]) expect(d.name).toBeTruthy()
  })

  it('every scene module loads and matches its name', async () => {
    for (const [name, load] of Object.entries(GAME_BUILDS)) {
      const mod = await load()
      expect(mod.default.name).toBe(name)
      expect(typeof mod.default.setup).toBe('function')
    }
  })
})
