import { useCallback, useEffect } from 'react'
import { THEME_KEY } from '../constants/types'
import { useLocalStorage, usePrefersDark } from '../store/useLocalStorage'

export type Theme = 'light' | 'dark'

export function useTheme() {
  const prefersDark = usePrefersDark()
  const [stored, setStored] = useLocalStorage<Theme | null>(THEME_KEY, null)
  const theme: Theme = stored ?? (prefersDark ? 'dark' : 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggle = useCallback(() => {
    setStored(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setStored])

  return { theme, toggle }
}