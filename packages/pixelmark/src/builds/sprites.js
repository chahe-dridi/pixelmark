// Sprites shared by more than one build (Mario also plays Jumpman in
// Donkey Kong). R cap/shirt · S skin · H hair/boots · B overalls · Y buttons
export const MARIO_RUN = [
  ['...RRRRR....', '..RRRRRRRRR.', '..HHHSSHS...', '.HSHSSSHSSS.', '.HSHHSSSHSSS', '.HHSSSSHHHH.', '...SSSSSSS..', '..RRBRRR....',
    '.RRRBRRBRRR.', 'RRRRBBBBRRRR', 'SSRBYBBYBRSS', 'SSSBBBBBBSSS', 'SSBBBBBBBBSS', '..BBB..BBB..', '.HHH....HHH.', 'HHHH....HHHH'],
  ['...RRRRR....', '..RRRRRRRRR.', '..HHHSSHS...', '.HSHSSSHSSS.', '.HSHHSSSHSSS', '.HHSSSSHHHH.', '...SSSSSSS..', '...RRBRR....',
    '..RRRRBBRR..', '..RRRBBYBB..', '..SSRBBBBB..', '..SSBBBBBB..', '...BBBBBB...', '...BBB.BBB..', '..HHH..HHHH.', '..HHHH......'],
]
// Jumping: one fist up, legs tucked
export const MARIO_JUMP = ['..........SS', '...RRRRR..SS', '..RRRRRRRRRS', '..HHHSSHS.RR', '.HSHSSSHSSRR', '.HSHHSSSHSSS', '.HHSSSSHHHH.',
  '...SSSSSSS..', '.RRRRBRRRR..', 'RRRRRBBRRRRR', 'SRRRBYBBYBRR', 'SSBBBBBBBBBB', '.BBBBBBBBBBB', 'HHBBBBBBBB..', 'HHHBBB......', '.HH.........']
export const MARIO_PAL = { R: '#D83A1E', S: '#F4B98A', H: '#6B3E1F', B: '#2F55C4', Y: '#F2C14E' }
export const LUIGI_PAL = { ...MARIO_PAL, R: '#2E9E3E' }
export const JUMPMAN_PAL = { R: '#E8344E', S: '#F4B98A', H: '#6B3E1F', B: '#2F55C4', Y: '#F2C14E' }
