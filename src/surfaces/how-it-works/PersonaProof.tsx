import { useState, type ReactNode } from 'react'
import { SparklesIcon } from 'lucide-react'
import {
  PRESETS,
  PRESET_NAMES,
  SLIDER_NAMES,
  applySensitivity,
  composePersona,
  toneBucket,
  type PresetName,
} from '@llm/persona.ts'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Claim, Decider, Surface, Tile } from './parts'

/** The §56 example, shown as the spec wrote it and labelled as such. */
const SPEC_EXAMPLE = {
  default: 'Your mortgage is currently being assessed. Nothing is required from you today.',
  poetic:
    'Your mortgage is currently making its way through assessment. For now, the paperwork gods require nothing further from you.',
} as const

const PRESET_LABEL: Readonly<Record<PresetName, string>> = {
  default: 'Default',
  concise: 'Concise',
  friendly: 'Friendly',
  formal: 'Formal',
  dry_humour: 'Dry humour',
  poetic: 'Poetic',
}

const ZEROED = ['humour', 'sarcasm', 'playfulness', 'poetic'] as const

/**
 * The persona easter egg (§56), from the real composer.
 *
 * Pick a preset and the six slider values, the prose fragments the composer turns them into,
 * and the tone bucket a refusal would use are all read from `persona.ts`. Flip the sensitive
 * switch and `applySensitivity` zeroes the four sliders it zeroes on a live turn. Nothing here
 * is generated: the two example sentences are the spec's own, and say so.
 */
export function PersonaProof(): ReactNode {
  const [preset, setPreset] = useState<PresetName>('default')
  const [sensitive, setSensitive] = useState(false)

  const base = PRESETS[preset]
  const sliders = applySensitivity(base, sensitive)
  const bucket = toneBucket(sliders)

  return (
    <Surface lift className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3">
        <Tile tone="model" size="sm">
          <SparklesIcon />
        </Tile>
        <h4 className="min-w-0 flex-1 text-[14.5px] font-semibold">Persona: six sliders, style only</h4>
        <Claim kind="poc" />
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 space-y-4">
          <div>
            <p className="text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase">
              Preset
            </p>
            <ToggleGroup
              type="single"
              value={preset}
              onValueChange={(value) => {
                if (value !== '' && PRESET_NAMES.includes(value as PresetName)) {
                  setPreset(value as PresetName)
                }
              }}
              className="mt-1.5 flex-wrap justify-start gap-1"
              aria-label="Persona preset"
            >
              {PRESET_NAMES.map((name) => (
                <ToggleGroupItem key={name} value={name} size="sm" className="rounded-full border px-3 text-[12px]">
                  {PRESET_LABEL[name]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <dl className="space-y-2">
            {SLIDER_NAMES.map((name) => {
              const zeroed = sensitive && ZEROED.includes(name as (typeof ZEROED)[number]) && base[name] > 0
              return (
                <div key={name} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.5rem] items-center gap-2">
                  <dt className={cn('text-[12.5px] capitalize', zeroed && 'text-warning-foreground')}>{name}</dt>
                  <dd className="bg-muted h-2 overflow-hidden rounded-full">
                    <span
                      className={cn('block h-full rounded-full', zeroed ? 'bg-warning-border' : 'bg-decides-model')}
                      style={{ width: `${String(Math.round(sliders[name] * 100))}%` }}
                    />
                  </dd>
                  <dd className="text-muted-foreground text-right font-mono text-[11px] tabular-nums">
                    {sliders[name].toFixed(2)}
                  </dd>
                </div>
              )
            })}
          </dl>

          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <Label htmlFor="persona-sensitive" className="text-[13px]">
                A sensitive turn
              </Label>
              <p className="text-muted-foreground text-[11.5px] leading-snug">
                A bereavement, arrears, a fraud. Humour, sarcasm, playfulness and poetic go to zero
                before the model sees it.
              </p>
            </div>
            <Switch id="persona-sensitive" checked={sensitive} onCheckedChange={setSensitive} />
          </div>

          <p className="flex flex-wrap items-center gap-2 text-[12.5px]">
            <span className="text-muted-foreground">A refusal would sound</span>
            <Decider decides="code">{bucket}</Decider>
            <span className="text-muted-foreground">from these sliders, never set on its own.</span>
          </p>
        </div>

        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase">
              What the model is told, verbatim
            </p>
            <pre className="dark bg-card text-foreground mt-1.5 max-h-72 overflow-auto rounded-lg p-3 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap">
              {composePersona(sliders)}
            </pre>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase">
              The spec&rsquo;s own example, §56. Not generated here.
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed">
              <span className="text-muted-foreground">Default: </span>
              {SPEC_EXAMPLE.default}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed">
              <span className="text-muted-foreground">Poetic: </span>
              {SPEC_EXAMPLE.poetic}
            </p>
          </div>

          <p className="text-muted-foreground text-[11.5px] leading-relaxed">
            The style block is composed after the policy block and labelled as style. It is read
            from the database on every turn, so moving a slider in the console changes the next
            thing Baz says, and no slider can change what it may discuss, which tools it has, or
            any customer protection.
          </p>
        </div>
      </div>
    </Surface>
  )
}
