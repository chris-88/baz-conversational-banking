import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { MenuIcon } from 'lucide-react'
import { BazWordmark } from '@/baz/BazWordmark'

/** The drawn phone's size before scaling: a 390 by 860 screen inside a 10px bezel. */
export const PHONE_WIDTH = 410
export const PHONE_HEIGHT = 880

/**
 * A phone, drawn in CSS.
 *
 * No device photograph: the point is the interface inside it, which is the product's own,
 * and the frame only has to say "this is a phone" from the back of a room. The header is the
 * conversation screen's, with the menu drawn as an inert glyph rather than mounted, because
 * the real one reads the case list over the network.
 *
 * The phone is always the same phone. It is laid out at one size, the width the product is
 * designed for, and scaled as a whole to fit whatever box it is given, so a wide card inside
 * it cannot push the frame out and a narrow one cannot let it shrink: the width used to
 * follow the content's minimum width through the aspect ratio, and the phone changed shape
 * between one card and the next. On a room screen the frame may grow a little past its design
 * size; it never grows enough for the text inside to look blown up.
 */
export function PhoneFrame({
  children,
  maxScale = 1.2,
}: {
  readonly children: ReactNode
  /** How far past its design size the phone may grow in a big box. */
  readonly maxScale?: number
}): ReactNode {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const element = box.current
    if (element === null || typeof ResizeObserver === 'undefined') return
    const measure = (): void => {
      setScale(Math.min(maxScale, element.clientWidth / PHONE_WIDTH, element.clientHeight / PHONE_HEIGHT))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    measure()
    return () => observer.disconnect()
  }, [maxScale])

  return (
    <div ref={box} className="relative h-full min-h-0 w-full min-w-0 overflow-hidden">
      <div
        className="bg-foreground/90 absolute top-1/2 left-1/2 flex flex-col rounded-[2.9rem] p-[10px] shadow-2xl"
        style={{
          width: PHONE_WIDTH,
          height: PHONE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${String(scale)})`,
        }}
      >
        <div className="bg-background flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[2.3rem]">
          <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[12px] font-semibold tabular-nums">
            <span>9:41</span>
            <span aria-hidden className="flex items-center gap-1">
              <span className="bg-foreground h-2 w-0.5 rounded-sm" />
              <span className="bg-foreground h-2.5 w-0.5 rounded-sm" />
              <span className="bg-foreground h-3 w-0.5 rounded-sm" />
              <span className="border-foreground ml-1 h-2.5 w-5 rounded-sm border" />
            </span>
          </div>

          <header className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center px-4 py-2">
            <span aria-hidden className="text-muted-foreground grid size-9 place-items-center">
              <MenuIcon className="size-5" />
            </span>
            <span className="flex justify-center">
              <BazWordmark className="h-8" />
            </span>
            <span />
          </header>

          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </div>
    </div>
  )
}
