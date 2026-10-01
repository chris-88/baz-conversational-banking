import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { routes } from '@/app/routes'

export function NotFound(): ReactNode {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground text-sm">That page does not exist.</p>
      </div>
      <Button asChild>
        <Link to={routes.public}>Back to the start</Link>
      </Button>
    </div>
  )
}
