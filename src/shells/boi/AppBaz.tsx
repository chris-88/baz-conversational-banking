import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BazAvatar } from '@/baz/BazAvatar'
import { BazChat } from '@/baz/BazChat'
import { OPENING_SUGGESTIONS } from '@/baz/suggestions'

/** The same conversation, inside the authenticated app shell. */
export function AppBaz(): ReactNode {
  const [searchParams] = useSearchParams()

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-20">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 backdrop-blur">
        <BazAvatar />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Baz</p>
          <p className="text-muted-foreground text-2xs">AI assistant</p>
        </div>
      </header>

      <BazChat
        className="flex min-h-0 flex-1 flex-col"
        suggestions={OPENING_SUGGESTIONS}
        openingMessage={searchParams.get('say')}
        greeting={
          <div className="space-y-2">
            <p className="font-medium">Hi, I&rsquo;m Baz 👋</p>
            <p>I&rsquo;m an AI assistant. I can help with your banking and get things done.</p>
            <p>What are you looking to do today?</p>
          </div>
        }
      />
    </div>
  )
}
