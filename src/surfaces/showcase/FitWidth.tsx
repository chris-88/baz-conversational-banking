import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A picture drawn for a wide screen, shown whole on a narrow one.
 *
 * The chapter pictures are composed at a design width and cannot reflow: three cards in a
 * row, a diagram with its wires. On a phone they are scaled down as one piece rather than
 * squeezed, so what the room sees and what the phone sees are the same picture. At or above
 * the design width nothing happens. The outer box takes the scaled height so the layout
 * around it is honest about the space the picture uses.
 */
export function FitWidth({
  designWidth,
  children,
  className,
}: {
  readonly designWidth: number
  readonly children: ReactNode
  readonly className?: string
}): ReactNode {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState<number | null>(null)

  useLayoutEffect(() => {
    const outerEl = outer.current
    const innerEl = inner.current
    if (outerEl === null || innerEl === null || typeof ResizeObserver === 'undefined') return

    const measure = (): void => {
      const next = Math.min(1, outerEl.clientWidth / designWidth)
      setScale(next)
      setHeight(innerEl.offsetHeight * next)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(outerEl)
    observer.observe(innerEl)
    measure()
    return () => observer.disconnect()
  }, [designWidth])

  return (
    <div ref={outer} className={cn('w-full min-w-0 overflow-hidden', className)} style={height === null ? undefined : { height }}>
      <div
        ref={inner}
        className="mx-auto"
        style={{
          width: designWidth,
          maxWidth: scale < 1 ? 'none' : '100%',
          transform: scale < 1 ? `scale(${String(scale)})` : undefined,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}
