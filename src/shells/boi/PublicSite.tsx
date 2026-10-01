import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MilestonePanel } from '@/components/MilestonePanel'
import { SetupNotice } from '@/components/SetupNotice'
import { BoiHeader } from '@/shells/boi/BoiHeader'
import { PrototypeBanner } from '@/components/PrototypeBanner'
import { routes } from '@/app/routes'

/** §6 Stage 1 — public website. Anonymous entry point into the Baz conversation. */
export function PublicSite(): ReactNode {
  return (
    <div className="boi-theme bg-background min-h-dvh">
      <PrototypeBanner />
      <BoiHeader />

      <main className="mx-auto w-full max-w-md space-y-6 px-4 py-8">
        <SetupNotice />

        <section className="space-y-3">
          <h1 className="text-2xl font-semibold leading-tight">
            Tell us what you&rsquo;re trying to do.
            <br />
            We&rsquo;ll help you get it done.
          </h1>
          <p className="text-muted-foreground text-sm">
            Baz is our AI banking assistant. Start a conversation and we&rsquo;ll work out what
            you need &mdash; no need to know which product to look for.
          </p>
          <Button size="lg" className="w-full" disabled>
            <MessageCircleIcon />
            Chat to Baz
          </Button>
          <p className="text-muted-foreground text-xs">
            The conversation arrives in M2. This surface is routed and deploying now.
          </p>
        </section>

        <MilestonePanel
          milestone="M2 · M4"
          title="Public conversation and handoff"
          description="Anonymous Baz conversation that survives the move into the authenticated app."
          sections={['§6 Stage 1', '§31', '§29']}
          scope={[
            'Anonymous Supabase session created on arrival, mapped to a participant',
            'Baz opening turn: discloses it is AI, invites the objective',
            'Gate in front of the model enforces the banking domain',
            'Handoff code issued so the case continues in the app without restarting',
          ]}
        />

        <nav className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-xs">
          <Link className="underline underline-offset-2" to={routes.app.login}>
            Mobile app
          </Link>
          <Link className="underline underline-offset-2" to={routes.audience}>
            Audience demo
          </Link>
          <Link className="underline underline-offset-2" to={routes.admin.root}>
            Presenter console
          </Link>
        </nav>
      </main>
    </div>
  )
}
