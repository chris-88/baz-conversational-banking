import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, BellRing, Check, Menu, MessageSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { queryKeys } from '@/lib/queryKeys'
import { listCases, startNewCase, switchCase } from '@/lib/session'
import { pushPermission, subscribeToPush } from '@/lib/push'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

/**
 * The menu behind the hamburger: what has been sent, which conversation you are in, and a way
 * to start another.
 *
 * Built for running a demonstration from the screen the audience is looking at. Between takes
 * you need a clean conversation, and part-way through one you need to jump back to a prepared
 * case — doing either from a console on a second tab means the filmed screen shows somebody
 * alt-tabbing.
 *
 * A visitor sees their own conversations and nothing else. The wider list belongs to whoever
 * holds the presenter key, because these conversations contain what real people typed, which
 * is the same reason the data notice exists at all.
 */

type Notification = {
  readonly id: string
  readonly title: string
  readonly body: string
  readonly at: string
}

/** Relative where it reads naturally, absolute once it stops being useful. */
function when(iso: string | null): string {
  if (!iso) return ''
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${String(minutes)} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${String(hours)} hr ago`
  return new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}

function useNotifications(caseId: string | null) {
  return useQuery({
    queryKey: queryKeys.case.events(caseId ?? 'none'),
    enabled: caseId !== null && supabase !== null,
    queryFn: async (): Promise<readonly Notification[]> => {
      if (!supabase || !caseId) return []
      const rows = await supabase
        .from('events')
        .select('id, payload, created_at')
        .eq('case_id', caseId)
        .eq('type', 'notification_sent')
        .order('created_at', { ascending: false })
        .limit(20)

      return (rows.data ?? []).map((row): Notification => {
        const payload = (row.payload ?? {}) as Record<string, unknown>
        return {
          id: String(row.id),
          title: typeof payload['title'] === 'string' ? payload['title'] : 'Baz',
          // Older notifications predate the copy being recorded, so they say what is known.
          body:
            typeof payload['body'] === 'string'
              ? payload['body']
              : 'An update about something you are working on.',
          at: String(row.created_at),
        }
      })
    },
  })
}

export function ConversationMenu({
  caseId,
  className,
}: {
  /** Passed down rather than fetched: see `onCase` on BazChat for why that matters. */
  caseId: string | null
  className?: string
}): ReactNode {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const notifications = useNotifications(caseId)
  const cases = useQuery({
    queryKey: queryKeys.session.cases(),
    enabled: open,
    queryFn: () => listCases(),
  })

  const [permission, setPermission] = useState(() => pushPermission())

  /**
   * Switching and starting both reload the page.
   *
   * `session start` returns the conversation this browser was last in, so a reload lands on the
   * new one by itself. Threading a changed case id back through the transcript, the history
   * load, the card state and the realtime subscriptions is a great deal of machinery to get
   * subtly wrong, and getting it subtly wrong in front of a room is worse than a flash of
   * white between takes.
   */
  const land = () => window.location.reload()

  const goTo = useMutation({
    mutationFn: (id: string) => switchCase(id),
    onSuccess: land,
  })

  const begin = useMutation({
    mutationFn: () => startNewCase('new'),
    onSuccess: land,
  })

  const enablePush = useMutation({
    mutationFn: async () => {
      if (!caseId) return
      const result = await subscribeToPush(caseId)
      setPermission(pushPermission())
      return result
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.case.events(caseId ?? 'none') })
    },
  })

  const busy = goTo.isPending || begin.isPending

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Menu"
          className={cn('text-muted-foreground', className)}
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex w-[19rem] flex-col gap-0 p-0 sm:w-[21rem]">
        <SheetHeader className="p-4 pb-3">
          <SheetTitle className="text-base">Your conversations</SheetTitle>
          <SheetDescription className="text-xs">
            {cases.data?.presenter === true
              ? 'Presenter mode — every conversation on this system.'
              : 'Everything you have started with Baz.'}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <section className="p-4">
            <h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
              <Bell className="size-3.5" />
              Notifications
            </h3>

            {notifications.data && notifications.data.length > 0 ? (
              <ul className="space-y-2">
                {notifications.data.map((item) => (
                  <li key={item.id} className="bg-muted/50 rounded-md px-3 py-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                      {item.body}
                    </p>
                    <p className="text-muted-foreground/70 mt-1 text-[11px]">{when(item.at)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-xs leading-relaxed">
                Nothing yet. Baz will tell you here when something moves.
              </p>
            )}

            {permission !== 'granted' && permission !== 'unsupported' && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                disabled={enablePush.isPending || caseId === null}
                onClick={() => enablePush.mutate()}
              >
                <BellRing className="size-4" />
                {permission === 'denied' ? 'Notifications are blocked' : 'Tell me when things move'}
              </Button>
            )}
          </section>

          <Separator />

          <section className="p-4">
            <h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
              <MessageSquare className="size-3.5" />
              Conversations
            </h3>

            {cases.isPending && (
              <p className="text-muted-foreground text-xs">Looking them up…</p>
            )}

            <ul className="space-y-1">
              {(cases.data?.cases ?? []).map((item) => (
                <li key={item.caseId}>
                  <button
                    type="button"
                    disabled={busy || item.current}
                    onClick={() => goTo.mutate(item.caseId)}
                    className={cn(
                      'hover:bg-accent focus-visible:ring-ring w-full rounded-md px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default',
                      item.current && 'bg-accent',
                    )}
                  >
                    <span className="flex items-start gap-2">
                      {item.current ? (
                        <Check className="text-primary mt-0.5 size-4 shrink-0" />
                      ) : (
                        <span className="mt-0.5 size-4 shrink-0" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {item.label ?? item.opening ?? 'Nothing said yet'}
                        </span>
                        <span className="text-muted-foreground block text-[11px]">
                          {item.messages === 0
                            ? 'empty'
                            : `${String(item.messages)} message${item.messages === 1 ? '' : 's'}`}
                          {item.applications > 0 &&
                            ` · ${String(item.applications)} application${item.applications === 1 ? '' : 's'}`}
                          {item.lastActivityAt !== null && ` · ${when(item.lastActivityAt)}`}
                          {cases.data?.presenter === true && !item.mine && ' · not yours'}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {goTo.isError && (
              <p className="text-destructive mt-2 text-xs">
                That conversation would not open. {goTo.error.message}
              </p>
            )}
          </section>
        </div>

        <Separator />

        <div className="p-4">
          <Button className="w-full" disabled={busy} onClick={() => begin.mutate()}>
            <Plus className="size-4" />
            Start a new conversation
          </Button>
          {begin.isError && (
            <p className="text-destructive mt-2 text-xs">{begin.error.message}</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
