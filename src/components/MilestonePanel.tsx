import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export type MilestonePanelProps = {
  milestone: string
  title: string
  description: string
  /** What this surface will do once the milestone lands. */
  scope: readonly string[]
  /** Requirements sections that govern it. */
  sections: readonly string[]
}

/**
 * Placeholder for a surface that is routed but not yet built. Each panel names the milestone
 * that fills it and the sections that govern it, so the deployed prototype reads as a plan
 * rather than as something half-finished.
 */
export function MilestonePanel({
  milestone,
  title,
  description,
  scope,
  sections,
}: MilestonePanelProps): ReactNode {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge variant="secondary" className="text-2xs">
            {milestone}
          </Badge>
          <span className="text-muted-foreground text-2xs tabular">{sections.join(' · ')}</span>
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="text-muted-foreground space-y-2 text-sm">
          {scope.map((item) => (
            <li key={item} className="relative pl-4 leading-snug">
              <span
                aria-hidden
                className="bg-border absolute top-[0.5em] left-0 size-1.5 rounded-full"
              />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
