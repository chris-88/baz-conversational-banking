import type { ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ShieldAlertIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { adminApi } from '@/admin/adminClient'
import { boiDomainConfig } from '@tenants/boi/domain-config.ts'
import { refusalFor } from '@llm/refusals.ts'
import type { AdminOverview } from '@contracts/admin.ts'

/**
 * What Baz will and will not do, and what happens when somebody tries.
 *
 * Everything here is data the gate reads, shown as the gate reads it — the categories, what is
 * in and out of scope, and the exact words a blocked request gets back. §25 is explicit that
 * domain restriction is enforcement in front of the model rather than an instruction inside it,
 * and the point of this screen is that the distinction is visible.
 */
export function GuardrailsScreen({
  blocked,
  killSwitch,
  onChanged,
}: {
  readonly blocked: AdminOverview['blocked']
  readonly killSwitch: boolean
  readonly onChanged: () => void
}): ReactNode {
  const kill = useMutation({ mutationFn: adminApi.setKillSwitch, onSuccess: onChanged })

  return (
    <div className="space-y-6">
      <Alert>
        <ShieldAlertIcon />
        <AlertDescription>
          A classifier plus deterministic checks run in front of the model. A blocked request
          never reaches Baz at all, and the refusal never contains the answer. §25, §26
        </AlertDescription>
      </Alert>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">What gets through</h2>
        <Card className="gap-0 divide-y p-0">
          {boiDomainConfig.categories.map((category) => (
            <div key={category.id} className="space-y-1.5 p-4">
              <div className="flex items-start gap-3">
                <Badge
                  variant={category.reachesModel ? 'default' : 'secondary'}
                  className="text-2xs mt-0.5 shrink-0"
                >
                  {category.reachesModel ? 'reaches Baz' : 'blocked'}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{category.label}</p>
                  <p className="text-muted-foreground text-xs">{category.description}</p>
                </div>
              </div>

              {category.examples.length > 0 && (
                <p className="text-muted-foreground pl-[5.5rem] text-2xs">
                  e.g. {category.examples.map((example) => `"${example}"`).join(', ')}
                </p>
              )}

              {/* The actual words somebody gets back, so nobody has to guess at the tone. */}
              {!category.reachesModel && (
                <p className="text-foreground/75 pl-[5.5rem] text-2xs italic">
                  Replies: “{refusalFor(category.id, 'neutral')}”
                </p>
              )}
            </div>
          ))}
        </Card>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Scope title="In scope" items={boiDomainConfig.inScope} />
        <Scope title="Out of scope" items={boiDomainConfig.outOfScope} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Recently blocked</h2>
        <Card className="gap-0 divide-y p-0">
          {blocked.length === 0 && (
            <p className="text-muted-foreground p-4 text-sm">Nothing blocked yet.</p>
          )}
          {blocked.map((item, index) => (
            <div key={`${item.at}-${String(index)}`} className="flex items-center gap-3 p-4">
              <Badge variant="secondary" className="text-2xs">
                {item.category}
              </Badge>
              <span className="text-muted-foreground tabular text-xs">
                {new Date(item.at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Controls</h2>
        <Card className="flex-row items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Pause Baz</p>
            <p className="text-muted-foreground text-xs">
              Every request is turned away at the gate, without calling a model. §43
            </p>
          </div>
          <Switch
            checked={killSwitch}
            onCheckedChange={(enabled) => kill.mutate(enabled)}
            aria-label="Pause Baz"
          />
        </Card>
        <p className="text-muted-foreground text-2xs">
          The scope and categories above are tenant configuration, read by the gate on every
          turn. Changing them is a config edit, not a prompt change. §20, §32
        </p>
      </section>
    </div>
  )
}

function Scope({ title, items }: { readonly title: string; readonly items: readonly string[] }): ReactNode {
  return (
    <Card className="gap-0 p-0">
      <p className="border-b px-4 py-2.5 text-xs font-semibold">{title}</p>
      <ul className="space-y-1 p-4">
        {items.map((item) => (
          <li key={item} className="text-muted-foreground text-xs">
            {item}
          </li>
        ))}
      </ul>
    </Card>
  )
}
