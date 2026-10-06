import { type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { queryKeys } from '@/lib/queryKeys'
import { adminApi } from '@/admin/adminClient'
import { HandoffNote } from '@/admin/HandoffNote'
import { CaseInspector } from '@/admin/CaseInspector'
import { DemoActions } from '@/admin/DemoActions'
import { useRealtimeInvalidation } from '@/lib/useRealtimeInvalidation'
import type { AdminCase } from '@contracts/admin.ts'

/**
 * One case, in four views rather than one long scroll.
 *
 * Tabs because the four audiences for this page are genuinely different: somebody about to make
 * a call wants the note, somebody checking what happened wants the transcript, somebody moving
 * the case on wants the controls, and somebody asking whether the model decided any of this
 * wants the reasoning. Stacked, the page was two and a half thousand pixels and everybody
 * scrolled past three quarters of it.
 */
export function CaseDetail(): ReactNode {
  const { caseId } = useParams<{ caseId: string }>()
  const queryClient = useQueryClient()

  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.admin.caseInspection(caseId ?? ''),
    })
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.cases() })
  }

  // The console should move as the customer talks, rather than needing a reload to find out
  // whether anything happened.
  useRealtimeInvalidation(
    ['messages', 'facts', 'applications', 'events', 'product_interests'],
    refresh,
  )

  const inspection = useQuery({
    queryKey: queryKeys.admin.caseInspection(caseId ?? ''),
    queryFn: () => adminApi.inspect(caseId ?? ''),
    enabled: caseId !== undefined,
  })

  if (caseId === undefined) {
    return (
      <Alert>
        <AlertDescription>No case selected.</AlertDescription>
      </Alert>
    )
  }

  if (inspection.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-9 w-full max-w-md" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (inspection.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{inspection.error.message}</AlertDescription>
      </Alert>
    )
  }

  const data = inspection.data
  const live = data.applications.filter(
    (application) => application.state !== 'completed' && application.state !== 'declined',
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{data.handoff.who}</h1>
          <p className="text-muted-foreground text-sm">
            {data.handoff.turns} {data.handoff.turns === 1 ? 'message' : 'messages'}
            {data.handoff.lastSeen !== null &&
              ` · last spoke ${data.handoff.lastSeen.slice(0, 10)}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {live.map((application) => (
            <Badge key={application.id} variant="secondary">
              {application.displayName} · {application.stateLabel}
            </Badge>
          ))}
          {data.plans
            .filter((plan) => plan.status === 'active')
            .map((plan) => (
              <Badge key={plan.id}>{plan.title}</Badge>
            ))}
        </div>
      </div>

      <Tabs defaultValue="handover" className="space-y-6">
        <TabsList>
          <TabsTrigger value="handover">Handover</TabsTrigger>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="act">Act as the bank</TabsTrigger>
          <TabsTrigger value="reasoning">How Baz worked it out</TabsTrigger>
        </TabsList>

        <TabsContent value="handover">
          <HandoffNote handoff={data.handoff} />
        </TabsContent>

        <TabsContent value="conversation">
          <Conversation conversation={data.conversation} />
        </TabsContent>

        <TabsContent value="act" className="space-y-6">
          <DemoActions caseId={caseId} moves={data.demoActions} onChanged={refresh} />
          <CaseInspector caseId={caseId} show="handling" />
        </TabsContent>

        <TabsContent value="reasoning">
          <CaseInspector caseId={caseId} show="reasoning" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/** What was actually said. A summary is a claim; the transcript is the evidence for it. */
function Conversation({
  conversation,
}: {
  readonly conversation: AdminCase['conversation']
}): ReactNode {
  if (conversation.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyTitle>Nothing said yet</EmptyTitle>
          <EmptyDescription>
            This case exists but the conversation has not started.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>The conversation</CardTitle>
        <CardDescription>{conversation.length} turns, oldest first.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-[32rem]">
          <div className="space-y-4 px-6">
            {conversation.map((message, index) => (
              <Turn key={`${String(index)}-${message.role}`} message={message} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

/**
 * One turn, sided like the chat it came from.
 *
 * Reading a transcript as a flat list of labelled paragraphs is much harder than it needs to
 * be; who said what should be apparent before the words are.
 */
function Turn({ message }: { readonly message: AdminCase['conversation'][number] }): ReactNode {
  const customer = message.role === 'customer'

  return (
    <div className={customer ? 'flex justify-end' : 'flex justify-start'}>
      <div className="max-w-[85%] space-y-1">
        <div
          className={
            customer
              ? 'flex items-center justify-end gap-2'
              : 'flex items-center justify-start gap-2'
          }
        >
          <span className="text-muted-foreground text-xs font-medium">
            {customer ? 'Customer' : message.role === 'baz' ? 'Baz' : 'System'}
          </span>
          {message.cards.map((card) => (
            <Badge key={card} variant="outline" className="text-2xs">
              {card.replaceAll('_', ' ')}
            </Badge>
          ))}
        </div>
        <div
          className={
            customer
              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5'
              : 'bg-muted rounded-2xl rounded-bl-md px-4 py-2.5'
          }
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  )
}
