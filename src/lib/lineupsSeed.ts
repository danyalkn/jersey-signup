// Snapshot of the lineups that existed in Supabase at migration time
// (exported 2026-05-21, just before the project was deleted). These seed the
// local store the first time someone opens the Lineups tab on a device.
//
// `slots` is a 16-element array: indices 0-10 are starters, 11-15 are subs.
// Each value is a jersey number (see roster.ts) or null for an empty slot.
// `subs` is a list of [benchJersey, starterJersey] "covers" links.

export type SeedLineup = {
  id: string
  name: string
  formation: string
  created_at: string
  updated_at: string
  slots: (number | null)[]
  subs: [number, number][]
}

export const SEED_LINEUPS: SeedLineup[] = [
  {
    id: 'be5ec049-3ad9-4a3d-b86b-c33425b15048',
    name: 'Match Day 1',
    formation: '4-4-2',
    created_at: '2026-05-20T21:35:22.311507+00:00',
    updated_at: '2026-05-21T16:21:51.394037+00:00',
    slots: [1, 19, 17, 14, 6, 20, 57, 10, 11, 25, 7, 8, 9, 30, null, null],
    subs: [
      [8, 10],
      [8, 57],
      [9, 19],
      [9, 6],
      [30, 17],
      [30, 14],
    ],
  },
  {
    id: '27812b34-9ddd-4305-bd92-3ff9f20b684e',
    name: 'Match Day 1',
    formation: '4-3-3',
    created_at: '2026-05-20T23:04:20.623737+00:00',
    updated_at: '2026-05-22T22:14:39.270821+00:00',
    slots: [1, 19, 14, 17, 6, 22, 10, 57, 20, 25, 11, 30, 7, 9, 8, 3],
    subs: [
      [7, 25],
      [9, 6],
      [9, 19],
      [30, 17],
      [8, 22],
      [8, 57],
      [8, 10],
      [9, 14],
      [30, 14],
      [9, 17],
    ],
  },
  {
    id: '1143e71f-b9c1-417b-9f90-44f5277398a1',
    name: 'Match Day 2',
    formation: '4-2-3-1',
    created_at: '2026-05-29T14:24:00.3693+00:00',
    updated_at: '2026-05-29T15:26:29.966401+00:00',
    slots: [1, 19, 14, 17, 6, 10, 8, 20, 25, 11, 7, 9, 22, 30, null, null],
    subs: [
      [9, 19],
      [9, 6],
      [22, 7],
      [22, 25],
      [30, 10],
      [30, 8],
      [30, 14],
      [30, 17],
    ],
  },
  {
    id: 'c5a661c9-cee7-4279-8c92-ba90c0a5b641',
    name: 'Match Day 3',
    formation: '4-2-3-1',
    created_at: '2026-06-04T16:56:39.291591+00:00',
    updated_at: '2026-06-05T20:41:09.89452+00:00',
    slots: [1, 19, 14, 17, 6, 10, 8, 20, 57, 11, 25, 22, 9, 3, 16, null],
    subs: [
      [22, 25],
      [22, 57],
      [9, 19],
      [9, 6],
      [3, 14],
      [16, 10],
      [16, 8],
      [3, 17],
      [16, 57],
    ],
  },
  {
    id: '24f73149-2b98-477a-a6ea-6586c165f8d0',
    name: 'Match Day 3',
    formation: '4-3-3',
    created_at: '2026-06-04T16:58:04.353841+00:00',
    updated_at: '2026-06-04T16:59:00.175921+00:00',
    slots: [1, 19, 3, 17, 6, 25, 10, 8, null, null, null, null, null, null, null, null],
    subs: [],
  },
  {
    id: '40af6cbc-bb2f-4b93-92ea-3f986ac0115f',
    name: 'Match Day 4',
    formation: '5-3-2',
    created_at: '2026-06-12T20:34:47.433835+00:00',
    updated_at: '2026-06-12T22:52:31.752435+00:00',
    slots: [1, 14, 3, 10, 19, 6, 16, 25, 57, 20, 11, 7, 8, 9, 22, null],
    subs: [],
  },
  {
    id: 'dd6b4cbc-c947-4bcc-bb03-56ad8dbf9409',
    name: 'Match Day 5',
    formation: '4-1-2-1-2',
    created_at: '2026-06-19T05:35:47.053622+00:00',
    updated_at: '2026-06-19T05:37:19.065603+00:00',
    slots: [1, 19, 14, 3, 6, 10, 25, 57, 7, 20, 11, 22, 8, 16, null, null],
    subs: [],
  },
  {
    id: '3ac535d6-7d06-4d65-89c4-d437e09a56ef',
    name: 'Match Day 6',
    formation: '4-1-2-1-2',
    created_at: '2026-06-26T18:20:01.70908+00:00',
    updated_at: '2026-06-26T22:10:37.679726+00:00',
    slots: [1, 19, 3, 17, 14, 10, 25, 8, 7, 20, 11, 9, 22, 29, 57, null],
    subs: [],
  },
]
