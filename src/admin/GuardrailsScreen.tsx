import type { ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldAlertIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adminApi } from "@/admin/adminClient";
import { boiDomainConfig } from "@tenants/boi/domain-config.ts";
import { refusalFor } from "@llm/refusals.ts";
import type { AdminOverview } from "@contracts/admin.ts";

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
  readonly blocked: AdminOverview["blocked"];
  readonly killSwitch: boolean;
  readonly onChanged: () => void;
}): ReactNode {
  const kill = useMutation({
    mutationFn: adminApi.setKillSwitch,
    onSuccess: onChanged,
  });

  return (
    <div className="space-y-6">
      <Alert>
        <ShieldAlertIcon />
        <AlertDescription>
          A classifier plus deterministic checks run in front of the model. A
          blocked request never reaches Baz at all, and the refusal never
          contains the answer. §25, §26
        </AlertDescription>
      </Alert>

      {/* The long list on the left, the reference material beside it. */}
      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>What gets through</CardTitle>
            <CardDescription>
              Every message is classified before Baz sees it. These are the
              categories and what each one gets back.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {boiDomainConfig.categories.map((category, index) => (
              <div key={category.id} className="space-y-1.5">
                {index > 0 && <Separator className="mb-5" />}
                <div className="flex items-center gap-2">
                  <h3 className="flex-1 text-sm font-medium">
                    {category.label}
                  </h3>
                  <Badge
                    variant={category.reachesModel ? "default" : "secondary"}
                  >
                    {category.reachesModel ? "reaches Baz" : "blocked"}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {category.description}
                </p>

                {category.examples.length > 0 && (
                  <p className="text-muted-foreground text-sm">
                    For example:{" "}
                    {category.examples
                      .map((example) => `“${example}”`)
                      .join(", ")}
                  </p>
                )}

                {/* The actual words somebody gets back, so nobody has to guess at the tone. */}
                {!category.reachesModel && (
                  <blockquote className="border-l-2 pl-3 text-sm italic">
                    {refusalFor(category.id, "neutral")}
                  </blockquote>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6">
          <Scope title="In scope" items={boiDomainConfig.inScope} />
          <Scope title="Out of scope" items={boiDomainConfig.outOfScope} />

          <Card>
            <CardHeader>
              <CardTitle>Recently blocked</CardTitle>
              <CardDescription>
                {blocked.length === 0
                  ? "Nothing blocked yet."
                  : "Most recent first."}
              </CardDescription>
            </CardHeader>
            {blocked.length > 0 && (
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blocked.map((item, index) => (
                      <TableRow key={`${item.at}-${String(index)}`}>
                        <TableCell>
                          <Badge variant="secondary">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular text-right">
                          {new Date(item.at).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
              <CardDescription>
                Scope and categories are tenant configuration, read by the gate
                on every turn. Changing them is a config edit, not a prompt
                change. §20, §32
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="pause">Pause Baz</Label>
                <p className="text-muted-foreground text-sm">
                  Every request is turned away at the gate, without calling a
                  model. §43
                </p>
              </div>
              <Switch
                id="pause"
                checked={killSwitch}
                onCheckedChange={(enabled) => kill.mutate(enabled)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Scope({
  title,
  items,
}: {
  readonly title: string;
  readonly items: readonly string[];
}): ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1 pl-4">
          {items.map((item) => (
            <li key={item} className="text-muted-foreground text-sm">
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
