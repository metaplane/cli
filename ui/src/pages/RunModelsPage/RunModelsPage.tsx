import { RunPageTabs } from "../../components/RunPageTabs/RunPageTabs";

import { PageError404 } from "@mp/ui/src/components/base/Page/PageError404";

import { useParams } from "react-router-dom";
import { useRun } from "../../data/runs";
import { z } from "zod";
import { SuperFillSpinner } from "super";
import { PageError } from "@mp/ui/src/components/base/Page/PageError";
import { PageLayout } from "@mp/ui/src/components/base";
import { majorScale } from "evergreen-ui";
import { Column } from "super/src/components/base/layout";
import { FailingModels } from "./FailingModels";

export function RunModelsPage() {
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
          <FailingModels target={data.target} />
        ) : (
          <SuperFillSpinner />
        )}
      </Column>
    </PageLayout>
  );
}
