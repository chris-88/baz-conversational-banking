import type { ReactNode } from 'react'
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A chip: a short, tappable label.
 *
 * Three uses in the design system — a filter that is on or off, a quick reply that sends the
 * conversation somewhere, and a removable token for a filter already applied. `onRemove` and
 * `onClick` are separate because a removable chip has two targets, and the remove button needs
 * its own accessible name rather than inheriting the chip's.
 */
export function Chip({
  children,
  icon,
  selected = false,
  onClick,
  onRemove,
  removeLabel,
  disabled = false,
  className,
}: {
  children: ReactNode
  icon?: ReactNode
  selected?: boolean
  onClick?: () => void
  onRemove?: () => void
  removeLabel?: string
  disabled?: boolean
  className?: string
}): ReactNode {
  const shape = cn(
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors [&>svg]:size-4',
    selected
      ? 'border-primary bg-primary text-primary-foreground'
      : 'bg-card text-foreground hover:bg-accent',
    disabled && 'pointer-events-none opacity-50',
    className,
  )

  if (onRemove) {
    return (
      <span className={shape}>
        {icon}
        {children}
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          // The chip's own text is the context, so the label has to name what is being removed.
          aria-label={removeLabel ?? 'Remove'}
          className="focus-visible:ring-ring -mr-1 grid size-4 place-items-center rounded-full opacity-60 hover:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
        >
          <XIcon aria-hidden className="size-3.5" />
        </button>
      </span>
    )
  }

  if (!onClick) {
    return (
      <span className={shape}>
        {icon}
        {children}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(shape, 'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none')}
    >
      {icon}
      {children}
    </button>
  )
}
