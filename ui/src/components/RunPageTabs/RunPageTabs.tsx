import { PageTab } from "@mp/ui/src/components/base";
import { majorScale, Pill } from "evergreen-ui";
import { Row } from "super/src/components/base/layout";
import type { RunResponse } from "../../../../cli/src/dbt/ui/api";

type RunPageTabsProps = {
  run: RunResponse & { status: "completed" };
};

export function RunPageTabs({ run }: RunPageTabsProps) {
  const runId = run.id;
  const failingTestCount = run.target.runResults.results.reduce(
    (acc, runResultNode) => {
      const manifestNode = run.target.manifest.nodes[runResultNode.unique_id]!;
      return manifestNode.resource_type === "test" &&
        runResultNode.status === "fail"
        ? acc + 1
        : acc;
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
    </Row>
  );
}
