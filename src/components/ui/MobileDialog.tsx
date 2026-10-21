import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useDialogViewport } from '../../hooks/useDialogViewport'

export function MobileDialog({ open, onClose, title, children, footer, variant = 'sheet', desktopQuery = '(min-width: 640px)' }: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  variant?: 'sheet' | 'drawer'
  desktopQuery?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const closeRef = useRef(onClose)
  const titleId = useId()
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useDialogViewport(ref, open)

  useEffect(() => {
    if (!open || !ref.current) return
    const dialog = ref.current
    const opener = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    const desktop = matchMedia(desktopQuery)
    const closeOnDesktop = () => { if (desktop.matches) closeRef.current() }
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    desktop.addEventListener('change', closeOnDesktop)
    return () => {
      desktop.removeEventListener('change', closeOnDesktop)
      dialog.close()
      document.body.style.overflow = overflow
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [open, desktopQuery])

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`mobile-dialog mobile-dialog-${variant}`}
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
      }}
    >
      {open && <>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <h2 id={titleId} className="font-display text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10"><X size={20} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        {footer && <footer className="mobile-dialog-footer shrink-0 border-t border-slate-200 px-4 py-3 dark:border-white/10">{footer}</footer>}
      </>}
    </dialog>, document.body,
  )
}
