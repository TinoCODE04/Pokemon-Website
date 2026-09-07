import { Link } from 'react-router-dom'
import { typeStyle } from '../../constants/types'
import { cn } from '../../utils/cn'

export function TypeBadge({
  type,
  size = 'md',
  linked = false,
  className,
}: {
  type: string
  size?: 'sm' | 'md' | 'lg'
  linked?: boolean
  className?: string
}) {
  const style = typeStyle(type)
  const Icon = style.icon

  const inner = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold capitalize text-white shadow-sm',
        size === 'sm' && 'px-2 py-0.5 text-[11px]',
        size === 'md' && 'px-3 py-1 text-xs',
        size === 'lg' && 'px-4 py-1.5 text-sm',
        linked && 'transition-transform hover:scale-105 hover:brightness-110',
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})` }}
    >
      <Icon className={cn(size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
      {type}
    </span>
  )

  if (linked) {
    return (
      <Link to={`/types/${type}`} onClick={(e) => e.stopPropagation()}>
        {inner}
      </Link>
    )
  }
  return inner
}