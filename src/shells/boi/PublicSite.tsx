import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppHeader } from '@/components/AppHeader'
import { MilestonePanel } from '@/components/MilestonePanel'
import { SetupNotice } from '@/components/SetupNotice'
import { PrototypeBanner } from '@/components/PrototypeBanner'
import { routes } from '@/app/routes'

const elsewhere = [
  { to: routes.app.login, label: 'Mobile app' },
  { to: routes.audience, label: 'Audience demo' },
  { to: routes.admin.root, label: 'Presenter console' },
] as const

/** §6 Stage 1 — public website. Anonymous entry point into the Baz conversation. */
export function PublicSite(): ReactNode {
  return (
    <div className="bg-background min-h-dvh">
      <PrototypeBanner />
      <AppHeader />

      <main className="mx-auto w-full max-w-md space-y-8 px-4 py-8 pb-20">
        <SetupNotice />

        <section className="space-y-4">
          <Badge variant="secondary" className="text-2xs">
            Conversational banking
          </Badge>

          <h1 className="text-2xl leading-tight font-semibold tracking-tight text-balance">
            Tell us what you&rsquo;re trying to do. We&rsquo;ll help you get it done.
          </h1>

          <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
            Baz is an AI banking assistant. Start a conversation and it works out what you need
            &mdash; no need to know which product to look for.
          </p>

          <div className="space-y-2 pt-1">
            <Button size="lg" className="w-full" disabled>
              Chat to Baz
              <ArrowRightIcon />
            </Button>
            <p className="text-muted-foreground text-2xs">
              The conversation arrives in M2. This surface is routed and deployed.
            </p>
          </div>
        </section>

        <MilestonePanel
          milestone="M2 · M4"
          title="Public conversation and handoff"
          description="An anonymous conversation that survives the move into the authenticated app."
          sections={['§6 Stage 1', '§31', '§29']}
          scope={[
            'Anonymous session created on arrival, mapped to a participant',
            'Baz opens by disclosing it is AI, then asks what you are trying to do',
            'A gate in front of the model enforces the banking domain',
            'A handoff code carries the case into the app without restarting',
          ]}
        />

        <nav aria-label="Other surfaces" className="flex flex-wrap gap-1 border-t pt-4">
          {elsewhere.map((item) => (
            <Button key={item.to} asChild variant="link" size="sm" className="text-2xs h-auto px-2">
              <Link to={item.to}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </main>
    </div>
  )
}
