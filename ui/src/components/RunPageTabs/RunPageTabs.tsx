import { PageTab } from "@mp/ui/src/components/base";
import { majorScale, Pill } from "evergreen-ui";
import { Row } from "super/src/components/base/layout";
import type { RunResponse } from "../../../../cli/src/dbt/ui/api";
import { resolveManifestNode } from "../../utils/manifest";

type RunPageTabsProps = {
  run: RunResponse & { status: "completed" };
};

export function RunPageTabs({ run }: RunPageTabsProps) {
  const runId = run.id;
  const failingTestCount = run.target.runResults.results.reduce(
    (acc, runResultNode) => {
      const manifestNode = resolveManifestNode(
        run.target.manifest,
        runResultNode.unique_id
      );
      if (!manifestNode) {
        return acc;
      }
      return manifestNode.resource_type === "test" &&
        (runResultNode.status === "fail" || runResultNode.status === "error")
        ? acc + 1
        : acc;
    },
    0
  );
  const failingModelsCount = run.target.runResults.results.reduce(
    (acc, runResultNode) => {
      const manifestNode = resolveManifestNode(
        run.target.manifest,
        runResultNode.unique_id
      );
      if (!manifestNode) {
        return acc;
      }
      return (
        acc +
        (manifestNode.resource_type === "model" &&
        (runResultNode.status === "fail" || runResultNode.status === "error")
          ? 1
          : 0)
      );
    },
    0
  );
  return (
    <Row fontSize={14}>
      <PageTab to={`/runs/${runId}`}>Overview</PageTab>
      <PageTab to={`/runs/${runId}/tests`}>
        <Row centerY gap={majorScale(1)}>
          Tests{" "}
          {failingTestCount > 0 ? (
            <Pill color="red">{failingTestCount}</Pill>
          ) : null}
        </Row>
      </PageTab>
      <PageTab to={`/runs/${runId}/models`}>
        Models{" "}
        {failingModelsCount > 0 ? (
          <Pill color="red">{failingModelsCount}</Pill>
        ) : null}
      </PageTab>
    </Row>
  );
}
