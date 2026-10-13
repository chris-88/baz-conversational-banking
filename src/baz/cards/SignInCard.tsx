import { useEffect, useState, type ReactNode } from 'react'
import { CheckIcon, LockIcon } from 'lucide-react'
import type { Card as CardPayload } from '@contracts/cards.ts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { lastSignInError } from '@/lib/identity'

type Payload = Extract<CardPayload, { type: 'sign_in' }>

/**
 * The Google mark, drawn rather than fetched.
 *
 * Google's brand guidelines require their own logo on the button, and loading it from a CDN
 * would make a third-party request on a page whose whole argument is that it is careful with
 * what it shares.
 */
function GoogleMark(): ReactNode {
  return (
    <svg viewBox="0 0 48 48" className="size-4 shrink-0" aria-hidden>
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  )
}

/**
 * §28 — offered once, at the point where signing in protects something that already exists.
 *
 * Deliberately not a wall. Everything on screen stays usable, there is no "maybe later" to
 * dismiss and nothing is withheld: somebody who ignores this carries on exactly as before, and
 * the card stays in the transcript as a record of having been offered.
 */
export function SignInCard({
  card,
  onSignIn,
  disabled,
}: {
  card: Payload
  onSignIn?: () => Promise<{ ok: boolean; message?: string }> | void
  disabled?: boolean
}): ReactNode {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /*
   * A sign-in that failed on the way back has nowhere else to appear.
   *
   * `completeSignIn` runs before React mounts, so it leaves the reason behind and this is the
   * one component guaranteed to be on screen afterwards — the card they tapped. Without this
   * the screen simply jumped to Google and came back, with nothing said.
   */
  useEffect(() => {
    const failed = lastSignInError()
    if (failed !== null) setError(failed)
  }, [])

  const run = () => {
    if (!onSignIn || busy) return
    setBusy(true)
    setError(null)
    // Succeeds by navigating away, so `busy` is only ever cleared by a failure.
    void Promise.resolve(onSignIn())
      .then((result) => {
        if (result && result.ok === false) {
          setError(result.message ?? 'That did not work. Try again in a moment.')
          setBusy(false)
        }
      })
      .catch(() => {
        setError('That did not work. Try again in a moment.')
        setBusy(false)
      })
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-col items-center px-4 pt-5 pb-4 text-center">
        <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full">
          <LockIcon className="size-5" />
        </span>
        <h3 className="mt-3 text-base font-semibold text-balance">{card.title}</h3>

        <ul className="mt-3 space-y-1.5 text-left">
          {card.points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <span className="text-muted-foreground leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 px-4 pb-4">
        <Button className="w-full" disabled={(disabled ?? false) || busy} onClick={run}>
          <GoogleMark />
          Continue with Google
        </Button>

        <p className="text-muted-foreground text-center text-xs leading-relaxed">
          {card.reassurance}
        </p>

        {error !== null && <p className="text-destructive text-center text-xs">{error}</p>}

        <p className="text-center">
          <a
            href={card.whyHref}
            className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
          >
            What Baz does with your details
          </a>
        </p>
      </div>
    </Card>
  )
}
