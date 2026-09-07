import { motion } from 'framer-motion'
import type { Pokemon } from '../../api/types'
import { statColor, statLabel } from '../../utils/format'

const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
const MAX_STAT = 255

export function StatBars({ pokemon, compact = false }: { pokemon: Pokemon; compact?: boolean }) {
  const stats = STAT_ORDER.map((name) => pokemon.stats.find((s) => s.stat.name === name)).filter(
    (s): s is Pokemon['stats'][number] => !!s,
  )
  const total = stats.reduce((sum, s) => sum + s.base_stat, 0)

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {stats.map((s, i) => {
        const pct = Math.round((s.base_stat / MAX_STAT) * 100)
        return (
          <div key={s.stat.name} className="flex items-center gap-3">
            <span className="w-14 shrink-0 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
              {statLabel(s.stat.name)}
            </span>
            <span className="w-8 shrink-0 text-right font-mono text-xs font-bold tabular-nums">
              {s.base_stat}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: statColor(s.stat.name) }}
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
              />
            </div>
          </div>
        )
      })}
      <div className="flex items-center gap-3 border-t border-slate-100 pt-2.5 dark:border-white/10">
        <span className="w-14 shrink-0 text-right text-xs font-bold text-slate-700 dark:text-slate-200">
          Total
        </span>
        <span className="w-8 shrink-0 text-right font-mono text-xs font-bold tabular-nums text-brand-500">
          {total}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
          <motion.div
            className="h-full rounded-full bg-slate-700 dark:bg-slate-300"
            initial={{ width: 0 }}
            whileInView={{ width: `${Math.round((total / (MAX_STAT * 6)) * 100)}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}