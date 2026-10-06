import { useState, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FileCheckIcon, PiggyBankIcon, SendIcon, ZapIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { IconTile } from '@/components/IconTile'
import { adminApi } from '@/admin/adminClient'
import type { AdminCase } from '@contracts/admin.ts'

/**
 * Moving a case on by hand.
 *
 * Named for what happens to the customer rather than for the state transition, because that is
 * what somebody on a call is deciding. Each is disabled with a reason when the state machine
 * would refuse it, so nothing fails in front of anybody.
 */
export
function DemoActions({
  caseId,
  moves,
  onChanged,
}: {
  readonly caseId: string
  readonly moves: AdminCase['demoActions']
  readonly onChanged: () => void
}): ReactNode {
  const [notification, setNotification] = useState<string | null>(null)
  const data = { demoActions: moves }

  const run = useMutation({
    mutationFn: (move: Parameters<typeof adminApi.demoAction>[1]) =>
      adminApi.demoAction(caseId, move),
    onSuccess: onChanged,
  })

  const savings = useMutation({
    mutationFn: () => adminApi.reachSavingsTarget(caseId),
    onSuccess: onChanged,
  })

  const verify = useMutation({
    mutationFn: () => adminApi.verifyDocuments(caseId),
    onSuccess: onChanged,
  })

  const notify = useMutation({
    mutationFn: () => adminApi.notify(caseId),
    onSuccess: (result) => {
      setNotification(result.url)
      onChanged()
    },
  })


  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">Act as the bank</h2>
        <Badge variant="secondary" className="text-2xs">
          Applies to the case on screen
        </Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {data.demoActions.map((move) => (
          <button
            key={move.id}
            type="button"
            disabled={!move.available || run.isPending}
            title={move.note}
            onClick={() => run.mutate(move.id as Parameters<typeof adminApi.demoAction>[1])}
            className="bg-card hover:bg-muted/60 focus-visible:ring-ring flex items-start gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            <IconTile tone={move.available ? 'primary' : 'neutral'} size="sm">
              <ZapIcon />
            </IconTile>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{move.label}</span>
              <span className="text-muted-foreground block text-2xs">{move.note}</span>
            </span>
          </button>
        ))}

        <button
          type="button"
          disabled={savings.isPending}
          onClick={() => savings.mutate()}
          className="bg-card hover:bg-muted/60 flex items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-50 sm:col-span-2"
        >
          <IconTile tone="primary" size="sm">
            <PiggyBankIcon />
          </IconTile>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Their savings reach the target</span>
            <span className="text-muted-foreground block text-2xs">
              {savings.data?.reached === true
                ? `Reached €${savings.data.target?.toLocaleString('en-IE') ?? ''}. They have something to come back for.`
                : 'Months pass and the money is there — the thing the bank said it would watch for. §41'}
            </span>
          </span>
        </button>

        <button
          type="button"
          disabled={verify.isPending}
          onClick={() => verify.mutate()}
          className="bg-card hover:bg-muted/60 flex items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-50 sm:col-span-2"
        >
          <IconTile tone="primary" size="sm">
            <FileCheckIcon />
          </IconTile>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">The bank checks the documents</span>
            <span className="text-muted-foreground block text-2xs">
              {verify.data
                ? `${String(verify.data.verified)} marked as checked.`
                : 'Marks what has been sent in as verified, so anything waiting on a check can pass. §41'}
            </span>
          </span>
        </button>

        <button
          type="button"
          disabled={notify.isPending}
          onClick={() => notify.mutate()}
          className="bg-card hover:bg-muted/60 flex items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-50 sm:col-span-2"
        >
          <IconTile tone="deep" size="sm">
            <SendIcon />
          </IconTile>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Send the update notification</span>
            <span className="text-muted-foreground block text-2xs">
              {notification ?? 'Says nothing about the application; the link needs a sign-in. §35'}
            </span>
          </span>
        </button>
      </div>
    </section>
  )
}
