import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCardIcon, HomeIcon, PiggyBankIcon, ShieldCheckIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { IconTile } from '@/components/IconTile'
import { ListRow } from '@/components/ListRow'
import { SetupNotice } from '@/components/SetupNotice'
import { PrototypeBanner } from '@/components/PrototypeBanner'
import { SiteHeader } from '@/shells/boi/SiteHeader'
import { Composer } from '@/baz/Composer'
import { BazAvatar } from '@/baz/BazAvatar'
import { SuggestionList } from '@/baz/SuggestionList'
import { OPENING_SUGGESTIONS } from '@/baz/suggestions'
import { Button } from '@/components/ui/button'
import { MessageCircleIcon } from 'lucide-react'
import { routes } from '@/app/routes'

const products = [
  {
    id: 'everyday',
    title: 'Everyday banking',
    description: 'Accounts, cards and digital banking.',
    icon: <CreditCardIcon />,
  },
  { id: 'mortgages', title: 'Mortgages', description: 'Find, apply and manage your mortgage.', icon: <HomeIcon /> },
  { id: 'loans', title: 'Loans', description: 'For home, car or whatever’s next.', icon: <PiggyBankIcon /> },
  { id: 'insurance', title: 'Insurance', description: 'Protect what matters most.', icon: <ShieldCheckIcon /> },
] as const

/**
 * §6 Stage 1, §31 — the public website.
 *
 * The entry point into Baz is the input in the hero, not a chat bubble in the corner: the
 * proposition is "tell us what you're trying to do", so that is the first thing on the page.
 */
export function PublicSite(): ReactNode {
  const navigate = useNavigate()

  return (
    <div className="bg-background min-h-dvh">
      <PrototypeBanner />

      <div className="relative">
        {/*
          Stands in for the photograph in the design. A real image would be dropped in here
          as a background layer; the gradient keeps the contrast ratio predictable either way.
        */}
        <div
          aria-hidden
          className="from-brand-deep to-primary/90 absolute inset-0 bg-gradient-to-br via-[oklch(0.33_0.11_252)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_80%_at_80%_10%,oklch(1_0_0/0.16),transparent)]"
        />

        <div className="text-brand-deep-foreground relative">
          <SiteHeader />

          <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 lg:px-8 lg:pt-14 lg:pb-36">
            <div className="max-w-xl space-y-5">
              <h1 className="text-3xl leading-[1.1] font-semibold tracking-tight text-balance lg:text-5xl">
                For whatever life brings next
              </h1>
              <p className="text-sm opacity-90 lg:text-base">
                Accounts, mortgages, loans, insurance and more. Real support for real life.
              </p>

              <Composer
                placeholder="Tell Baz what you’re trying to do…"
                className="border-transparent bg-white/95 text-foreground shadow-lg"
                onSend={(message) => {
                  void navigate(`${routes.baz}?say=${encodeURIComponent(message)}`)
                }}
              />

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                >
                  <Link to={routes.baz}>
                    <MessageCircleIcon />
                    Chat to Baz
                  </Link>
                </Button>
                <span className="text-2xs opacity-80">Or pick one of the starters below.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 pb-20 lg:px-8">
        {/* Product cards overlap the hero, as in the design. */}
        {/* `relative` is load-bearing: the hero gradient is absolutely positioned, so it
            paints above later static content regardless of DOM order. */}
        <div className="relative z-10 -mt-16 grid gap-3 sm:grid-cols-2 lg:-mt-20 lg:grid-cols-4">
          {products.map((product) => (
            <Card key={product.id} className="gap-0 p-0 shadow-sm">
              <ListRow
                className="h-full flex-col items-start gap-3 p-5"
                leading={
                  <IconTile size="lg">
                    {product.icon}
                  </IconTile>
                }
                title={<span className="text-base">{product.title}</span>}
                subtitle={product.description}
              />
            </Card>
          ))}
        </div>

        <section className="mt-12 max-w-xl space-y-4">
          <Card className="gap-0 overflow-hidden p-0">
            <div className="flex items-start gap-3 p-4">
              <BazAvatar />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold">Baz</p>
                <p className="text-muted-foreground text-sm">
                  Tell me what you&rsquo;re trying to do. You don&rsquo;t need to know which
                  product it is — that&rsquo;s my job.
                </p>
              </div>
            </div>

            <div className="border-t p-4">
              <SuggestionList
                suggestions={OPENING_SUGGESTIONS}
                onSelect={(suggestion) => {
                  void navigate(`${routes.baz}?say=${encodeURIComponent(suggestion.label)}`)
                }}
              />
            </div>
          </Card>
        </section>

        <div className="mt-10 max-w-xl space-y-4">
          <SetupNotice />

          <ListRow
            className="border-input rounded-xl border"
            leading={<IconTile tone="deep"><ShieldCheckIcon /></IconTile>}
            title="Presenter console"
            subtitle="Persona, domain controls, case inspection and audience activity"
            to={routes.admin.root}
          />
          <ListRow
            className="border-input rounded-xl border"
            leading={<IconTile tone="neutral"><CreditCardIcon /></IconTile>}
            title="Audience demo"
            subtitle="Start your own isolated conversation"
            to={routes.audience}
          />
        </div>
      </main>
    </div>
  )
}
