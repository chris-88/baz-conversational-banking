import type { ReactNode } from 'react'
import { m } from 'motion/react'
import { ShareIcon, SmartphoneIcon, SquarePlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconTile } from '@/components/IconTile'
import { platform, useInstallPrompt } from '@/lib/installed'
import { DURATION, EASE, useStill } from '@/lib/motion'

/**
 * Keep Baz on the home screen.
 *
 * The move from a browser tab to the installed app is the continuity story on the big screen:
 * sign in here, open it there, "pick up where you left off", the same conversation. This is
 * the card that leads into it, offered once, after signing in.
 *
 * iOS has no install API, so the guide is the Share sheet, and the glyph breathes so the eye
 * finds it. Android gets the browser's own prompt. Nothing here is platform-sniffing for its
 * own sake: it is the difference between an instruction and a shrug.
 */
export function InstallCard({ onDismiss }: { readonly onDismiss: () => void }): ReactNode {
  const prompt = useInstallPrompt()
  const still = useStill()
  const where = platform()

  const install = () => {
    if (prompt === null) return
    void prompt.prompt().finally(onDismiss)
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <IconTile tone="deep">
          <SmartphoneIcon />
        </IconTile>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-balance">Keep Baz on your home screen</h3>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            It opens like any other app, and your conversation is already in it. No app store
            involved.
          </p>
        </div>
      </div>

      {where === 'ios' ? (
        <ol className="divide-y border-t">
          <li className="flex items-center gap-3 px-4 py-3">
            {/* Breathes so the eye finds the glyph it is about to look for on the toolbar. */}
            <m.span
              aria-hidden
              className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg"
              {...(still
                ? {}
                : {
                    animate: { scale: [1, 1.08, 1], opacity: [1, 0.75, 1] },
                    transition: { duration: DURATION.slow * 4, ease: EASE, repeat: Infinity },
                  })}
            >
              <ShareIcon className="size-4" />
            </m.span>
            <p className="text-sm leading-snug">
              Tap <span className="font-semibold">Share</span> at the bottom of Safari.
            </p>
          </li>
          <li className="flex items-center gap-3 px-4 py-3">
            <span
              aria-hidden
              className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg"
            >
              <SquarePlusIcon className="size-4" />
            </span>
            <p className="text-sm leading-snug">
              Then <span className="font-semibold">Add to Home Screen</span>.
            </p>
          </li>
        </ol>
      ) : (
        <div className="border-t p-3">
          <Button className="w-full" disabled={prompt === null} onClick={install}>
            Add Baz to your home screen
          </Button>
        </div>
      )}

      <div className="bg-muted/40 flex items-center justify-between gap-3 border-t px-4 py-2.5">
        <p className="text-muted-foreground text-xs leading-relaxed">
          Open it from there and pick up where you left off.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground shrink-0"
          onClick={onDismiss}
        >
          Not now
        </Button>
      </div>
    </Card>
  )
}
