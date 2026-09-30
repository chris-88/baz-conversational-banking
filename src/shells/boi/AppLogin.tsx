import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MilestonePanel } from '@/components/MilestonePanel'
import { InfoIcon } from 'lucide-react'

/** §6 Stage 4 — simulated BOI login. Accepts anything and says so (Invariant 10). */
export function AppLogin(): ReactNode {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <Alert>
          <InfoIcon />
          <AlertDescription>
            This is a simulated Bank of Ireland login for demonstration purposes. It accepts any
            details and connects to no real banking system.
          </AlertDescription>
        </Alert>
      </div>

      <Button className="w-full" disabled>
        Sign in
      </Button>

      <MilestonePanel
        milestone="M4"
        title="Authentication and continuity"
        description="Redeeming a handoff code attaches this session to the same participant."
        sections={['§6 Stage 4', '§6 Stage 5', '§28', '§29']}
        scope={[
          'Handoff code from the public site redeemed here, single-use and short-TTL',
          'The new anonymous session joins the existing participant, so the case continues',
          'Case linked to the synthetic bank-held customer record',
          'Bank-held facts loaded and not re-asked unless the journey says confirm or fresh',
        ]}
      />
    </div>
  )
}
