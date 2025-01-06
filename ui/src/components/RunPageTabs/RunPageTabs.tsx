import { PageTab } from "@mp/ui/src/components/base";
import { majorScale } from "evergreen-ui";
import { Row } from "super/src/components/base/layout";
import type { RunResponse } from "../../../../cli/src/dbt/ui/api";

type RunPageTabsProps = {
  run: RunResponse & { status: "completed" };
};

export function RunPageTabs({ run }: RunPageTabsProps) {
  const runId = run.id;
  return (
    <Row fontSize={14}>
      <PageTab to={`/runs/${runId}/overview/all`} exact={false}>
        Overview
      </PageTab>
      <PageTab to={`/runs/${runId}/performance`}>
        <Row centerY gap={majorScale(1)}>
          Performance
        </Row>
      </PageTab>
    </Row>
  );
}
