import {
  PageError,
  PageError404,
  PageLayout,
} from "@mp/ui/src/components/base";
import { Column } from "super/src/components/base/layout";
import { SuperFillSpinner } from "super/src/SuperFill/SuperFillSpinner";
import { useRun } from "../../data/runs";
import { ResourceSummary } from "./ResourceSummary";
import { NodeTable } from "./NodeTable";
import { majorScale } from "evergreen-ui";
import { RunPageTabs } from "../../components/RunPageTabs/RunPageTabs";
import { SuperCodeEditor } from "super/src/SuperCodeEditor/SuperCodeEditor";
import { useEffect, useRef } from "react";

export function RunPage({ runId }: { runId: string }) {
  const { isPending, error, data } = useRun(runId);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [data?.stdout]);

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
      tabs={data.status === "completed" ? <RunPageTabs run={data} /> : null}
    >
      {data.status === "pending" ? (
        <SuperFillSpinner />
      ) : (
        <Column
          flex={1}
          maxHeight="100vh"
          overflowY="scroll"
          gap={majorScale(3)}
        >
          <ResourceSummary target={data.target} />
          {data.stdout && (
            <SuperCodeEditor
              ref={logRef}
              readOnly
              language="shell-session"
              value={data.stdout}
              maxHeight={200}
            />
          )}
          <NodeTable target={data.target} />
        </Column>
      )}
    </PageLayout>
  );
}
