import type { ReactNode } from 'react'
import { TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { envProblems, isBackendConfigured } from '@/lib/env'

/** Shown while the Supabase project is not yet wired up. Removed once M0 is finished. */
export function SetupNotice(): ReactNode {
  if (isBackendConfigured) return null

  return (
    <Alert variant="destructive" className="text-left">
      <TriangleAlertIcon />
      <AlertTitle>Backend not configured</AlertTitle>
      <AlertDescription>
        <p>Create a Supabase project and set the values below in a local `.env` file.</p>
        <ul className="list-disc pl-4">
          {envProblems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
