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
import heroCoast from '@/assets/illustrations/hero-coast-family.svg'

/**
 * Each card opens the conversation with what a person browsing it probably wants, rather than
 * a product page that does not exist. The opener is written as the customer would say it.
 */
const products = [
  {
    id: 'everyday',
    title: 'Everyday banking',
    description: 'Accounts, cards and digital banking.',
    opener: 'I want to sort out my day-to-day banking',
    icon: <CreditCardIcon />,
    tone: 'primary' as const,
  },
  {
    id: 'mortgages',
    title: 'Mortgages',
    description: 'Find, apply and manage your mortgage.',
    opener: 'I want to buy a home',
    icon: <HomeIcon />,
    tone: 'mortgage' as const,
  },
  {
    id: 'loans',
    title: 'Loans',
    description: 'For home, car or whatever’s next.',
    opener: 'I am thinking about borrowing some money',
    icon: <PiggyBankIcon />,
    tone: 'loan' as const,
  },
  {
    id: 'insurance',
    title: 'Insurance',
    description: 'Protect what matters most.',
    opener: 'I want to protect my family',
    icon: <ShieldCheckIcon />,
    tone: 'protection' as const,
  },
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
          The hero artwork from the asset pack, with the brand gradient over it. The overlay is
          what makes the white text legible, so it stays opaque at the top where the heading
          sits and thins towards the bottom where the coastline comes through.
        */}
        <img src={heroCoast} alt="" aria-hidden className="absolute inset-0 size-full object-cover" />
        <div
          aria-hidden
          className="from-brand-deep via-brand-deep/90 to-brand-deep/60 absolute inset-0 bg-gradient-to-b"
        />
        <div
          aria-hidden
          className="from-brand-deep/70 absolute inset-0 bg-gradient-to-r to-transparent"
        />

        <div className="text-brand-deep-foreground relative">
          <SiteHeader />

          <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 lg:px-8 lg:pt-14 lg:pb-36">
            <div className="max-w-xl space-y-5">
              <h1 className="text-h1 lg:text-display font-bold text-balance">
                For whatever life brings next
              </h1>
              <p className="text-sm opacity-90 lg:text-body-lg">
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
        <div className="relative z-10 -mt-16 grid grid-cols-2 gap-3 lg:-mt-20 lg:grid-cols-4">
          {products.map((product) => (
            <Card key={product.id} className="gap-0 p-0 shadow-sm">
              <ListRow
                wrap
                className="h-full flex-col items-start gap-3 p-4 lg:p-5"
                to={`${routes.baz}?say=${encodeURIComponent(product.opener)}`}
                leading={<IconTile size="lg" tone={product.tone}>{product.icon}</IconTile>}
                title={<span className="text-sm lg:text-base">{product.title}</span>}
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
                <p className="text-sm font-semibold">Need a hand?</p>
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

        <div className="mt-10 max-w-xl">
          <SetupNotice />
        </div>
      </main>
    </div>
  )
}
