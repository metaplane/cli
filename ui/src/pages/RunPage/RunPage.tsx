import {
  PageError,
  PageError404,
  PageLayout,
} from "@mp/ui/src/components/base";
import { Row } from "super/src/components/base/layout";
import { SuperFillSpinner } from "super/src/SuperFill/SuperFillSpinner";
import { RunContext, useRuns } from "../../data/runs";
import { majorScale } from "evergreen-ui";
import { RunPageTabs } from "../../components/RunPageTabs/RunPageTabs";
import { Outlet } from "react-router-dom";
import { useRunIdParam } from "./params";
import { useMemo } from "react";
import { makeUnifiedRunManifest } from "../../utils/target";

export function RunPage() {
  const runId = useRunIdParam();
  const { isPending, error, data } = useRuns();
  const runContext = useMemo(() => {
    const run = data?.find((run) => run.id === runId);
    if (run && run.status === "completed") {
      const unifiedRunManifest = makeUnifiedRunManifest(run.target);
      return {
        response: run,
        unifiedRunManifest,
      };
    }
  }, [data, runId]);

  if (isPending) {
    return <SuperFillSpinner />;
  }

  if (error) {
    return <PageError />;
  }

  if (!data) {
    return <PageError404 />;
  }

  return (
    <PageLayout
      title="Run"
      subtitle={runId}
      backgroundColor="white"
      tabs={
        runContext?.response.status === "completed" ? (
          <RunPageTabs run={runContext.response} />
        ) : null
      }
    >
      {runContext === undefined ? (
        <SuperFillSpinner />
      ) : (
        <Row width="100%" gap={majorScale(3)}>
          <RunContext.Provider value={runContext}>
            <Outlet />
          </RunContext.Provider>
        </Row>
      )}
    </PageLayout>
  );
}
