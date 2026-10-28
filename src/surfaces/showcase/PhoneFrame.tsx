import type { ReactNode } from 'react'
import { MenuIcon } from 'lucide-react'
import { BazWordmark } from '@/baz/BazWordmark'

/**
 * A phone, drawn in CSS.
 *
 * No device photograph: the point is the interface inside it, which is the product's own,
 * and the frame only has to say "this is a phone" from the back of a room. The header is the
 * conversation screen's, with the menu drawn as an inert glyph rather than mounted, because
 * the real one reads the case list over the network.
 */
export function PhoneFrame({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <div className="bg-foreground/90 mx-auto flex h-full max-h-[880px] w-auto flex-col rounded-[2.9rem] p-[10px] shadow-2xl" style={{ aspectRatio: '400 / 864' }}>
      <div className="bg-background flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[2.3rem]">
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
  )
}
