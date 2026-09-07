import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { PokemonCardSkeleton } from './PokemonCard'

export function PokemonGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6', className)}>
      {children}
    </div>
  )
}

export function PokemonGridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <PokemonGrid>
      {Array.from({ length: count }, (_, i) => (
        <PokemonCardSkeleton key={i} />
      ))}
    </PokemonGrid>
  )
}