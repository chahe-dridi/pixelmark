// Human-readable metadata for every build: what the showcase site lists and
// filters on, and what apps can use to build their own pickers. `kind` is
// 'classic' (a pixel effect, built into the engine) or 'scene' (a game or
// story cutscene, downloaded on demand and single-line only).

export const CATALOG = [
  // ── Classic builds ────────────────────────────────────────────────────
  { name: 'assemble', title: 'Assemble', kind: 'classic', tags: ['particles'], description: 'Scattered pixels fly into place.' },
  { name: 'stack', title: 'Stack', kind: 'classic', tags: ['physics'], description: 'Pixels drop in and stack up from the base, like bricks.' },
  { name: 'scan', title: 'Scan', kind: 'classic', tags: ['glitch', 'tech'], description: 'A band of dithered noise sweeps across and leaves the letters behind.' },
  { name: 'rise', title: 'Rise', kind: 'classic', tags: ['print'], description: 'Each letter prints bottom-up with a bright leading edge.' },
  { name: 'glitch', title: 'Glitch', kind: 'classic', tags: ['glitch'], description: 'A jittery mosaic of random tones that locks into place.' },
  { name: 'converge', title: 'Converge', kind: 'classic', tags: ['particles'], description: 'Dust spirals in from all around the canvas.' },
  { name: 'laser', title: 'Laser', kind: 'classic', tags: ['print', 'tech'], description: 'A laser print head burns the word in, row by row, throwing sparks.' },
  { name: 'sand', title: 'Sand', kind: 'classic', tags: ['physics', 'nature'], description: 'Falling sand pours down and piles up into the letters.' },
  { name: 'lightning', title: 'Lightning', kind: 'classic', tags: ['nature', 'flashy'], description: 'A bolt strikes each letter; it crackles white, then settles.' },
  { name: 'matrix', title: 'Matrix', kind: 'classic', tags: ['tech', 'film'], description: 'Green code rain; every drop locks in the pixel it passes.' },
  { name: 'puzzle', title: 'Puzzle', kind: 'classic', tags: ['tiles'], description: 'Tiles slide in from every side behind a hairline grid.' },
  { name: 'portal', title: 'Portal', kind: 'classic', tags: ['particles', 'flashy'], description: 'A spinning ring opens and the word streams out of it.' },
  { name: 'halftone', title: 'Halftone', kind: 'classic', tags: ['print'], description: 'A faint dot mesh swells into solid pixels in a sweep.' },
  { name: 'weave', title: 'Weave', kind: 'classic', tags: ['tiles'], description: 'Alternate rows slide in from opposite sides and interlock.' },
  { name: 'tetris', title: 'Tetris', kind: 'classic', tags: ['physics', 'retro'], description: 'Tetromino-like pieces fill the word line by line from the bottom.' },
  { name: 'slash', title: 'Slash', kind: 'classic', tags: ['flashy'], description: 'Fast hairline slashes cut the letters in, band by band.' },
  { name: 'flip', title: 'Flip', kind: 'classic', tags: ['tiles'], description: 'Tiles flip over in a diagonal wave, back face first.' },
  { name: 'ripple', title: 'Ripple', kind: 'classic', tags: ['particles'], description: 'Pixels pop out from the centre with a little overshoot.' },
  { name: 'type', title: 'Type', kind: 'classic', tags: ['tech', 'minimal'], description: 'Typed out one keystroke per letter, with a blinking block cursor.' },

  // ── Game and story scenes ─────────────────────────────────────────────
  { name: 'mario', title: 'Super Mario', kind: 'scene', tags: ['arcade', 'retro'], description: 'Mario (or Luigi) bumps every letter and stomps Goombas, or hops across an SMB3-style world map.' },
  { name: 'pacman', title: 'Pac-Man', kind: 'scene', tags: ['arcade', 'retro'], description: 'A maze, READY!, ghosts on the chase and a power pellet that turns the tables.' },
  { name: 'snake', title: 'Snake', kind: 'scene', tags: ['retro'], description: 'Snakes slither along the strokes of each letter and eat the apples, on a Nokia LCD.' },
  { name: 'invaders', title: 'Space Invaders', kind: 'scene', tags: ['arcade', 'retro'], description: 'The cannon shoots each invader, which bursts into its letter. Watch for the mystery ship.' },
  { name: 'xpboot', title: 'Windows XP', kind: 'scene', tags: ['desktop', 'retro'], description: 'An XP boot screen, the desktop and an installer wizard that dissolves into the word.' },
  { name: 'streetfighter', title: 'Street Fighter', kind: 'scene', tags: ['arcade', 'fighting'], description: 'One round per play of a best-of-3 against BUGS. Reload to play the next round.' },
  { name: 'minecraft', title: 'Minecraft', kind: 'scene', tags: ['console'], description: 'Steve builds the word block by block; an Enderman steals one, a creeper blows a crater.' },
  { name: 'sonic', title: 'Sonic', kind: 'scene', tags: ['console', 'retro'], description: 'Sonic revs a spin dash and rolls over every letter collecting rings. Tails and Eggman cameo.' },
  { name: 'amongus', title: 'Among Us', kind: 'scene', tags: ['console'], description: 'Alternates between the tasks-and-kill story and the ejection of that same impostor.' },
  { name: 'angrybirds', title: 'Angry Birds', kind: 'scene', tags: ['physics', 'mobile'], description: 'Three birds from the slingshot hit wood, ice and stone letters and pop the pigs.' },
  { name: 'donkeykong', title: 'Donkey Kong', kind: 'scene', tags: ['arcade', 'retro'], description: 'Jumpman grabs the hammer, smashes each barrel into a letter, then bonks DK off the girder.' },
  { name: 'harrypotter', title: 'Harry Potter', kind: 'scene', tags: ['film', 'magic'], description: "The Marauder's Map inks the word in with wandering footprints, or a Patronus stag gallops through." },
  { name: 'dragonball', title: 'Dragon Ball', kind: 'scene', tags: ['anime', 'fighting'], description: 'Kamehameha, beam clashes, last-second rescues and the Spirit Bomb, against Broly, Frieza, Jiren or Beerus.' },
  { name: 'sahara', title: 'Sahara', kind: 'scene', tags: ['nature', 'tunisia'], description: 'Dunes, a camel caravan and letters formed from wind-blown sand, at dusk, night or noon.' },
  { name: 'sidibousaid', title: 'Sidi Bou Said', kind: 'scene', tags: ['tunisia'], description: 'Blue studded doors swing open on a white wall, each revealing a letter. Jasmine and a cat.' },
  { name: 'starwars', title: 'Star Wars', kind: 'scene', tags: ['film', 'fighting'], description: '"A long time ago…", then a lightsaber duel, a space battle or a blaster shootout.' },
]

export const CLASSIC_BUILD_NAMES = CATALOG.filter((b) => b.kind === 'classic').map((b) => b.name)
export const SCENE_BUILD_NAMES = CATALOG.filter((b) => b.kind === 'scene').map((b) => b.name)
export const BUILD_NAMES = CATALOG.map((b) => b.name)
export const TAGS = [...new Set(CATALOG.flatMap((b) => b.tags))].sort()
export const COLOR_STYLES = ['bands', 'solid', 'letters', 'mosaic', 'stripes']
