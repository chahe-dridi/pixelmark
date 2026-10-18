import { describe, expect, it } from 'vitest'
import { layout } from '../src/engine/engine'
import { choose, dirOf } from '../src/engine/kit'
import { GAME_BUILDS } from '../src/registry'
import { VARIANTS } from '../src/catalog'

const fresh = (L) => ({ SX: new Float32Array(L.N), SY: new Float32Array(L.N), DL: new Float32Array(L.N), DU: new Float32Array(L.N) })

describe('choose', () => {
  it('pins a value, picks from a list, or falls back to random', () => {
    expect(choose({ mode: 'map' }, 'mode', () => 'run')).toBe('map')
    expect(['a', 'b']).toContain(choose({ k: ['a', 'b'] }, 'k', () => 'z'))
    expect(choose({ k: [] }, 'k', () => 'z')).toBe('z')
    expect(choose({}, 'k', () => 'z')).toBe('z')
    expect(choose({ k: false }, 'k', () => true)).toBe(false)
    expect(dirOf({ direction: 'rtl' })).toBe(-1)
  })
})

describe('scene variants', () => {
  it('describes only real scenes', () => {
    for (const name of Object.keys(VARIANTS)) expect(GAME_BUILDS[name], name).toBeDefined()
  })

  it('every scene sets up with every variant value', async () => {
    const L = layout('PIXEL MARK', 'rest')
    for (const [name, load] of Object.entries(GAME_BUILDS)) {
      const build = (await load()).default
      for (const v of VARIANTS[name] || []) {
        for (const [value] of v.options) {
          const total = build.setup(L, fresh(L), { [v.key]: value })
          expect(Number.isFinite(total) && total > 0, `${name}.${v.key}=${value}`).toBe(true)
        }
      }
    }
  })

  it('honours pinned choices', async () => {
    const L = layout('PIXEL MARK')
    const mario = (await GAME_BUILDS.mario()).default
    mario.setup(L, fresh(L), { mode: 'map', hero: 'luigi' })
    expect(mario.mode).toBe('map')
    expect(mario.hero).toBe('luigi')

    const sw = (await GAME_BUILDS.starwars()).default
    for (let k = 0; k < 10; k++) {
      sw.setup(L, fresh(L), { scene: ['space', 'blasters'] })
      expect(['space', 'blasters']).toContain(sw.scene)
    }
  })
})
