import { Column } from "super/src/components/base/layout";
import {
  PageError,
  PageError404,
  PageLayout,
} from "@mp/ui/src/components/base";
import { majorScale } from "evergreen-ui";
import { useRun } from "../../data/runs";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { SuperFillSpinner } from "super/src/SuperFill/SuperFillSpinner";
import { RunPageTabs } from "../../components/RunPageTabs/RunPageTabs";
import { FailingTests } from "./FailingTests";

export function RunTestsPage() {
  const { runId } = z.object({ runId: z.string() }).parse(useParams());
  const { isPending, error, data } = useRun(runId);

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
      title="Run tests"
      subtitle={runId}
      backgroundColor="white"
      tabs={data.status === "completed" ? <RunPageTabs run={data} /> : null}
    >
      <Column flex={1} maxHeight="100vh" overflowY="scroll" gap={majorScale(3)}>
        {data.status === "completed" ? (
          <FailingTests target={data.target} />
        ) : (
          <SuperFillSpinner />
        )}
      </Column>
    </PageLayout>
  );
}
