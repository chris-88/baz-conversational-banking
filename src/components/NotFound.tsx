import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { routes } from '@/app/routes'

export function NotFound(): ReactNode {
  return (
    <div className="boi-theme flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground text-sm">That page does not exist.</p>
      <Button asChild>
        <Link to={routes.public}>Back to Bank of Ireland</Link>
      </Button>
    </div>
  )
}
