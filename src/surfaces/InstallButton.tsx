import { useEffect, useState, type ReactNode } from 'react'
import { DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/**
 * Installing the app.
 *
 * Chrome and Edge fire `beforeinstallprompt` and will show a real install dialog, so when that
 * is on offer the button does exactly that. Safari never fires it and iOS has no API at all, so
 * everywhere else the button explains the two taps instead of pretending to be broken.
 */
type InstallPrompt = Event & { prompt: () => Promise<void> }

export function InstallButton(): ReactNode {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)

  useEffect(() => {
    const capture = (event: Event) => {
      // Keeping the event is the whole trick: it can only be used later if the default is
      // prevented now, and browsers fire it once, early.
      event.preventDefault()
      setPrompt(event as InstallPrompt)
    }

    window.addEventListener('beforeinstallprompt', capture)
    return () => window.removeEventListener('beforeinstallprompt', capture)
  }, [])

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
            Two taps, and it opens like any other app — no app store involved.
          </DialogDescription>
        </DialogHeader>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>
            <span className="font-medium">iPhone:</span> tap Share, then{' '}
            <span className="font-medium">Add to Home Screen</span>.
          </li>
          <li>
            <span className="font-medium">Android:</span> tap the menu, then{' '}
            <span className="font-medium">Install app</span>.
          </li>
          <li>
            <span className="font-medium">Desktop:</span> look for the install icon in the address
            bar.
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  )
}
