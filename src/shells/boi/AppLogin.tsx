import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheckIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wordmark } from '@/shells/boi/Wordmark'
import { redeemHandoff, startSession } from '@/lib/session'
import { routes } from '@/app/routes'

/**
 * §6 Stage 4 — the simulated login.
 *
 * It accepts anything and says so (Invariant 10). What it actually does is redeem the handoff
 * code, which attaches this session to the same participant so the conversation continues
 * rather than restarting (§29).
 */
export function AppLogin(): ReactNode {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const code = searchParams.get('h')
  const [userId, setUserId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setBusy(true)
    setError(null)

    try {
      // With a code, this is the handoff. Without one, it is an ordinary sign-in.
      if (code !== null) await redeemHandoff(code)
      else await startSession('demo')

      await queryClient.invalidateQueries()
      void navigate(code !== null ? routes.app.baz : routes.app.root)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign you in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 px-4 pt-6 pb-10">
      <div className="space-y-5">
        <Wordmark tone="primary" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-muted-foreground text-sm">
            {code !== null
              ? 'Sign in and Baz picks up exactly where you left off.'
              : 'Pick up exactly where you left off.'}
          </p>
        </div>
      </div>

      <Card className="gap-4 p-5">
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="user-id">User ID</Label>
            <Input
              id="user-id"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Anything at all"
              autoComplete="off"
            />
          </div>

          {error !== null && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>

      <Alert>
        <ShieldCheckIcon />
        <AlertDescription>
          A simulated sign-in for demonstration purposes. It accepts any details, checks nothing,
          and connects to no real banking system.
        </AlertDescription>
      </Alert>
    </div>
  )
}
