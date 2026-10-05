import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The repeating row used for accounts, next steps, products and applications: a leading
 * element, a title with a quieter line beneath it, and an optional chevron.
 *
 * Renders as a link when it navigates, a button when it acts, and a plain row when it does
 * neither — so a row is never announced as interactive when it is not, and a row that goes
 * somewhere can be opened in a new tab like any other link.
 */
export type ListRowProps = {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  /** Navigates. Takes precedence over `onClick`. */
  to?: string | undefined
  onClick?: (() => void) | undefined
  disabled?: boolean | undefined
  /**
   * Lets the title and subtitle run onto more lines. A row is one line tall by default so a
   * list of them stays scannable, but the same component stacked into a card has the width to
   * spare and truncating there just hides the description.
   */
  wrap?: boolean | undefined
  className?: string | undefined
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  to,
  onClick,
  disabled,
  wrap = false,
  className,
}: ListRowProps): ReactNode {
  const content = (
    <>
      {leading}
      <span className="min-w-0 flex-1 text-left">
        <span className={cn('block text-sm font-medium', wrap ? 'text-pretty' : 'truncate')}>
          {title}
        </span>
        {subtitle !== undefined && (
          <span
            className={cn(
              'text-muted-foreground mt-0.5 block text-xs',
              wrap ? 'text-pretty' : 'truncate',
            )}
          >
            {subtitle}
          </span>
        )}
      </span>
      {trailing ?? (to ?? onClick ? <ChevronRightIcon aria-hidden className="text-muted-foreground size-4 shrink-0" /> : null)}
    </>
  )

  const shared = cn('flex w-full items-center gap-3 px-4 py-3', className)

  const interactive =
    'hover:bg-muted/60 focus-visible:ring-ring rounded-xl transition-colors focus-visible:ring-2 focus-visible:outline-none'

  if (to !== undefined) {
    return (
      <Link to={to} className={cn(shared, interactive)}>
        {content}
      </Link>
    )
  }

  if (!onClick) {
    return <div className={shared}>{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(shared, interactive, 'disabled:pointer-events-none disabled:opacity-60')}
    >
      {content}
    </button>
  )
}
