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
 * Every visitor gets their own case, and the only choice that matters is whether the bank
 * already deals with them. That is a real difference a customer would feel, not a mode: a new
 * customer is asked everything, an existing one is asked almost nothing, and the gap between
 * those two conversations is the whole argument.
 */
export function AudienceEntry(): ReactNode {
  const navigate = useNavigate()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const start = (mode: 'new' | 'known') => {
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
      <MobileHeader subtitle="Talk to Baz" />

      <main className="mx-auto w-full max-w-md space-y-6 px-4 py-6">
        <section className="space-y-3">
          <h1 className="text-xl font-semibold tracking-tight">Talk to Baz</h1>
          <p className="text-muted-foreground text-sm">
            Your own conversation, kept entirely separate from anyone else&rsquo;s.
          </p>
        </section>

        <Card className="gap-0 divide-y p-0">
          <ListRow
            leading={<IconTile tone="primary"><SparklesIcon /></IconTile>}
            title="I'm new to the bank"
            subtitle="Nothing is known about you yet"
            disabled={busy !== null}
            onClick={() => start('new')}
          />
          <ListRow
            leading={<IconTile tone="deep"><UserRoundIcon /></IconTile>}
            title="I'm already a customer"
            subtitle="Signed in, with the details the bank already holds"
            disabled={busy !== null}
            onClick={() => start('known')}
          />
        </Card>

        {error !== null && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <p className="text-muted-foreground text-2xs">
          Nothing you do here can reach anybody else's conversation. Conversations are capped, and no
          notifications are sent.
        </p>
      </main>
    </div>
  )
}
