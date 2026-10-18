// Every game and story build lives in its own chunk. The engine downloads
// only the build it is about to play (and prefetches the next one while the
// current one runs), so a visitor never fetches the whole collection.
export const GAME_BUILDS = {
  mario: () => import('./builds/mario.js'),
  pacman: () => import('./builds/pacman.js'),
  snake: () => import('./builds/snake.js'),
  invaders: () => import('./builds/invaders.js'),
  xpboot: () => import('./builds/xpboot.js'),
  streetfighter: () => import('./builds/streetfighter.js'),
  minecraft: () => import('./builds/minecraft.js'),
  sonic: () => import('./builds/sonic.js'),
  amongus: () => import('./builds/amongus.js'),
  angrybirds: () => import('./builds/angrybirds.js'),
  donkeykong: () => import('./builds/donkeykong.js'),
  harrypotter: () => import('./builds/harrypotter.js'),
  dragonball: () => import('./builds/dragonball.js'),
  sahara: () => import('./builds/sahara.js'),
  sidibousaid: () => import('./builds/sidibousaid.js'),
  starwars: () => import('./builds/starwars.js'),
}
