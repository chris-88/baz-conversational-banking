import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BazAvatar } from '@/baz/BazAvatar'
import { routes } from '@/app/routes'
import { Pipeline } from './how-it-works/Pipeline'
import { Story } from './how-it-works/Story'
import { Cost } from './how-it-works/Cost'

/**
 * The explainer: how the AI is built, how it got that way, and what it costs to run.
 *
 * Reachable by its own address rather than from the conversation, because it is written for
 * someone evaluating the work rather than someone using it. The three sections are separate
 * addresses so one of them can be sent to somebody on its own.
 */

const SECTIONS = ['pipeline', 'story', 'cost'] as const
type SectionId = (typeof SECTIONS)[number]

function isSection(value: string | undefined): value is SectionId {
  return SECTIONS.some((section) => section === value)
}

export function HowItWorks(): ReactNode {
  const { section } = useParams()
  const navigate = useNavigate()
  const active: SectionId = isSection(section) ? section : 'pipeline'

  return (
    <div className="bg-background min-h-dvh">
      <header className="border-border/60 border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-6 py-5">
          <Link to={routes.landing} className="flex items-center gap-3">
            <BazAvatar />
            <span className="text-lg font-bold tracking-tight">Baz</span>
          </Link>
          <span className="bg-border hidden h-5 w-px sm:block" />
          <span className="text-muted-foreground hidden text-sm sm:block">How it works</span>
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link to={routes.baz}>
              <ArrowLeftIcon />
              Back to Baz
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="pt-10 sm:pt-14">
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            How Baz works
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-base text-pretty sm:text-lg">
            What the AI is actually doing, what stops it doing the wrong thing, how it changed while
            it was being built, and what it costs to run.
          </p>
        </div>

        <Tabs
          value={active}
          onValueChange={(next) => {
            void navigate(next === 'pipeline' ? routes.howItWorks : `${routes.howItWorks}/${next}`)
          }}
          className="mt-8"
        >
          <TabsList>
            <TabsTrigger value="pipeline">How it works</TabsTrigger>
            <TabsTrigger value="story">The story</TabsTrigger>
            <TabsTrigger value="cost">What it costs</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline">
            <Pipeline />
          </TabsContent>
          <TabsContent value="story">
            <Story />
          </TabsContent>
          <TabsContent value="cost">
            <Cost />
          </TabsContent>
        </Tabs>

        <footer className="text-muted-foreground border-border mt-4 border-t pt-8 text-sm">
          <p className="max-w-[62ch]">
            <strong className="text-foreground font-semibold">A note on the data.</strong> Product
            information is Bank of Ireland&rsquo;s real published catalogue. Customer records,
            balances and the login are synthetic — the sign-in accepts anything and says so. No real
            credentials and no real customer data exist anywhere in the system.
          </p>
        </footer>
      </main>
    </div>
  )
}
