// Static formation config used by the Lineups feature.
//
// Coordinates are normalized 0–100 on the SVG pitch:
//   x: 0 = left touchline,  100 = right touchline
//   y: 0 = own goal line,   100 = opposing goal line
//
// Wing-backs in 3/5-back shapes use the LB/RB label but sit higher on the
// pitch (y ~40–50) than fullbacks in back-four shapes (y ~22–25). The y
// coordinate carries the tactical role; the label matches roster language.

export type PositionCode =
  | 'GK'
  | 'CB'
  | 'LB'
  | 'RB'
  | 'LWB'
  | 'RWB'
  | 'CDM'
  | 'CM'
  | 'CAM'
  | 'LM'
  | 'RM'
  | 'LW'
  | 'RW'
  | 'ST'

export type SlotSpec = {
  x: number
  y: number
  position_code: PositionCode
}

export const FORMATIONS: Record<string, SlotSpec[]> = {
  '4-4-2': [
    { x: 50, y: 8,  position_code: 'GK' },
    { x: 20, y: 25, position_code: 'LB' },
    { x: 40, y: 22, position_code: 'CB' },
    { x: 60, y: 22, position_code: 'CB' },
    { x: 80, y: 25, position_code: 'RB' },
    { x: 20, y: 55, position_code: 'LM' },
    { x: 40, y: 52, position_code: 'CM' },
    { x: 60, y: 52, position_code: 'CM' },
    { x: 80, y: 55, position_code: 'RM' },
    { x: 40, y: 80, position_code: 'ST' },
    { x: 60, y: 80, position_code: 'ST' },
  ],
  '4-3-3': [
    { x: 50, y: 8,  position_code: 'GK' },
    { x: 20, y: 25, position_code: 'LB' },
    { x: 40, y: 22, position_code: 'CB' },
    { x: 60, y: 22, position_code: 'CB' },
    { x: 80, y: 25, position_code: 'RB' },
    { x: 30, y: 50, position_code: 'CM' },
    { x: 50, y: 48, position_code: 'CM' },
    { x: 70, y: 50, position_code: 'CM' },
    { x: 20, y: 78, position_code: 'LW' },
    { x: 50, y: 82, position_code: 'ST' },
    { x: 80, y: 78, position_code: 'RW' },
  ],
  '4-2-3-1': [
    { x: 50, y: 8,  position_code: 'GK' },
    { x: 20, y: 25, position_code: 'LB' },
    { x: 40, y: 22, position_code: 'CB' },
    { x: 60, y: 22, position_code: 'CB' },
    { x: 80, y: 25, position_code: 'RB' },
    { x: 40, y: 42, position_code: 'CDM' },
    { x: 60, y: 42, position_code: 'CDM' },
    { x: 22, y: 65, position_code: 'LW' },
    { x: 50, y: 65, position_code: 'CAM' },
    { x: 78, y: 65, position_code: 'RW' },
    { x: 50, y: 85, position_code: 'ST' },
  ],
  '4-1-4-1': [
    { x: 50, y: 8,  position_code: 'GK' },
    { x: 20, y: 25, position_code: 'LB' },
    { x: 40, y: 22, position_code: 'CB' },
    { x: 60, y: 22, position_code: 'CB' },
    { x: 80, y: 25, position_code: 'RB' },
    { x: 50, y: 40, position_code: 'CDM' },
    { x: 20, y: 58, position_code: 'LM' },
    { x: 40, y: 55, position_code: 'CM' },
    { x: 60, y: 55, position_code: 'CM' },
    { x: 80, y: 58, position_code: 'RM' },
    { x: 50, y: 85, position_code: 'ST' },
  ],
  '3-5-2': [
    { x: 50, y: 8,  position_code: 'GK' },
    { x: 30, y: 25, position_code: 'CB' },
    { x: 50, y: 22, position_code: 'CB' },
    { x: 70, y: 25, position_code: 'CB' },
    { x: 12, y: 50, position_code: 'LB' },
    { x: 35, y: 52, position_code: 'CM' },
    { x: 50, y: 50, position_code: 'CM' },
    { x: 65, y: 52, position_code: 'CM' },
    { x: 88, y: 50, position_code: 'RB' },
    { x: 40, y: 82, position_code: 'ST' },
    { x: 60, y: 82, position_code: 'ST' },
  ],
  '3-4-3': [
    { x: 50, y: 8,  position_code: 'GK' },
    { x: 30, y: 25, position_code: 'CB' },
    { x: 50, y: 22, position_code: 'CB' },
    { x: 70, y: 25, position_code: 'CB' },
    { x: 12, y: 50, position_code: 'LB' },
    { x: 40, y: 50, position_code: 'CM' },
    { x: 60, y: 50, position_code: 'CM' },
    { x: 88, y: 50, position_code: 'RB' },
    { x: 22, y: 80, position_code: 'LW' },
    { x: 50, y: 82, position_code: 'ST' },
    { x: 78, y: 80, position_code: 'RW' },
  ],
  // Double pivot + CAM behind the strikers; wide defenders are wing-backs.
  '5-3-2': [
    { x: 50, y: 8,  position_code: 'GK' },
    { x: 30, y: 25, position_code: 'CB' },
    { x: 50, y: 22, position_code: 'CB' },
    { x: 70, y: 25, position_code: 'CB' },
    { x: 12, y: 32, position_code: 'LWB' },
    { x: 88, y: 32, position_code: 'RWB' },
    { x: 36, y: 48, position_code: 'CDM' },
    { x: 50, y: 66, position_code: 'CAM' },
    { x: 64, y: 48, position_code: 'CDM' },
    { x: 35, y: 82, position_code: 'ST' },
    { x: 65, y: 82, position_code: 'ST' },
  ],
  '4-4-1-1': [
    { x: 50, y: 8,  position_code: 'GK' },
    { x: 20, y: 25, position_code: 'LB' },
    { x: 40, y: 22, position_code: 'CB' },
    { x: 60, y: 22, position_code: 'CB' },
    { x: 80, y: 25, position_code: 'RB' },
    { x: 20, y: 55, position_code: 'LM' },
    { x: 40, y: 52, position_code: 'CM' },
    { x: 60, y: 52, position_code: 'CM' },
    { x: 80, y: 55, position_code: 'RM' },
    { x: 50, y: 70, position_code: 'CAM' },
    { x: 50, y: 86, position_code: 'ST' },
  ],
  // Narrow midfield diamond: holding CDM, two box-to-box CMs, a CAM at the tip.
  '4-1-2-1-2': [
    { x: 50, y: 8,  position_code: 'GK' },
    { x: 18, y: 25, position_code: 'LB' },
    { x: 40, y: 22, position_code: 'CB' },
    { x: 60, y: 22, position_code: 'CB' },
    { x: 82, y: 25, position_code: 'RB' },
    { x: 50, y: 40, position_code: 'CDM' },
    { x: 28, y: 54, position_code: 'CM' },
    { x: 72, y: 54, position_code: 'CM' },
    { x: 50, y: 67, position_code: 'CAM' },
    { x: 38, y: 84, position_code: 'ST' },
    { x: 62, y: 84, position_code: 'ST' },
  ],
}

export const FORMATION_NAMES = Object.keys(FORMATIONS)

export function getFormation(name: string): SlotSpec[] | undefined {
  return FORMATIONS[name]
}
