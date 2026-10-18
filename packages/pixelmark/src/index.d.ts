import type { CSSProperties, ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from 'react'

export type ClassicBuildName =
  | 'assemble' | 'stack' | 'scan' | 'rise' | 'glitch' | 'converge' | 'laser' | 'sand' | 'lightning' | 'matrix'
  | 'puzzle' | 'portal' | 'halftone' | 'weave' | 'tetris' | 'slash' | 'flip' | 'ripple' | 'type'

export type SceneBuildName =
  | 'mario' | 'pacman' | 'snake' | 'invaders' | 'xpboot' | 'streetfighter' | 'minecraft' | 'sonic' | 'amongus'
  | 'angrybirds' | 'donkeykong' | 'harrypotter' | 'dragonball' | 'sahara' | 'sidibousaid' | 'starwars'

export type BuildName = ClassicBuildName | SceneBuildName
export type ColorStyle = 'bands' | 'solid' | 'letters' | 'mosaic' | 'stripes'
export type PaletteName = 'ocean' | 'ember' | 'mint' | 'violet' | 'rose' | 'gold' | 'mono'

/** Five tones each, index 0 = highest contrast against the page; acc[2] is the accent itself. */
export interface Palette {
  ink: [string, string, string, string, string]
  acc: [string, string, string, string, string]
  shadow?: string
  spark?: string
}
/** Shorthand: three colours, the rest is derived. */
export interface PaletteShorthand {
  ink: string
  accent: string
  background?: string
}
export type PaletteInput =
  | PaletteName
  | Palette
  | PaletteShorthand
  | { dark?: Palette | PaletteShorthand; light?: Palette | PaletteShorthand }

export type AccentInput = 'none' | 'all' | 'first' | 'rest' | 'last' | number[] | ((char: string, index: number) => boolean)

export interface PixelmarkOptions {
  /** Text to draw. A–Z, 0–9, space and . ! ? - : ' — accents are stripped, case ignored. Use \n for extra lines. */
  text?: string
  /** Which characters use the accent colour. Default 'none'. */
  accent?: AccentInput
  /** Preset name, full palette, shorthand, or a { dark, light } pair. Default 'ocean'. */
  palette?: PaletteInput
  /** 'auto' follows a `dark`/`light` class or data-theme on <html>, then the OS. Default 'auto'. */
  tone?: 'auto' | 'light' | 'dark'
  /** Pin one build: it replays every cycle. */
  build?: BuildName
  /** Only play the builds listed. */
  builds?: BuildName[]
  /** Include the game and story scenes (single-line text only). Default true. */
  games?: boolean
  /** Pin one colour style instead of rotating through them. */
  colorStyle?: ColorStyle
  /** Short text some scenes print (XP installer, Street Fighter health bar…). Default: the first word. */
  label?: string
  /** Seconds the finished wordmark holds before rebuilding. Default 6. */
  hold?: number
  /** Rebuild forever. Default true. */
  loop?: boolean
  /** Pixels dodge the pointer and a click skips to the next build. Default true. */
  interactive?: boolean
  /** Loose pixels drift up off the letters while it holds. Default true. */
  ambient?: boolean
  /** Called with the build's name each time one starts. */
  onBuild?: (name: BuildName) => void
}

export interface PixelmarkProps extends PixelmarkOptions, Omit<HTMLAttributes<HTMLCanvasElement>, 'children'> {
  /** CSS max-width of the canvas. Default 1100. */
  maxWidth?: number | string
  /** Pull the blank padding out with negative margins, so letters align with surrounding text. Default false. */
  bleed?: boolean
  className?: string
  style?: CSSProperties
}

export interface PixelmarkHandle {
  /** Skip ahead: jump to the next build (a finished wordmark takes itself apart first). */
  next(): void
  canvas: HTMLCanvasElement | null
}

export declare const Pixelmark: ForwardRefExoticComponent<PixelmarkProps & RefAttributes<PixelmarkHandle>>
export default Pixelmark

export interface CatalogEntry {
  name: BuildName
  title: string
  kind: 'classic' | 'scene'
  tags: string[]
  description: string
}
export declare const CATALOG: CatalogEntry[]
export declare const BUILD_NAMES: BuildName[]
export declare const CLASSIC_BUILD_NAMES: ClassicBuildName[]
export declare const SCENE_BUILD_NAMES: SceneBuildName[]
export declare const TAGS: string[]
export declare const COLOR_STYLES: ColorStyle[]

export declare const PALETTES: Record<PaletteName, { dark: Palette; light: Palette }>
export declare const PALETTE_NAMES: PaletteName[]
export declare function makePalette(colors: { ink: string; accent: string; background: string; light?: boolean }): Palette
export declare function resolvePalette(palette: PaletteInput | undefined, light: boolean): Palette

export declare const GLYPHS: Record<string, string[]>
/** Strip accents, upper-case, and drop characters without a glyph. */
export declare function normalizeText(text: string): string
/** Grid size (cells) of a normalized text, padding included. */
export declare function wordmarkSize(text: string): { cols: number; rows: number }
