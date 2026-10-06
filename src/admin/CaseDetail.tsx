import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/queryKeys";
import { routes } from "@/app/routes";
import { adminApi } from "@/admin/adminClient";
import { HandoffNote } from "@/admin/HandoffNote";
import { CaseInspector } from "@/admin/CaseInspector";
import { DemoActions } from "@/admin/DemoActions";
import { useRealtimeInvalidation } from "@/lib/useRealtimeInvalidation";

/**
 * One case, read the way somebody about to speak to the customer would read it.
 *
 * Handover note first, because that is what the call needs. Then the conversation as it
 * actually happened, then what the engines made of it, then the controls for moving things on
 * by hand. The reasoning is further down than it used to be on purpose: it is the most
 * interesting part of the build and the least useful part of a phone call.
 */
export function CaseDetail(): ReactNode {
  const { caseId } = useParams<{ caseId: string }>();
  const [reasoning, setReasoning] = useState(false);
  const queryClient = useQueryClient();

  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.admin.caseInspection(caseId ?? ""),
    });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.cases() });
  };

  // The console should move as the customer talks, rather than needing a reload to find out
  // whether anything happened.
  useRealtimeInvalidation(
    ["messages", "facts", "applications", "events", "product_interests"],
    refresh,
  );

  const inspection = useQuery({
    queryKey: queryKeys.admin.caseInspection(caseId ?? ""),
    queryFn: () => adminApi.inspect(caseId ?? ""),
    enabled: caseId !== undefined,
  });

  if (caseId === undefined)
    return (
      <Alert>
        <AlertDescription>No case selected.</AlertDescription>
      </Alert>
    );
  if (inspection.isPending) return <Skeleton className="h-96 w-full" />;
  if (inspection.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{inspection.error.message}</AlertDescription>
      </Alert>
    );
  }

  const data = inspection.data;

  return (
    <div className="space-y-6">
      <Button asChild size="sm" variant="ghost" className="-ml-2">
        <Link to={routes.admin.root}>
          <ArrowLeftIcon />
          All cases
        </Link>
      </Button>

      <HandoffNote handoff={data.handoff} />

      <Conversation conversation={data.conversation} />

      {/* What a person on the call can do about it, each checked against the state machine. */}
      <DemoActions
        caseId={caseId}
        moves={data.demoActions}
        onChanged={refresh}
      />

      {/* Applications, the plan, and the notification: what handling the call actually needs. */}
      <CaseInspector caseId={caseId} show="handling" />

      {/*
        The engines' reasoning, folded away by default.
        
        It is the most interesting part of the build and the least useful part of a phone call,
        and a page that opens with all of it is a page nobody reads to the end.
      */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReasoning((shown) => !shown)}
          >
            {reasoning ? <ChevronDownIcon /> : <ChevronRightIcon />}
            {reasoning
              ? "Hide how Baz worked this out"
              : "How Baz worked this out"}
          </Button>
          <Separator className="flex-1" />
        </div>

        {reasoning && <CaseInspector caseId={caseId} show="reasoning" />}
      </div>
    </div>
  );
}

/** What was actually said. A summary is a claim; the transcript is the evidence for it. */
function Conversation({
  conversation,
}: {
  readonly conversation: AdminCaseConversation;
}): ReactNode {
  if (conversation.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>The conversation</CardTitle>
        <CardDescription>
          {conversation.length} turns, oldest first.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-96">
          <div className="space-y-4 px-6">
            {conversation.map((message, index) => (
              <div
                key={`${String(index)}-${message.role}`}
                className="space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-medium">
                    {message.role === "baz"
                      ? "Baz"
                      : message.role === "customer"
                        ? "Customer"
                        : "System"}
                  </span>
                  {message.cards.map((card) => (
                    <Badge key={card} variant="outline" className="text-2xs">
                      {card.replaceAll("_", " ")}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

type AdminCaseConversation = {
  readonly role: "customer" | "baz" | "system";
  readonly content: string;
  readonly cards: readonly string[];
}[];
