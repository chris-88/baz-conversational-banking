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
 * Placeholder for a surface that is routed but not yet built. M0 is "routes for all
 * five surfaces"; each panel names the milestone that fills it.
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
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{milestone}</Badge>
          <span className="text-muted-foreground text-xs">{sections.join(' · ')}</span>
        </div>
        <CardTitle className="mt-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="text-muted-foreground space-y-1.5 text-sm">
          {scope.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-foreground/30">
                —
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
