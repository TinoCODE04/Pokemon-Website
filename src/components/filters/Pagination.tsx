import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { paginationWindow } from '../../utils/pagination'

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  const window = paginationWindow(page, totalPages)

  return (
    <nav className="mt-8 max-w-full" aria-label="Pagination">
      <div className="flex items-center justify-between gap-2 sm:hidden">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 disabled:opacity-40 dark:border-white/10"><ChevronLeft size={20} /></button>
        <label className="flex min-w-0 flex-wrap items-center justify-center gap-2 text-sm font-semibold">
          <span>Page</span>
          <select aria-label="Go to page" value={page} onChange={(event) => onChange(Number(event.target.value))} className="h-11 min-w-0 max-w-24 rounded-xl border border-slate-200 bg-white px-2 dark:border-white/10 dark:bg-night-900">
            {Array.from({ length: totalPages }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
          </select>
          <span>of {totalPages}</span>
        </label>
        <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 disabled:opacity-40 dark:border-white/10"><ChevronRight size={20} /></button>
      </div>
      <div className="hidden overflow-x-auto pb-1 sm:block">
      <div className="mx-auto flex w-max flex-nowrap items-center gap-1.5 px-0.5">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand-400 hover:text-brand-500 disabled:opacity-40 dark:border-white/10"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {window.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="shrink-0 px-1 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'h-9 min-w-9 shrink-0 rounded-full border px-2 text-sm font-semibold transition',
                p === page
                  ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:border-brand-400 hover:text-brand-500 dark:border-white/10 dark:text-slate-300',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand-400 hover:text-brand-500 disabled:opacity-40 dark:border-white/10"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      </div>
    </nav>
  )
}
