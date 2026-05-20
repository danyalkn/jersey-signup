'use client'

import type { SlotSpec } from '@/lib/formations'
import type { JerseySignup, LineupSlot } from '@/lib/supabase'

interface Props {
  starters: LineupSlot[]
  formationSpec: SlotSpec[]
  playerById: Map<string, JerseySignup>
  onSlotClick: (slotId: string) => void
}

const PAD_X = 4
const PAD_Y = 4
const PITCH_W = 92
const PITCH_H = 142
const RADIUS = 6

const projectX = (x: number) => PAD_X + (x / 100) * PITCH_W
// y in formation data: 0 = own goal, 100 = opposing goal. We render with
// the own goal at the bottom (coaching convention), so y is inverted.
const projectY = (y: number) => PAD_Y + PITCH_H - (y / 100) * PITCH_H

function lastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1] : fullName
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

const NAME_TRUNCATE = 8

export default function PitchSVG({
  starters,
  formationSpec,
  playerById,
  onSlotClick,
}: Props) {
  const startersByIndex = new Map(starters.map((s) => [s.slot_index, s]))

  return (
    <div className="rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50">
      <svg
        viewBox="0 0 100 150"
        className="w-full block"
        style={{ maxHeight: '75vh' }}
      >
        {/* Pitch fill + outline */}
        <rect
          x={PAD_X}
          y={PAD_Y}
          width={PITCH_W}
          height={PITCH_H}
          fill="#86efac"
          stroke="#16a34a"
          strokeWidth={0.4}
        />
        {/* Halfway line */}
        <line
          x1={PAD_X}
          y1={PAD_Y + PITCH_H / 2}
          x2={PAD_X + PITCH_W}
          y2={PAD_Y + PITCH_H / 2}
          stroke="#16a34a"
          strokeWidth={0.4}
        />
        {/* Center circle + spot */}
        <circle
          cx={PAD_X + PITCH_W / 2}
          cy={PAD_Y + PITCH_H / 2}
          r={9}
          fill="none"
          stroke="#16a34a"
          strokeWidth={0.4}
        />
        <circle
          cx={PAD_X + PITCH_W / 2}
          cy={PAD_Y + PITCH_H / 2}
          r={0.6}
          fill="#16a34a"
        />
        {/* Penalty boxes — centered on pitch */}
        <rect
          x={PAD_X + (PITCH_W - 50) / 2}
          y={PAD_Y}
          width={50}
          height={16}
          fill="none"
          stroke="#16a34a"
          strokeWidth={0.4}
        />
        <rect
          x={PAD_X + (PITCH_W - 50) / 2}
          y={PAD_Y + PITCH_H - 16}
          width={50}
          height={16}
          fill="none"
          stroke="#16a34a"
          strokeWidth={0.4}
        />
        {/* Six-yard boxes — centered on pitch */}
        <rect
          x={PAD_X + (PITCH_W - 24) / 2}
          y={PAD_Y}
          width={24}
          height={6}
          fill="none"
          stroke="#16a34a"
          strokeWidth={0.4}
        />
        <rect
          x={PAD_X + (PITCH_W - 24) / 2}
          y={PAD_Y + PITCH_H - 6}
          width={24}
          height={6}
          fill="none"
          stroke="#16a34a"
          strokeWidth={0.4}
        />

        {formationSpec.map((spec, idx) => {
          const slot = startersByIndex.get(idx)
          if (!slot) return null
          const cx = projectX(spec.x)
          const cy = projectY(spec.y)
          const player = slot.player_id ? playerById.get(slot.player_id) : null
          const filled = !!player
          const label = slot.position_code ?? spec.position_code
          return (
            <g
              key={slot.id}
              onClick={() => onSlotClick(slot.id)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={RADIUS}
                fill={filled ? '#1d4ed8' : 'white'}
                stroke={filled ? '#1e40af' : '#94a3b8'}
                strokeWidth={0.6}
                strokeDasharray={filled ? undefined : '1.5,1'}
              />
              {filled ? (
                <>
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="4.5"
                    fontWeight="900"
                    fill="white"
                    pointerEvents="none"
                  >
                    {player!.jersey_number}
                  </text>
                  <text
                    x={cx}
                    y={cy + RADIUS + 3.5}
                    textAnchor="middle"
                    fontSize="3"
                    fontWeight="700"
                    fill="#1f2937"
                    pointerEvents="none"
                  >
                    {truncate(lastName(player!.player_name), NAME_TRUNCATE)}
                  </text>
                </>
              ) : (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="3"
                  fontWeight="700"
                  fill="#475569"
                  pointerEvents="none"
                >
                  {label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
