import type { ReactNode } from 'react'
import { FileCodeIcon, FileJsonIcon, TargetIcon } from 'lucide-react'
import type { Mini } from '@/content/how-it-works/pivots'
import { cn } from '@/lib/utils'

/**
 * A small rendering of a real screen, for the before and after of a pivot.
 *
 * Five pivots, six shapes, because a list of grey pills can stand for anything and therefore
 * says nothing. "Products, Plans, Applications, Navigation" reads as four words; a nav bar
 * above four tiles reads as a screen somebody built and then deleted, which is the thing the
 * section is actually about.
 *
 * Everything here is deliberately small and unlabelled. It is a thumbnail of a product, not a
 * working one, and it has to read in a second from across a room.
 */
export function PivotMini({
  mini,
  faded,
}: {
  readonly mini: Mini
  /** The before state, shown beside its replacement rather than instead of it. */
  readonly faded?: boolean
}): ReactNode {
  return (
    <div
      className={cn(
        'bg-card h-full rounded-lg border p-3 transition-opacity',
        faded === true && 'opacity-55 saturate-50',
      )}
    >
      <Inner mini={mini} />
    </div>
  )
}

function Inner({ mini }: { readonly mini: Mini }): ReactNode {
  switch (mini.kind) {
    case 'tiles':
      return (
        <ul className="space-y-1.5">
          {mini.items.map((item, index) => (
            <li
              key={item}
              className="bg-background flex items-center gap-2 rounded-md border px-2 py-1.5"
            >
              <span
                aria-hidden
                className={cn('size-3.5 shrink-0 rounded', TILE_TONES[index % TILE_TONES.length])}
              />
              <span className="truncate text-[11px] font-medium">{item}</span>
            </li>
          ))}
        </ul>
      )

    case 'chat':
      return (
        <div className="space-y-1.5 py-1">
          {mini.lines.map((line) => (
            <p
              key={line.text}
              className={cn(
                'w-fit max-w-[92%] rounded-xl px-2.5 py-1.5 text-[11px] leading-snug',
                line.from === 'customer'
                  ? 'bg-primary text-primary-foreground ml-auto rounded-br-sm'
                  : 'bg-muted rounded-bl-sm',
              )}
            >
              {line.text}
            </p>
          ))}
        </div>
      )

    case 'goal':
      return (
        <div className="border-primary/30 bg-primary/5 rounded-md border p-2.5">
          <div className="flex items-center gap-2">
            <span className="bg-primary/15 text-primary grid size-5 shrink-0 place-items-center rounded">
              <TargetIcon aria-hidden className="size-3" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11.5px] font-semibold">{mini.title}</p>
              <p className="text-muted-foreground text-[10px]">{mini.meta}</p>
            </div>
          </div>
          <ul className="mt-2 space-y-1 border-t pt-2">
            {mini.items.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <span aria-hidden className="bg-primary/40 size-1 rounded-full" />
                <span className="truncate text-[10.5px]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )

    case 'dashboard':
      return (
        <div>
          <div className="mb-2 flex flex-wrap gap-1 border-b pb-2">
            {mini.nav.map((item, index) => (
              <span
                key={item}
                className={cn(
                  'rounded px-1.5 py-0.5 text-[9px] whitespace-nowrap',
                  index === 0 ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                )}
              >
                {item}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {mini.tiles.map((tile, index) => (
              <div key={tile} className="bg-background rounded-md border p-1.5">
                <span
                  aria-hidden
                  className={cn(
                    'block size-3 rounded',
                    TILE_TONES[index % TILE_TONES.length],
                  )}
                />
                <span className="mt-1 block truncate text-[9.5px]">{tile}</span>
              </div>
            ))}
          </div>
        </div>
      )

    /** The one pivot where before and after are the same list and only the owner changes. */
    case 'tasks':
      return (
        <ul className="space-y-1.5">
          {mini.items.map((item) => (
            <li
              key={item.text}
              className="bg-background flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
            >
              <span className="truncate text-[10.5px]">{item.text}</span>
              <span
                className={cn(
                  'shrink-0 rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold tracking-[0.06em] uppercase',
                  item.owner === 'model'
                    ? 'bg-decides-model/15 text-decides-model'
                    : 'bg-decides-code/15 text-decides-code',
                )}
              >
                {item.owner === 'model' ? 'model' : 'code'}
              </span>
            </li>
          ))}
        </ul>
      )

    case 'docs':
      return (
        <ul className="space-y-1.5">
          {mini.items.map((item) => (
            <li
              key={item.title}
              className={cn(
                'bg-background flex items-start gap-2 rounded-md border px-2 py-1.5',
                mini.source === 'theirs' && 'border-primary/40 bg-primary/5',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'mt-px grid size-4 shrink-0 place-items-center rounded [&>svg]:size-2.5',
                  mini.source === 'theirs'
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {mini.source === 'theirs' ? <FileJsonIcon /> : <FileCodeIcon />}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-mono text-[10px] font-medium">
                  {item.title}
                </span>
                <span className="text-muted-foreground block text-[9.5px]">{item.note}</span>
              </span>
            </li>
          ))}
        </ul>
      )
  }
}

/** Product accents, so a list of four tiles reads as four things rather than one. */
const TILE_TONES = [
  'bg-product-mortgage/60',
  'bg-product-personal-loan/60',
  'bg-product-savings/60',
  'bg-product-credit-card/60',
] as const
