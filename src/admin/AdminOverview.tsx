import { useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/queryKeys";
import { useRealtimeInvalidation } from "@/lib/useRealtimeInvalidation";
import { adminApi } from "@/admin/adminClient";
import { CasesScreen } from "@/admin/CasesScreen";
import { CaseDetail } from "@/admin/CaseDetail";
import { EngineScreen } from "@/admin/EngineScreen";
import { GuardrailsScreen } from "@/admin/GuardrailsScreen";
import { PersonaControls } from "@/admin/PersonaControls";

/**
 * Which screen the console is showing.
 *
 * Four, where there were six. "Overview", "cases" and "audience" were three lists of the same
 * conversations under different headings, and the difference between them was a distinction
 * only the person who built it could hold.
 */
type Section = "cases" | "case" | "guardrails" | "persona" | "engine";

/** The screens that read the shared overview. The other two fetch their own, or nothing. */
type OverviewSection = Extract<Section, "cases" | "guardrails" | "persona">;

export function AdminOverview({
  section,
}: {
  readonly section?: Section;
}): ReactNode {
  /**
   * Two screens need nothing from the server.
   *
   * The catalogue is compiled into the bundle and a case detail fetches its own data, so
   * neither should sit behind a spinner waiting for a case list it will never read.
   */
  if (section === "engine") return <EngineScreen />;
  if (section === "case") return <CaseDetail />;

  return <WithOverview section={section ?? "cases"} />;
}

function WithOverview({
  section,
}: {
  readonly section: OverviewSection;
}): ReactNode {
  const queryClient = useQueryClient();
  const overview = useQuery({
    queryKey: queryKeys.admin.cases(),
    queryFn: adminApi.overview,
  });

  const refresh = useCallback(
    () =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.cases() }),
    [queryClient],
  );

  /**
   * §40 — the console follows the conversation as it happens. Somebody watching a customer talk
   * to Baz should see the facts land and the applications appear, rather than reloading to find
   * out whether anything did.
   */
  useRealtimeInvalidation(
    ["messages", "facts", "applications", "events", "product_interests"],
    refresh,
  );

  if (overview.isPending) return <Skeleton className="h-40 w-full" />;
  if (overview.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{overview.error.message}</AlertDescription>
      </Alert>
    );
  }

  const data = overview.data;

  switch (section) {
    case "persona":
      return <PersonaControls persona={data.persona} onChanged={refresh} />;
    case "guardrails":
      return (
        <GuardrailsScreen
          blocked={data.blocked}
          killSwitch={data.killSwitch}
          onChanged={refresh}
        />
      );
    case "cases":
      return <CasesScreen data={data} onChanged={refresh} />;
  }
}
