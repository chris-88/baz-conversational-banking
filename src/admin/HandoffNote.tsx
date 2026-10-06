import { useState, type ReactNode } from "react";
import { AlertTriangleIcon, CheckIcon, CopyIcon } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AdminCase } from "@contracts/admin.ts";

/**
 * What a person reads before picking up the phone.
 *
 * The point of the whole system, from the customer's side, is not having to start again. That
 * only holds if whoever answers can see what was agreed — so this is first on the screen, ahead
 * of the engines' reasoning and the raw conversation, and it is composed from the case rather
 * than written by a model. Somebody is going to act on it.
 */
export function HandoffNote({
  handoff,
}: {
  readonly handoff: AdminCase["handoff"];
}): ReactNode {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard
      .writeText(handoff.text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      // Clipboard access is refused often enough that failing loudly would be worse than the
      // button quietly doing nothing; the note is on screen either way.
      .catch(() => undefined);
  };

  const cautions = handoff.sections.filter((section) => section.caution);
  const body = handoff.sections.filter((section) => !section.caution);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{handoff.who}</CardTitle>
        <CardDescription>
          Handover note · {handoff.turns}{" "}
          {handoff.turns === 1 ? "message" : "messages"}
          {handoff.lastSeen !== null &&
            ` · last spoke ${handoff.lastSeen.slice(0, 10)}`}
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5">
        {body.map((section, index) => (
          <div key={section.heading} className="space-y-2">
            {index > 0 && <Separator className="mb-5" />}
            <h3 className="text-sm font-medium">{section.heading}</h3>
            <ul className="space-y-1">
              {section.lines.map((line) => (
                <li
                  key={line}
                  className="text-muted-foreground text-sm"
                  // Nested detail — a check-in agenda under its check-in — is indented in the
                  // source rather than restructured, so the text and the screen stay identical.
                  style={{ paddingLeft: `${String(indentOf(line))}rem` }}
                >
                  {line.trimStart()}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {cautions.map((section) => (
          <Alert key={section.heading} variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>{section.heading}</AlertTitle>
            <AlertDescription>
              <ul className="space-y-1">
                {section.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}

function indentOf(line: string): number {
  return (line.length - line.trimStart().length) / 2;
}
