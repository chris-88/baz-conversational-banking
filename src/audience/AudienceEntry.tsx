import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { SparklesIcon, UserRoundIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IconTile } from '@/components/IconTile'
import { ListRow } from '@/components/ListRow'
import { PrototypeBanner } from '@/components/PrototypeBanner'
import { MobileHeader } from '@/shells/boi/MobileHeader'
import { startSession } from '@/lib/session'
import { routes } from '@/app/routes'

/**
 * §45, §46 — the audience entry point.
 *
 * Every scan gets its own case. Isolation is by ownership, so nothing anyone does here can
 * reach the presenter's case on screen.
 */
export function AudienceEntry(): ReactNode {
  const navigate = useNavigate()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const start = (mode: 'fresh' | 'clone') => {
    setBusy(mode)
    setError(null)
    startSession(mode)
      .then(() => void navigate(routes.baz))
      .catch((caught: unknown) =>
        setError(caught instanceof Error ? caught.message : 'Could not start a conversation.'),
      )
      .finally(() => setBusy(null))
  }

  return (
    <div className="bg-background min-h-dvh">
      <PrototypeBanner />
      <MobileHeader subtitle="Try it yourself" />

      <main className="mx-auto w-full max-w-md space-y-6 px-4 py-6">
        <section className="space-y-3">
          <h1 className="text-xl font-semibold tracking-tight">Try Baz</h1>
          <p className="text-muted-foreground text-sm">
            Your own private conversation, completely separate from the demonstration on screen.
          </p>
        </section>

        <Card className="gap-0 divide-y p-0">
          <ListRow
            leading={<IconTile tone="primary"><SparklesIcon /></IconTile>}
            title="Start fresh"
            subtitle="A brand new customer, with nothing known about them"
            disabled={busy !== null}
            onClick={() => start('fresh')}
          />
          <ListRow
            leading={<IconTile tone="deep"><UserRoundIcon /></IconTile>}
            title="Use the demo customer"
            subtitle="Already signed in, with the facts the bank holds"
            disabled={busy !== null}
            onClick={() => start('clone')}
          />
        </Card>

        {error !== null && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <p className="text-muted-foreground text-2xs">
          Nothing you do here can affect the demonstration. Conversations are capped, and no
          notifications are sent.
        </p>
      </main>
    </div>
  )
}
