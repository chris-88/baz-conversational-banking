import type { ReactNode } from 'react'
import { PlugZapIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { isBackendConfigured, missingEnvVars } from '@/lib/env'

/**
 * Shown while the Supabase project is not connected. Informational rather than alarming:
 * this is an expected state during the build, and the site is public.
 */
export function SetupNotice(): ReactNode {
  if (isBackendConfigured) return null

  return (
    <Alert>
      <PlugZapIcon />
      <AlertTitle>Not connected to a backend yet</AlertTitle>
      <AlertDescription>
        <p>
          The conversation, applications and saved context need a Supabase project. Until one is
          connected, these screens describe what each surface will do rather than showing live
          data.
        </p>
        {missingEnvVars.length > 0 && (
          <p className="text-2xs tabular">Waiting on: {missingEnvVars.join(', ')}</p>
        )}
      </AlertDescription>
    </Alert>
  )
}
