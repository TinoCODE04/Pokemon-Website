import { useEffect, type RefObject } from 'react'

/** Keep dialogs inside the visible area when a mobile keyboard opens. */
export function useDialogViewport(ref: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    if (!open) return
    const viewport = window.visualViewport
    const update = () => {
      const element = ref.current
      if (!element) return
      const height = viewport?.height ?? window.innerHeight
      const top = viewport?.offsetTop ?? 0
      element.style.setProperty('--dialog-height', `${height}px`)
      element.style.setProperty('--dialog-top', `${top}px`)
      element.style.setProperty('--dialog-bottom', `${Math.max(0, window.innerHeight - height - top)}px`)
    }
    update()
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [open, ref])
}
