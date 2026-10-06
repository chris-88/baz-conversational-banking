import type { ReactNode } from "react";
import { ActivityIcon } from "lucide-react";
import type { AdminOverview } from "@contracts/admin.ts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * §38 — what is happening, as it happens.
 *
 * The console already follows the case live over Realtime, so a presenter can leave this on
 * screen and let an audience watch a plan form, a milestone land and a check-in come due,
 * rather than being told it happened. Signals are the things worth watching; the bookkeeping
 * between them stays quiet so the moments that matter are legible.
 */
export function ActivityFeed({
  activity,
}: {
  activity: AdminOverview["activity"];
}): ReactNode {
  if (activity.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">Live activity</h2>
        <Badge variant="secondary" className="text-2xs">
          Updates as it happens
        </Badge>
      </div>

      <Card className="max-h-80 gap-0 divide-y overflow-y-auto p-0">
        {activity.map((item, index) => (
          <div
            key={`${item.at}-${String(index)}`}
            className={cn(
              "flex items-baseline gap-3 px-4 py-2",
              item.signal && "bg-primary/[0.03]",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "mt-1.5 size-1.5 shrink-0 rounded-full",
                item.signal ? "bg-primary" : "bg-muted-foreground/30",
              )}
            />
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block text-xs",
                  item.signal ? "font-medium" : "text-muted-foreground",
                )}
              >
                {item.describe}
              </span>
              <span className="text-muted-foreground block text-2xs">
                {item.caseLabel} · {item.actor}
              </span>
            </span>
            <span className="text-muted-foreground tabular shrink-0 text-2xs">
              {new Date(item.at).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </Card>
    </section>
  );
}

/** The empty state is worth its own component: a feed with nothing in it looks broken. */
export function ActivityPlaceholder(): ReactNode {
  return (
    <Card className="gap-0 p-4">
      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <ActivityIcon aria-hidden className="size-4" />
        Nothing has happened on these cases yet. Start a conversation and it
        will appear here.
      </p>
    </Card>
  );
}
