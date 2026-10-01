import type { ReactNode } from 'react'
import { ShieldCheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MilestonePanel } from '@/components/MilestonePanel'

/** §6 Stage 4 — simulated login. Accepts anything and says so (Invariant 10). */
export function AppLogin(): ReactNode {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground text-sm">Continue where you left off.</p>
      </div>

      <Alert>
        <ShieldCheckIcon />
        <AlertDescription>
          This is a simulated sign-in for demonstration purposes. It accepts any details and
          connects to no real banking system.
        </AlertDescription>
      </Alert>

      <Button className="w-full" size="lg" disabled>
        Sign in
      </Button>

      <MilestonePanel
        milestone="M4"
        title="Authentication and continuity"
        description="Redeeming a handoff code attaches this session to the same participant."
        sections={['§6 Stage 4', '§6 Stage 5', '§28', '§29']}
        scope={[
          'A single-use, short-lived handoff code from the public site is redeemed here',
          'The new session joins the existing participant, so the case continues',
          'The case links to the synthetic bank-held customer record',
          'Bank-held facts load and are not re-asked unless the journey says confirm or fresh',
        ]}
      />
    </div>
  )
}
