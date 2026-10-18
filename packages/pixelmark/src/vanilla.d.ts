import type { PixelmarkOptions } from './index'
export type { PixelmarkOptions, BuildName, ColorStyle, Palette, PaletteInput, PaletteName, CatalogEntry } from './index'
export { CATALOG, VARIANTS, BUILD_NAMES, CLASSIC_BUILD_NAMES, SCENE_BUILD_NAMES, TAGS, COLOR_STYLES, PALETTES, PALETTE_NAMES, makePalette, normalizeText, wordmarkSize } from './index'

export interface PixelmarkController {
  next(): void
  destroy(): void
}
export declare function mount(canvas: HTMLCanvasElement, options?: PixelmarkOptions & { reduced?: boolean }): PixelmarkController
