import type { ReactNode } from 'react'
import { BazMark } from '@/baz/BazMark'

/**
 * The customer's lock screen, the moment the push lands.
 *
 * Drawn, not photographed, and carrying the notification's real copy: the fixed text the
 * console sends, which says nothing about the case because a lock screen is where anybody
 * can read it (§36). The time is the demonstration's; the date is the day the watch is met.
 */
export const NOTIFICATION_COPY =
  'Baz has an update about something you’re working on with us. Open Baz to pick it up.'

export function LockScreen(): ReactNode {
  return (
    <div className="flex h-full w-full flex-col bg-[radial-gradient(ellipse_at_top,oklch(0.42_0.12_258),oklch(0.2_0.06_258)_70%)] px-5 pt-14 text-white">
      <p className="text-center text-[15px] font-medium opacity-80">Friday 14 May</p>
      <p className="mt-1 text-center text-[76px] leading-none font-semibold tracking-tight">9:41</p>

      <div className="mt-10 rounded-2xl bg-white/85 p-3.5 text-[#111] shadow-xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <span className="bg-baz-primary grid size-10 shrink-0 place-items-center rounded-xl text-white">
            <span className="size-6">
              <BazMark />
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold">Baz</p>
              <p className="text-[11px] opacity-60">now</p>
            </div>
            <p className="mt-0.5 text-[13px] leading-snug">{NOTIFICATION_COPY}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
