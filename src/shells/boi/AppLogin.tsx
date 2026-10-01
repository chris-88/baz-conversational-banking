import type { ReactNode } from 'react'
import { ShieldCheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MilestonePanel } from '@/components/MilestonePanel'
import { Wordmark } from '@/shells/boi/Wordmark'

/** §6 Stage 4 — simulated login. Accepts anything and says so (Invariant 10). */
export function AppLogin(): ReactNode {
  return (
    <div className="flex-1 space-y-6 px-4 pt-6 pb-10">
      <div className="space-y-5">
        <Wordmark tone="primary" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-muted-foreground text-sm">Pick up exactly where you left off.</p>
        </div>
      </div>

      <Card className="gap-4 p-5">
        <div className="space-y-3">
          <Field label="User ID" placeholder="Any value will do" />
          <Field label="Date of birth" placeholder="DD / MM / YYYY" />
        </div>
        <Button className="w-full" size="lg" disabled>
          Sign in
        </Button>
      </Card>

      <Alert>
        <ShieldCheckIcon />
        <AlertDescription>
          A simulated sign-in for demonstration purposes. It accepts any details and connects to
          no real banking system.
        </AlertDescription>
      </Alert>

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

/** Inert until M4. Shown so the screen reads as a sign-in rather than an empty page. */
function Field({ label, placeholder }: { label: string; placeholder: string }): ReactNode {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium">{label}</span>
      <span className="border-input bg-muted/40 text-muted-foreground block rounded-lg border px-3 py-2.5 text-sm">
        {placeholder}
      </span>
    </label>
  )
}
