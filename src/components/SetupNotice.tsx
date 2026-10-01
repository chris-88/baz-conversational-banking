import type { ReactNode } from 'react'
import { InfoIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { isBackendConfigured, missingEnvVars } from '@/lib/env'

/**
 * Shown while the Supabase project is not yet connected. Informational rather than alarming:
 * this is an expected state during the build, and the site is public.
 */
export function SetupNotice(): ReactNode {
  if (isBackendConfigured) return null

  return (
    <Alert className="text-left">
      <InfoIcon />
      <AlertTitle>Not connected to a backend yet</AlertTitle>
      <AlertDescription>
        <p>
          The conversation, applications and saved context need a Supabase project. Until one is
          connected, these screens show what each surface will do rather than live data.
        </p>
        {missingEnvVars.length > 0 && (
          <p className="text-muted-foreground text-xs">
            Waiting on: {missingEnvVars.join(', ')}
          </p>
        )}
      </AlertDescription>
    </Alert>
  )
}
