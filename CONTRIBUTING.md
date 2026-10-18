# Contributing to pixelmark

Thanks for helping. Bug fixes, new glyphs and new builds are all welcome.

## Setup

```bash
npm install
npm run dev     # showcase site at http://localhost:5173, reloading the library from source
npm test
```

Work on a branch off `main` and open a pull request. CI runs the tests and both builds.

## Commits

Keep commits small and focused, one change each, with a message that says what changed and why. A prefix helps the changelog: `feat:`, `fix:`, `docs:`, `chore:`, `build:`.

Add a line under `## [Unreleased]` in [CHANGELOG.md](./CHANGELOG.md) for anything a user of the package would notice.

## Adding a build

A build turns the wordmark's pixels into an animation. The engine hands it the layout `L` and four arrays `S`, and the build fills, for every pixel `i`, where it starts and when it moves:

| Field       | Meaning                                         |
| ----------- | ----------------------------------------------- |
| `S.SX[i]`, `S.SY[i]` | start position, in grid cells          |
| `S.DL[i]`   | delay before the pixel starts moving (seconds)  |
| `S.DU[i]`   | how long it takes to reach its place (seconds)  |

`setup(L, S)` returns the build's total length in seconds. The engine then eases every pixel from its start to its final place `L.X[i], L.Y[i]`.

Useful fields on `L`: `N` (pixel count), `cols`/`rows` (grid size), `CI[i]` (which letter a pixel belongs to), `GY[i]` (its row inside the glyph, 0–12), `ACC[i]` (1 for accent pixels), `CX0`/`CX1` (each letter's first and last column), `lines`, and `label` (short text for scenes to print).

Optional hooks and flags:

- `ease(k)`: easing from 0 to 1 (required).
- `size(k)`, `sizeY(k)`, `alpha(k)`: per-pixel size and opacity over its own progress `k`.
- `colorAt(k, i, L, pal, tone, t)`: override the pixel's colour.
- `waiting(t)`: draw pixels before their delay (`{ alpha, size }`).
- `underlay(args)` / `overlay(args)`: draw scenery behind or in front of the letters. `args` has `ctx, t, dt, total, L, pal, p, rect, line, box, px, py`. Draw with `box(x, y, w, h)` in grid units so cells tile without seams; `kit.js` has sprite, text, disc and particle helpers.
- `flash`, `spark`, `flicker`, `swirl`: built-in effects, see `engine/classic.js`.

### A classic build

Add it to the `BUILDS` array in `packages/pixelmark/src/engine/classic.js`. Classic builds must work on any text, including several lines.

### A game or story scene

1. Create `packages/pixelmark/src/builds/<name>.js` with a default export `{ name: '<name>', setup, ease, ... }`. Copy `invaders.js` as a starting point; it is the shortest.
2. Register it in `packages/pixelmark/src/registry.js`.
3. Describe it in `packages/pixelmark/src/catalog.js` (title, tags, one-line description) and add the name to the `SceneBuildName` type in `src/index.d.ts`.
4. Scenes may assume a single line of text; the engine never plays them on multi-line text. Never paint above `SCENE_TOP`.

The tests check that the catalog, the registry and the engine agree, so `npm test` will tell you if a step is missing.

### Checking it

Open the playground with your build pinned: `http://localhost:5173/playground?build=<name>`. Try a short word, a long one, both themes, and a narrow window.

## Adding glyphs

Glyphs live in `packages/pixelmark/src/engine/glyphs.js`: 13 rows each, vertical strokes 3 cells wide and horizontal strokes 2 tall, drawn with `#` and `.`. The tests check the shape.
