import { useState, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PRESET_NAMES, SLIDER_NAMES, type PresetName } from '@llm/persona.ts'
import { adminApi } from '@/admin/adminClient'

/** §16 to §18 — style only. Persona cannot change scope, rules or protections. */
export function PersonaControls({
  persona,
  onChanged,
}: {
  persona: Awaited<ReturnType<typeof adminApi.overview>>['persona']
  onChanged: () => void
}): ReactNode {
  const [sliders, setSliders] = useState(persona.sliders)

  const save = useMutation({
    mutationFn: adminApi.setPersona,
    onSuccess: () => onChanged(),
  })

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          Style only. Changing these cannot alter what Baz may discuss, what it can do, or any
          customer protection — and it applies to the very next message. §18, §56
        </AlertDescription>
      </Alert>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Presets</h2>
        <div className="flex flex-wrap gap-2">
          {PRESET_NAMES.map((preset: PresetName) => (
            <Button
              key={preset}
              size="sm"
              variant={persona.preset === preset ? 'default' : 'outline'}
              disabled={save.isPending}
              onClick={() => save.mutate({ preset })}
            >
              {preset.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Sliders</h2>
        <Card className="space-y-5 p-4">
          {SLIDER_NAMES.map((name) => (
            <div key={name} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <Label className="text-sm font-normal capitalize">{name}</Label>
                <span className="text-muted-foreground tabular text-xs">
                  {sliders[name].toFixed(2)}
                </span>
              </div>
              <Slider
                value={[sliders[name]]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([value]) =>
                  setSliders((current) => ({ ...current, [name]: value ?? 0 }))
                }
              />
            </div>
          ))}
          <Button
            size="sm"
            className="w-full"
            disabled={save.isPending}
            onClick={() => save.mutate({ sliders })}
          >
            {save.isPending ? 'Applying…' : 'Apply to the next message'}
          </Button>
        </Card>
      </section>
    </div>
  )
}
