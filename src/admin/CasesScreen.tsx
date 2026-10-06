import type { ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronRightIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { routes } from "@/app/routes";
import { adminApi } from "@/admin/adminClient";
import { ActivityFeed, ActivityPlaceholder } from "@/admin/ActivityFeed";
import type { AdminOverview } from "@contracts/admin.ts";

/**
 * Every live conversation, and what is happening in them.
 *
 * A case is a row in a table rather than a hand-built flex row, which is the whole of the
 * difference between this and what it replaced: the components already exist and already agree
 * with each other, so using them is both less code and more consistent than not.
 */
export function CasesScreen({
  data,
  onChanged,
}: {
  readonly data: AdminOverview;
  readonly onChanged: () => void;
}): ReactNode {
  const purge = useMutation({
    mutationFn: adminApi.purgeCases,
    onSuccess: onChanged,
  });
  const reset = useMutation({
    mutationFn: adminApi.resetCase,
    onSuccess: onChanged,
  });
  const kill = useMutation({
    mutationFn: adminApi.setKillSwitch,
    onSuccess: onChanged,
  });

  return (
    <div className="space-y-6">
      <Metrics metrics={data.metrics} />

      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>
            {data.cases.length === 0
              ? "Nobody has started one yet."
              : `${String(data.cases.length)} on this project.`}
          </CardDescription>
          {data.cases.length > 0 && (
            <CardAction>
              <PurgeButton
                count={data.cases.length}
                pending={purge.isPending}
                onConfirm={() => purge.mutate()}
              />
            </CardAction>
          )}
        </CardHeader>

        {data.cases.length > 0 && (
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Applications</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cases.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      {/* The link covers the cell rather than the row, so the whole row stays
                          keyboard-reachable as one target. */}
                      <Link to={routes.admin.case(item.id)} className="block">
                        {item.label ?? item.id.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular text-right">
                      {item.applications}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular text-right">
                      {item.messages}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular text-right">
                      {item.updatedAt.slice(11, 16)}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={routes.admin.case(item.id)}
                        aria-label="Open case"
                      >
                        <ChevronRightIcon className="text-muted-foreground size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      {data.activity.length > 0 ? (
        <ActivityFeed activity={data.activity} />
      ) : (
        <ActivityPlaceholder />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="rebuild">Rebuild the sample customer</Label>
              <p className="text-muted-foreground text-sm">
                Signed in, with the details the bank holds and nothing else.
              </p>
            </div>
            <Button
              id="rebuild"
              variant="outline"
              disabled={reset.isPending}
              onClick={() => reset.mutate()}
            >
              <RotateCcwIcon />
              {reset.isPending ? "Rebuilding…" : "Rebuild"}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="pause">Pause Baz</Label>
              <p className="text-muted-foreground text-sm">
                Every request is turned away at the gate, without calling a
                model. §43
              </p>
            </div>
            <Switch
              id="pause"
              checked={data.killSwitch}
              onCheckedChange={(enabled) => kill.mutate(enabled)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Deleting every conversation is irreversible, so it asks once.
 *
 * `AlertDialog` rather than `Dialog`: this interrupts to confirm a destructive thing, which is
 * exactly the distinction between the two.
 */
function PurgeButton({
  count,
  pending,
  onConfirm,
}: {
  readonly count: number;
  readonly pending: boolean;
  readonly onConfirm: () => void;
}): ReactNode {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending}>
          <Trash2Icon />
          {pending ? "Clearing…" : `Purge all ${String(count)}`}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete every conversation?</AlertDialogTitle>
          <AlertDialogDescription>
            All {count} go, along with their facts, applications, plans and
            events. The sample customer can be rebuilt afterwards from Controls.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep them</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Delete all {count}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Metrics({
  metrics,
}: {
  readonly metrics: AdminOverview["metrics"];
}): ReactNode {
  const tiles = [
    {
      label: "Questions avoided",
      value: metrics.questionsAvoided,
      note: "§53",
    },
    { label: "Facts captured", value: metrics.factsCaptured, note: null },
    {
      label: "Applications started",
      value: metrics.applicationsStarted,
      note: null,
    },
    { label: "Requests blocked", value: metrics.requestsBlocked, note: "§25" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <CardHeader>
            <CardDescription>
              {tile.label}
              {tile.note !== null && (
                <span className="ml-1 opacity-60">{tile.note}</span>
              )}
            </CardDescription>
            <CardTitle className="tabular text-3xl">{tile.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
