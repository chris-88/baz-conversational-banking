import { useState, type ReactNode } from 'react'
import { CheckIcon, LockIcon, MailIcon } from 'lucide-react'
import type { Card as CardPayload } from '@contracts/cards.ts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  clearSignInError,
  lastSignInError,
  startEmailSignIn,
  verifyEmailCode,
} from '@/lib/identity'
import { Input } from '@/components/ui/input'

type Payload = Extract<CardPayload, { type: 'sign_in' }>

/**
 * How many digits the field will take.
 *
 * Supabase allows six to ten and the project is pushed to six, so six is what the copy says.
 * The range is here rather than a single number because the authority for the real length is
 * the hosted auth config, which this bundle cannot read: accepting the range means a config
 * that drifts produces a rejected code with a reason, rather than a code silently cut short.
 */
const MIN_CODE = 6
const MAX_CODE = 10

/**
 * §28 — offered once, at the point where signing in protects something that already exists.
 *
 * Deliberately not a wall. Everything on screen stays usable, there is no "maybe later" to
 * dismiss and nothing is withheld: somebody who ignores this carries on exactly as before, and
 * the card stays in the transcript as a record of having been offered.
 */
export function SignInCard({
  card,
  disabled,
}: {
  card: Payload
  disabled?: boolean
}): ReactNode {
  const [busy, setBusy] = useState(false)

  /*
   * A sign-in that failed on the way back has nowhere else to appear.
   *
   * `completeSignIn` runs before React mounts, so it leaves the reason behind, and this is the
   * one component guaranteed to be on screen afterwards — the card they tapped. Without it the
   * screen simply jumped to Google and came back with nothing said.
   *
   * Read as the initial value rather than in an effect: an effect that sets state on mount is
   * a cascading render, and the read is deliberately non-destructive so StrictMode's second
   * pass does not swallow the message. It is cleared when they try again.
   */
  const [error, setError] = useState<string | null>(() => lastSignInError())

  /*
   * Email only.
   *
   * Google worked and was removed on purpose. In front of a banking audience "why is a bank
   * signing people in with Google" is a question that takes the room somewhere else, and the
   * consent screen names the Supabase project rather than Baz, which reads as unfinished. The
   * provider code is still in `identity.ts` and nothing is surfaced for it.
   */
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')

  const enterCode = () => {
    if (busy) return
    setBusy(true)
    setError(null)
    void verifyEmailCode(email, code).then((result) => {
      setBusy(false)
      if (result.ok) {
        // The session is live. Reload into it rather than reconciling state by hand: this is
        // the same page, the same tab and the same conversation, now signed in.
        window.location.reload()
        return
      }
      setError(result.message ?? 'That did not work.')
    })
  }

  const sendLink = () => {
    if (busy) return
    setBusy(true)
    setError(null)
    clearSignInError()
    void startEmailSignIn(email).then((result) => {
      setBusy(false)
      if (result.ok) setSent(true)
      else setError(result.message ?? 'That did not work.')
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
        {sent ? (
          /*
           * The code first, the link second, and that order is the whole point.
           *
           * On an installed app a link opens in the browser, which is a different session and
           * looks exactly like losing the conversation. iOS has no way back into an installed
           * web app, so the fix is not to leave: read six digits, come back, type them here.
           */
          <div className="space-y-2">
            <p className="text-center text-sm font-medium">
              Check your email and enter the six digits.
            </p>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              /*
               * Six is what the project sends and what the copy says, and the field still
               * takes more than six.
               *
               * How long the code is lives in the hosted auth config, not in this bundle, and
               * it was quietly on eight while every number here was six: the email sent eight
               * digits, the input dropped the last two, and signing in was impossible. The
               * length is pushed from `scripts/push-auth-templates.mjs` now, so the two agree
               * — but a field that truncates cannot tell anybody what went wrong, and a field
               * that accepts the whole code lets the server reject it with a reason.
               */
              maxLength={MAX_CODE}
              placeholder="000000"
              aria-label="The code from your email"
              className="text-center text-lg tracking-[0.4em] tabular-nums"
              value={code}
              disabled={(disabled ?? false) || busy}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, '').slice(0, MAX_CODE))
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') enterCode()
              }}
            />
            <Button
              className="w-full"
              disabled={(disabled ?? false) || busy || code.length < MIN_CODE}
              onClick={enterCode}
            >
              {busy ? 'Checking…' : 'Continue'}
            </Button>
            <p className="text-muted-foreground text-center text-xs leading-relaxed">
              There is a link in the email too, but it opens a browser. The code keeps you here,
              in this conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-label="Your email address"
              value={email}
              disabled={(disabled ?? false) || busy}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') sendLink()
              }}
            />
            <Button
              className="w-full"
              disabled={(disabled ?? false) || busy || email.trim().length === 0}
              onClick={sendLink}
            >
              <MailIcon className="size-4" />
              {busy ? 'Sending…' : 'Send me a link'}
            </Button>
          </div>
        )}

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
