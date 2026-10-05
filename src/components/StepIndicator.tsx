import type { ReactNode } from 'react'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Step = { readonly id: string; readonly label: string }

/**
 * Where an application is in its journey, as the boards show it: numbered circles joined by a
 * line, the current one filled, the finished ones ticked.
 */
export function StepIndicator({
  steps,
  current,
  className,
}: {
  steps: readonly Step[]
  /** Index of the step in progress. Everything before it is done. */
  current: number
  className?: string
}): ReactNode {
  return (
    <ol className={cn('flex items-start', className)}>
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current

        return (
          <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <span className={cn('h-px flex-1', index === 0 ? 'bg-transparent' : done || active ? 'bg-primary' : 'bg-border')} />
              <span
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full border text-2xs font-semibold transition-colors',
                  done && 'bg-primary border-primary text-primary-foreground',
                  active && 'border-primary text-primary bg-card ring-primary/20 ring-4',
                  !done && !active && 'border-border text-muted-foreground bg-card',
                )}
              >
                {done ? <CheckIcon className="size-3" /> : index + 1}
              </span>
              <span className={cn('h-px flex-1', index === steps.length - 1 ? 'bg-transparent' : done ? 'bg-primary' : 'bg-border')} />
            </div>
            <span
              className={cn(
                'text-center text-2xs leading-tight',
                active ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
