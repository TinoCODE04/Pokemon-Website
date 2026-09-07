import { ArrowDownAZ, ArrowDownWideNarrow, ArrowUpNarrowWide, RotateCcw } from 'lucide-react'
import { TYPE_ORDER, typeStyle } from '../../constants/types'
import { cn } from '../../utils/cn'

export type SortOption = 'id-asc' | 'id-desc' | 'name-asc' | 'name-desc'

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'id-asc', label: 'Dex # (low → high)' },
  { value: 'id-desc', label: 'Dex # (high → low)' },
  { value: 'name-asc', label: 'Name (A → Z)' },
  { value: 'name-desc', label: 'Name (Z → A)' },
]

export function TypeFilter({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (type: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
      {TYPE_ORDER.map((type) => {
        const style = typeStyle(type)
        const active = selected.includes(type)
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            aria-pressed={active}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-all',
              active
                ? 'border-transparent text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/25',
            )}
            style={active ? { background: style.color } : undefined}
          >
            {type}
          </button>
        )
      })}
    </div>
  )
}

export function SortSelect({
  value,
  onChange,
}: {
  value: SortOption
  onChange: (v: SortOption) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden items-center gap-1.5 text-slate-500 sm:flex dark:text-slate-400">
        {value.startsWith('name') ? (
          <ArrowDownAZ className="h-4 w-4" />
        ) : value === 'id-asc' ? (
          <ArrowUpNarrowWide className="h-4 w-4" />
        ) : (
          <ArrowDownWideNarrow className="h-4 w-4" />
        )}
        Sort
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ResetFiltersButton({ onClick, visible }: { onClick: () => void; visible: boolean }) {
  if (!visible) return null
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-brand-300 hover:text-brand-500 dark:border-white/10 dark:text-slate-400"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      Reset
    </button>
  )
}