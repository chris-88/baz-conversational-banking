import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A picture drawn for a wide screen, shown whole on a narrow one.
 *
 * The chapter pictures are composed at a design width and cannot reflow: three cards in a
 * row, a diagram with its wires. On a phone they are scaled down as one piece rather than
 * squeezed, so what the room sees and what the phone sees are the same picture. At or above
 * the design width nothing happens unless `maxScale` lets it grow, which the chapter stages allow so a room
 * sees it large. The outer box takes the scaled height so the layout
 * around it is honest about the space the picture uses.
 */
export function FitWidth({
  designWidth,
  maxScale = 1,
  children,
  className,
}: {
  readonly designWidth: number
  /** How far past its design width the picture may grow on a wide screen. 1 means never. */
  readonly maxScale?: number
  readonly children: ReactNode
  readonly className?: string
}): ReactNode {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState<number | null>(null)
  const [outerWidth, setOuterWidth] = useState(0)

  useLayoutEffect(() => {
    const outerEl = outer.current
    const innerEl = inner.current
    if (outerEl === null || innerEl === null || typeof ResizeObserver === 'undefined') return

    const measure = (): void => {
      const next = Math.min(maxScale, outerEl.clientWidth / designWidth)
      setScale(next)
      setOuterWidth(outerEl.clientWidth)
      setHeight(innerEl.offsetHeight * next)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(outerEl)
    observer.observe(innerEl)
    measure()
    return () => observer.disconnect()
  }, [designWidth, maxScale])

  return (
    <div ref={outer} className={cn('w-full min-w-0 overflow-hidden', className)} style={height === null ? undefined : { height }}>
      <div
        ref={inner}
        className="mx-auto"
        style={{
          width: designWidth,
          maxWidth: 'none',
          transform: scale === 1 ? undefined : `scale(${String(scale)})`,
          transformOrigin: 'top left',
          marginLeft: scale > 1 ? `${String((outerWidth - designWidth * scale) / 2)}px` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
