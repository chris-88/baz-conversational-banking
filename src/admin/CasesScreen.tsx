import type { ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ChevronRightIcon,
  MessagesSquareIcon,
  PowerIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
 * The console's home: every live conversation, and what is happening in them.
 *
 * Laid out across the width rather than down it. The list and the live feed are two different
 * questions asked at the same time — what is going on, and what just happened — and stacking
 * them meant the feed was always below the fold on the screen it matters most.
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

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>
              {data.cases.length === 0
                ? "Nobody has started one yet."
                : `${String(data.cases.length)} on this project. Open one to see what was said and what was agreed.`}
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

          <CardContent className="px-0">
            {data.cases.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessagesSquareIcon />
                  </EmptyMedia>
                  <EmptyTitle>No conversations yet</EmptyTitle>
                  <EmptyDescription>
                    Every visitor gets their own case the moment they say
                    something.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">
                      Applications
                    </TableHead>
                    <TableHead className="text-right">Messages</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cases.map((item) => (
                    <TableRow key={item.id}>
                      {/*
                        The link is on every cell rather than wrapping the row: an anchor cannot
                        contain table cells, and a click handler on the row would not be a link
                        at all — no middle-click, no copy address, no keyboard.
                      */}
                      <TableCell className="p-0">
                        <Link
                          to={routes.admin.case(item.id)}
                          className="block px-4 py-2 font-medium"
                        >
                          {item.label ?? item.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden p-0 sm:table-cell">
                        <Link
                          to={routes.admin.case(item.id)}
                          className="text-muted-foreground tabular block px-4 py-2 text-right"
                        >
                          {item.applications === 0 ? "—" : item.applications}
                        </Link>
                      </TableCell>
                      <TableCell className="p-0">
                        <Link
                          to={routes.admin.case(item.id)}
                          className="text-muted-foreground tabular block px-4 py-2 text-right"
                        >
                          {item.messages === 0 ? "—" : item.messages}
                        </Link>
                      </TableCell>
                      <TableCell className="p-0">
                        <Link
                          to={routes.admin.case(item.id)}
                          className="text-muted-foreground tabular block px-4 py-2 text-right"
                        >
                          {item.updatedAt.slice(11, 16)}
                        </Link>
                      </TableCell>
                      <TableCell className="p-0">
                        <Link
                          to={routes.admin.case(item.id)}
                          aria-label={`Open ${item.label ?? item.id.slice(0, 8)}`}
                          className="block px-2 py-2"
                        >
                          <ChevronRightIcon className="text-muted-foreground size-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="min-w-0">
          {data.activity.length > 0 ? (
            <ActivityFeed activity={data.activity} />
          ) : (
            <ActivityPlaceholder />
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
          <CardDescription>
            Nothing here touches a customer. Both are for running the prototype.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <ItemGroup>
            <Item>
              <ItemMedia variant="icon">
                <RotateCcwIcon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Rebuild the sample customer</ItemTitle>
                <ItemDescription>
                  Signed in, with the details the bank holds and nothing else.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={reset.isPending}
                  onClick={() => reset.mutate()}
                >
                  {reset.isPending ? "Rebuilding…" : "Rebuild"}
                </Button>
              </ItemActions>
            </Item>

            <ItemSeparator />

            <Item>
              <ItemMedia variant="icon">
                <PowerIcon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  Pause Baz
                  {data.killSwitch && (
                    <Badge variant="destructive" className="ml-2">
                      paused
                    </Badge>
                  )}
                </ItemTitle>
                <ItemDescription>
                  Every request is turned away at the gate, without calling a
                  model. §43
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Switch
                  checked={data.killSwitch}
                  onCheckedChange={(enabled) => kill.mutate(enabled)}
                  aria-label="Pause Baz"
                />
              </ItemActions>
            </Item>
          </ItemGroup>
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

/**
 * The four numbers.
 *
 * `questionsAvoided` leads because it is the one §53 asks for and the only one that measures the
 * thing Baz is for; the rest are volume.
 */
function Metrics({
  metrics,
}: {
  readonly metrics: AdminOverview["metrics"];
}): ReactNode {
  const tiles = [
    {
      label: "Questions avoided",
      value: metrics.questionsAvoided,
      note: "Answers reused instead of asked again. §53",
    },
    {
      label: "Facts captured",
      value: metrics.factsCaptured,
      note: "Across every conversation.",
    },
    {
      label: "Applications started",
      value: metrics.applicationsStarted,
      note: "Begun from a card the customer tapped.",
    },
    {
      label: "Requests blocked",
      value: metrics.requestsBlocked,
      note: "Turned away before the model saw them. §25",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label} className="gap-2">
          <CardHeader>
            <CardDescription>{tile.label}</CardDescription>
            <CardTitle className="tabular text-3xl">{tile.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">{tile.note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
