import { ArrowRight, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { extractId } from '../../api/pokeapi'
import type { ChainLink, EvolutionDetail } from '../../api/types'
import { artworkUrl, formatName } from '../../utils/format'
import { Spinner } from '../ui/Feedback'

function evolutionCondition(detail: EvolutionDetail | undefined): string {
  if (!detail) return ''
  const parts: string[] = []
  if (detail.trigger.name === 'level-up') {
    if (detail.min_level) parts.push(`Lv. ${detail.min_level}`)
    if (detail.min_happiness) parts.push('High friendship')
    if (detail.min_affection) parts.push('Affection')
    if (detail.min_beauty) parts.push('Beauty')
    if (detail.time_of_day) parts.push(`(${detail.time_of_day})`)
    if (detail.known_move) parts.push(`Knows ${formatName(detail.known_move.name)}`)
    if (detail.location) parts.push(`at ${formatName(detail.location.name)}`)
    if (detail.needs_overworld_rain) parts.push('in rain')
    if (detail.turn_upside_down) parts.push('upside down')
    if (detail.party_species) parts.push(`with ${formatName(detail.party_species.name)} in party`)
    if (detail.party_type) parts.push(`with a ${detail.party_type.name}-type in party`)
    if (detail.relative_physical_stats !== null) {
      parts.push(
        detail.relative_physical_stats > 0
          ? 'Atk > Def'
          : detail.relative_physical_stats < 0
            ? 'Atk < Def'
            : 'Atk = Def',
      )
    }
    if (detail.gender === 1) parts.push('(female)')
    if (detail.gender === 2) parts.push('(male)')
  } else if (detail.trigger.name === 'use-item' && detail.item) {
    parts.push(formatName(detail.item.name))
  } else if (detail.trigger.name === 'trade') {
    parts.push('Trade')
    if (detail.held_item) parts.push(`holding ${formatName(detail.held_item.name)}`)
    if (detail.trade_species) parts.push(`for ${formatName(detail.trade_species.name)}`)
  } else if (detail.trigger.name !== 'level-up') {
    parts.push(formatName(detail.trigger.name))
  }
  return parts.join(' ') || 'Level up'
}

function EvoNode({ link, isRoot = false }: { link: ChainLink; isRoot?: boolean }) {
  const id = extractId(link.species.url)
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
      <Link
        to={`/pokemon/${id}`}
        className="group flex w-32 shrink-0 flex-col items-center rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-night-850"
      >
        <img
          src={artworkUrl(id)}
          alt={formatName(link.species.name)}
          loading="lazy"
          onError={(e) => {
            const el = e.currentTarget
            if (!el.dataset.fallback) {
              el.dataset.fallback = '1'
              el.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
            }
          }}
          className="h-20 w-20 object-contain transition-transform group-hover:scale-110"
        />
        <span className="mt-1 text-center text-sm font-semibold capitalize leading-tight">
          {formatName(link.species.name)}
        </span>
        <span className="font-mono text-[10px] text-slate-400">#{String(id).padStart(4, '0')}</span>
      </Link>

      {link.evolves_to.length > 0 && (
        <div className="flex flex-col gap-4">
          {link.evolves_to.map((child) => (
            <div key={child.species.name} className="flex flex-col items-center gap-2 sm:flex-row">
              <div className="flex flex-col items-center text-slate-400">
                <ArrowRight className="hidden h-5 w-5 sm:block" />
                <ChevronDown className="h-5 w-5 sm:hidden" />
                <span className="max-w-28 text-center text-[10px] font-medium leading-tight text-slate-500 dark:text-slate-400">
                  {evolutionCondition(child.evolution_details[0])}
                </span>
              </div>
              <EvoNode link={child} />
            </div>
          ))}
        </div>
      )}
      {isRoot && link.evolves_to.length === 0 && (
        <span className="text-sm text-slate-400">Does not evolve</span>
      )}
    </div>
  )
}

export function EvolutionChainView({
  chain,
  isLoading,
  isError,
}: {
  chain: ChainLink | undefined
  isLoading: boolean
  isError: boolean
}) {
  if (isLoading) return <Spinner label="Loading evolution chain…" />
  if (isError || !chain)
    return <p className="py-6 text-center text-sm text-slate-500">Evolution data unavailable.</p>
  return (
    <div className="overflow-x-auto py-2">
      <EvoNode link={chain} isRoot />
    </div>
  )
}