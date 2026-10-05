import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { SmartphoneIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createHandoff } from '@/lib/session'
import { routes } from '@/app/routes'

/**
 * §6 Stage 4, §29 — carries the conversation into the authenticated app.
 *
 * The link holds an opaque single-use code, never the case or anything about it (Invariant 8).
 * The case itself stays server-side; the code only proves this is the same person.
 */
export function ContinueInApp(): ReactNode {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-1">
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={busy}
        onClick={() => {
          setBusy(true)
          setError(null)
          createHandoff()
            .then((code) => void navigate(`${routes.app.login}?h=${code}`))
            .catch((caught: unknown) =>
              setError(caught instanceof Error ? caught.message : 'Could not carry that over.'),
            )
            .finally(() => setBusy(false))
        }}
      >
        <SmartphoneIcon />
        {busy ? 'One moment…' : 'Continue in the app'}
      </Button>
      <p className="text-muted-foreground text-center text-2xs">
        {error ?? 'Sign in and pick up exactly where you are.'}
      </p>
    </div>
  )
}
