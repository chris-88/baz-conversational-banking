import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { FileTextIcon, UploadIcon, UsersIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { IconTile } from '@/components/IconTile'
import { ListRow } from '@/components/ListRow'
import { MilestonePanel } from '@/components/MilestonePanel'
import { PrototypeBanner } from '@/components/PrototypeBanner'
import { MobileHeader } from '@/shells/boi/MobileHeader'

/** §6 Stage 9, §33 — a partner joins through a single-use token and sees only their own tasks. */
export function PartnerJoin(): ReactNode {
  const { token } = useParams<{ token: string }>()

  return (
    <div className="bg-background min-h-dvh">
      <PrototypeBanner />
      <MobileHeader subtitle="Second applicant" />

      <main className="mx-auto w-full max-w-md space-y-6 px-4 py-6">
        <section className="space-y-4">
          <IconTile tone="deep" size="lg">
            <UsersIcon />
          </IconTile>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">You&rsquo;ve been invited</h1>
            <p className="text-muted-foreground text-sm">
              Complete your part of the applications you are named on. You will not see the other
              applicant&rsquo;s conversation or their information.
            </p>
          </div>
          <p className="text-muted-foreground text-2xs tabular">
            Invite token present: {token ? 'yes' : 'no'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Your tasks</h2>
          <Card className="gap-0 divide-y p-0">
            <ListRow
              leading={<IconTile tone="neutral"><FileTextIcon /></IconTile>}
              title="Confirm your details"
              subtitle="Name, date of birth and PPS number"
            />
            <ListRow
              leading={<IconTile tone="neutral"><UploadIcon /></IconTile>}
              title="Upload your latest payslip"
              subtitle="Needed for the mortgage application"
            />
          </Card>
          <p className="text-muted-foreground text-2xs">
            Illustrative. Real tasks are computed from outstanding requirements in M5.
          </p>
        </section>

        <MilestonePanel
          milestone="M5"
          title="Partner participation"
          description="Scoped data only: a partner never reads the primary customer's conversation."
          sections={['§6 Stage 9', '§33', '§29', '§58']}
          scope={[
            'The token is redeemed once, creating a partner with their own session',
            'A task list of exactly what this person must supply, with forms and uploads',
            'One answer satisfies that requirement in every application they are party to',
            'Completing a task updates the primary case live',
          ]}
        />
      </main>
    </div>
  )
}
