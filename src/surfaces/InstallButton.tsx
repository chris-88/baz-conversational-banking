import type { ReactNode } from 'react'
import { ArrowRightIcon, DownloadIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { routes } from '@/app/routes'
import { platform, useInstallPrompt, useInstalled } from '@/lib/installed'

/**
 * Installing the app, from the landing page.
 *
 * Chrome and Edge fire `beforeinstallprompt` and will show a real install dialog, so when that
 * is on offer the button does exactly that. Safari never fires it and iOS has no API at all,
 * so there the button explains the two taps, and only the two taps for the device in hand:
 * a list of three platforms is an instruction for one person and noise for the other two.
 *
 * And once Baz is installed it says so. There was no `standalone` check anywhere, so the
 * installed app advertised installing itself.
 */
export function InstallButton(): ReactNode {
  const installed = useInstalled()
  const prompt = useInstallPrompt()
  const where = platform()

  if (installed) {
    return (
      <Button asChild size="lg">
        <Link to={routes.baz} viewTransition>
          Open Baz
          <ArrowRightIcon />
        </Link>
      </Button>
    )
  }

  if (prompt !== null) {
    return (
      <Button size="lg" onClick={() => void prompt.prompt()}>
        <DownloadIcon />
        Install Baz
      </Button>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg">
          <DownloadIcon />
          Install Baz
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Baz to your home screen</DialogTitle>
          <DialogDescription>
            Two taps, and it opens like any other app. No app store involved.
          </DialogDescription>
        </DialogHeader>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          {where === 'ios' ? (
            <>
              <li>
                Tap <span className="font-medium">Share</span> at the bottom of Safari.
              </li>
              <li>
                Then <span className="font-medium">Add to Home Screen</span>.
              </li>
            </>
          ) : where === 'android' ? (
            <>
              <li>Tap the browser menu.</li>
              <li>
                Then <span className="font-medium">Install app</span> or{' '}
                <span className="font-medium">Add to Home screen</span>.
              </li>
            </>
          ) : (
            <li>Look for the install icon at the right of the address bar.</li>
          )}
        </ol>
      </DialogContent>
    </Dialog>
  )
}
