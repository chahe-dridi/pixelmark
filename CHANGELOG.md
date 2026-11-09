# Changelog

All notable changes to the `pixelmark` package are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- README and npm links point at the live demo, pixelmark-site.vercel.app.

## [0.2.2] - 2026-11-09

### Changed

- The package is published as `react-pixelmark` (npm does not allow `pixelmark`, too close to an existing name). Install with `npm install react-pixelmark` and import from `react-pixelmark` or `react-pixelmark/vanilla`.

## [0.2.1] - 2026-11-09

### Changed

- The README shows animated GIFs of the builds, and its links work on the npm page too.

## [0.2.0] - 2026-11-09

### Added

- `variants` option: choose each scene's variants (pin one value, or shuffle between a list). Covers 15 scenes, e.g. Mario's level and hero, Star Wars' scene and blade, Dragon Ball's mode, villain and form.
- `VARIANTS` export, and a `variants` list on every `CATALOG` entry, describing each scene's options with labels.

## [0.1.0] - 2026-10-18

### Added

- `<Pixelmark />` React component and a framework-free `mount()` (`pixelmark/vanilla`).
- 19 classic builds: assemble, stack, scan, rise, glitch, converge, laser, sand, lightning, matrix, puzzle, portal, halftone, weave, tetris, slash, flip, ripple, type.
- 16 game & story scenes, each a lazy chunk: mario, pacman, snake, invaders, xpboot, streetfighter, minecraft, sonic, amongus, angrybirds, donkeykong, harrypotter, dragonball, sahara, sidibousaid, starwars.
- Full A–Z, 0–9 and `. ! ? - : '` glyph set, accent stripping, multi-line text.
- Palettes: `ocean`, `ember`, `mint`, `violet`, `rose`, `gold`, `mono`, plus custom palettes and a three-colour shorthand.
- Accent modes: `none`, `all`, `first`, `rest`, `last`, index arrays and predicates.
- Options to pin a build, limit the rotation, pin a colour style, set the hold time and the scene label, and an `onBuild` callback.
- `CATALOG` metadata for every build.

[Unreleased]: https://github.com/chahe-dridi/pixelmark/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/chahe-dridi/pixelmark/releases/tag/v0.1.0
