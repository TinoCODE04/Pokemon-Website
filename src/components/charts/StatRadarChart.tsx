import { useMemo } from 'react'
import type { Pokemon } from '../../api/types'
import { statLabel } from '../../utils/format'

const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
const MAX_STAT = 180 // visual scale; most stats fall under this

interface RadarSeries {
  label: string
  color: string
  values: number[] // aligned to STAT_ORDER
}

export function pokemonToRadarSeries(pokemon: Pokemon, color: string): RadarSeries {
  return {
    label: pokemon.name,
    color,
    values: STAT_ORDER.map(
      (name) => pokemon.stats.find((s) => s.stat.name === name)?.base_stat ?? 0,
    ),
  }
}

function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

export function StatRadarChart({
  series,
  size = 280,
}: {
  series: RadarSeries[]
  size?: number
}) {
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 44
  const n = STAT_ORDER.length
  const angleStep = 360 / n

  const gridLevels = [0.25, 0.5, 0.75, 1]

  const polygons = useMemo(
    () =>
      series.map((s) =>
        s.values
          .map((v, i) => {
            const r = Math.min(v / MAX_STAT, 1) * radius
            const [x, y] = polar(cx, cy, r, i * angleStep)
            return `${x.toFixed(1)},${y.toFixed(1)}`
          })
          .join(' '),
      ),
    [series, cx, cy, radius, angleStep],
  )

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto w-full max-w-[300px]"
      role="img"
      aria-label="Base stats radar chart"
    >
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={Array.from({ length: n }, (_, i) => {
            const [x, y] = polar(cx, cy, radius * level, i * angleStep)
            return `${x},${y}`
          }).join(' ')}
          fill="none"
          className="stroke-slate-200 dark:stroke-white/10"
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = polar(cx, cy, radius, i * angleStep)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            className="stroke-slate-200 dark:stroke-white/10"
            strokeWidth="1"
          />
        )
      })}
      {series.map((s, i) => (
        <g key={s.label}>
          <polygon
            points={polygons[i]}
            fill={s.color}
            fillOpacity={series.length > 1 ? 0.18 : 0.25}
            stroke={s.color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {s.values.map((v, j) => {
            const r = Math.min(v / MAX_STAT, 1) * radius
            const [x, y] = polar(cx, cy, r, j * angleStep)
            return <circle key={j} cx={x} cy={y} r="3" fill={s.color} />
          })}
        </g>
      ))}
      {STAT_ORDER.map((name, i) => {
        const [x, y] = polar(cx, cy, radius + 26, i * angleStep)
        const anchor = Math.abs(x - cx) < 8 ? 'middle' : x > cx ? 'start' : 'end'
        return (
          <text
            key={name}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-slate-500 text-[10px] font-semibold dark:fill-slate-400"
          >
            {statLabel(name)}
          </text>
        )
      })}
    </svg>
  )
}