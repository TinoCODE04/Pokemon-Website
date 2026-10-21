import { SlidersHorizontal } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { MobileDialog } from '../ui/MobileDialog'

export function ResponsiveFilters({ children, activeCount, summary, resultsLabel, onReset }: {
  children: ReactNode
  activeCount: number
  summary?: string
  resultsLabel: string
  onReset: () => void
}) {
  const [open, setOpen] = useState(false)
  return <>
    <div className="flex flex-wrap items-center gap-3 sm:hidden">
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold dark:border-white/15">
        <SlidersHorizontal size={18} /> Filters &amp; sort
        {activeCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs text-white">{activeCount}</span>}
      </button>
      {summary && <p className="min-w-0 flex-1 break-words text-sm capitalize text-slate-600 dark:text-slate-300">{summary}</p>}
    </div>
    <div className="hidden space-y-4 sm:block">{children}</div>
    <MobileDialog open={open} onClose={() => setOpen(false)} title="Filters & sort" footer={
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onReset} disabled={activeCount === 0} className="min-h-12 rounded-xl border border-slate-300 px-4 text-sm font-bold disabled:opacity-40 dark:border-white/15">Reset</button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-12 min-w-0 flex-1 rounded-xl bg-brand-500 px-4 text-sm font-bold text-white">Show {resultsLabel}</button>
      </div>
    }><div className="space-y-5">{children}</div></MobileDialog>
  </>
}
