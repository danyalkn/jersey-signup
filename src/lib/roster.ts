// Static Praxis FC roster.
//
// The team is set, so these values are hard-coded rather than read from a
// database. Players are identified by jersey number (unique and stable);
// lineups reference players by this key.

export type Player = {
  jersey_number: number
  player_name: string
  email: string | null
  size: string
}

export const ROSTER: Player[] = [
  { jersey_number: 1,  player_name: 'Hashim',  email: 'hashimwaqar14@gmail.com',  size: 'XL' },
  { jersey_number: 3,  player_name: 'Ismail',  email: 'elhamalawyismail@gmail.com', size: 'XL' },
  { jersey_number: 6,  player_name: 'Maanav',  email: 'maanavpatel6@gmail.com',    size: 'S' },
  { jersey_number: 7,  player_name: 'Jaan',    email: 'jaanbaig@gmail.com',        size: 'L' },
  { jersey_number: 8,  player_name: 'Tony',    email: 'mcanthonyzukowski@gmail.com', size: 'L' },
  { jersey_number: 9,  player_name: 'Idrees',  email: null,                        size: 'M' },
  { jersey_number: 10, player_name: 'Danyal',  email: 'danyal0726@gmail.com',      size: 'S' },
  { jersey_number: 11, player_name: 'Zubair',  email: 'zubair.ameen1017@gmail.com', size: 'L' },
  { jersey_number: 14, player_name: 'Julian',  email: 'hungjulian@hotmail.com',    size: 'S' },
  { jersey_number: 16, player_name: 'Aneeq',   email: 'aneeqmdurrani@gmail.com',   size: 'L' },
  { jersey_number: 17, player_name: 'Moaz',    email: 'muh.moaz17@gmail.com',      size: 'L' },
  { jersey_number: 19, player_name: 'Talha',   email: 'talhamalik0322@gmail.com',  size: 'M' },
  { jersey_number: 20, player_name: 'Ozair',   email: null,                        size: 'L' },
  { jersey_number: 22, player_name: 'Rafay',   email: 'abdulrafayar.ar@gmail.com', size: 'M' },
  { jersey_number: 25, player_name: 'Zain',    email: 'zainhotay23@gmail.com',     size: 'L' },
  { jersey_number: 29, player_name: 'Subhan',  email: 'subhantahir@live.ca',       size: 'L' },
  { jersey_number: 30, player_name: 'Yoosuf',  email: null,                        size: 'M' },
  { jersey_number: 57, player_name: 'Omar',    email: 'omarhabib2003@gmail.com',   size: 'S' },
]

// Lineup components address players by a string id; we use the jersey number.
export type LineupPlayer = Player & { id: string }

export const LINEUP_PLAYERS: LineupPlayer[] = ROSTER.map((p) => ({
  ...p,
  id: String(p.jersey_number),
}))

export const PLAYER_BY_ID: Map<string, LineupPlayer> = new Map(
  LINEUP_PLAYERS.map((p) => [p.id, p])
)

export const playerKeyFromId = (id: string): number => Number(id)
export const playerIdFromKey = (key: number): string => String(key)
