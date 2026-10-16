import type { ReactNode } from 'react'
import {
  BellIcon,
  GlobeIcon,
  MonitorIcon,
  SmartphoneIcon,
  UsersIcon,
} from 'lucide-react'
import { CHANNEL_NAMES, type Channel } from '@/content/how-it-works/story'
import { Tile } from './parts'

const ICON: Readonly<Record<Channel, ReactNode>> = {
  web: <GlobeIcon />,
  app: <SmartphoneIcon />,
  partner: <UsersIcon />,
  console: <MonitorIcon />,
  lockscreen: <BellIcon />,
}

const TONE: Readonly<Record<Channel, 'primary' | 'deep' | 'success' | 'warning' | 'code'>> = {
  web: 'primary',
  app: 'primary',
  partner: 'success',
  console: 'code',
  lockscreen: 'warning',
}

/**
 * Where the story has moved to.
 *
 * A divider rather than a phone bezel. The §67 story crosses five surfaces and the point is
 * that the case does not notice, so the change of surface is said in one line and the
 * transcript column stays the same width throughout. Nothing here is load-bearing: with the
 * dividers removed the beats still read in order.
 */
export function ChannelMark({ channel }: { readonly channel: Channel }): ReactNode {
  return (
    <div className="my-6 flex items-center gap-3" role="separator" aria-label={CHANNEL_NAMES[channel]}>
      <span aria-hidden className="bg-border h-px flex-1" />
      <span className="flex items-center gap-2">
        <Tile tone={TONE[channel]} size="sm">
          {ICON[channel]}
        </Tile>
        <span className="text-muted-foreground text-[12.5px] font-medium">{CHANNEL_NAMES[channel]}</span>
      </span>
      <span aria-hidden className="bg-border h-px flex-1" />
    </div>
  )
}
