import { DbtModelTimeline } from "@mp/ui/src/DbtModelTimeline/DbtModelTimeline";
import { majorScale } from "evergreen-ui";
import { Column, Row } from "super/src/components/base/layout";
import { useRunContext } from "../../data/runs";
import { H4 } from "super/src/components/base/type";
import { SuperDivider, SuperTable } from "super";
import { PageCard } from "@mp/ui/src/components/base";
import { useMemo } from "react";
import { formatDuration, max, min, intervalToDuration } from "date-fns";
import type { ExecutedRunManifestNode } from "../../utils/target";
import { groupBy } from "ramda";
import { numFormat } from "super/src/utils/number/NumberFormat";

function getThreadUtilization(nodes: ExecutedRunManifestNode[]) {
  const startedAts = nodes.flatMap((node) =>
    node.runResult.timing.map((t) => t.started_at)
  );
  const completedAts = nodes.flatMap((node) =>
    node.runResult.timing.map((t) => t.completed_at)
  );
  const minStartTime = min(startedAts);
  const maxEndTime = max(completedAts);
  const totalDuration = maxEndTime.getTime() - minStartTime.getTime();
  const utilizedDuration = nodes.reduce((acc, node) => {
    const duration = getDuration(node);
    return acc + duration;
  }, 0);
  return Math.floor((utilizedDuration / totalDuration) * 100);
}

function getDuration(node: ExecutedRunManifestNode) {
  const startTime = min(node.runResult.timing.map((t) => t.started_at));
  const completedAt = max(node.runResult.timing.map((t) => t.completed_at));
  return completedAt.getTime() - startTime.getTime();
}

export function RunPagePerformance() {
  const run = useRunContext();
  const sortedNodes = useMemo(
    () =>
      Object.values(run.unifiedRunManifest.executedNodesByUniqueId)
        .filter((node) => node.runResult.status !== "skipped")
        .sort((a, b) => {
          const durationA = getDuration(a);
          const durationB = getDuration(b);
          return durationB - durationA;
        }),
    [run]
  );
  const visibleNodes = useMemo(() => sortedNodes.slice(0, 5), [sortedNodes]);
  const nodesByThreadId = useMemo(
    () => groupBy((node) => node.runResult.thread_id, sortedNodes),
    [sortedNodes]
  );
  const utilizationByThreadId = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(nodesByThreadId)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([threadId, nodes]) => [threadId, getThreadUtilization(nodes)])
      ),
    [nodesByThreadId]
  );
  return (
    <Column flex={1} maxHeight="100vh" overflowY="scroll" gap={majorScale(3)}>
      <Column gap={majorScale(1)}>
        <Row gap={majorScale(2)} justifyContent="flex-start">
          <PageCard minWidth={400} maxHeight={590}>
            <Column gap={majorScale(1)}>
              <H4>Slowest nodes</H4>
              <SuperTable>
                <SuperTable.Header>
                  <SuperTable.HeaderCell flex={1}>Node</SuperTable.HeaderCell>
                  <SuperTable.HeaderCell flex={0.5}>
                    Duration
                  </SuperTable.HeaderCell>
                </SuperTable.Header>
                <SuperTable.Body>
                  {visibleNodes.map((node) => {
                    const formattedDuration = formatDuration(
                      intervalToDuration({
                        start: 0,
                        end: getDuration(node),
                      })
                    );
                    return (
                      <SuperTable.Row key={node.uniqueId}>
                        <SuperTable.Cell flex={1}>
                          <pre>{node.manifest.name}</pre>
                        </SuperTable.Cell>
                        <SuperTable.Cell flex={0.5}>
                          {formattedDuration === ""
                            ? "< 1 second"
                            : formattedDuration}
                        </SuperTable.Cell>
                      </SuperTable.Row>
                    );
                  })}
                </SuperTable.Body>
              </SuperTable>
            </Column>
          </PageCard>
          <PageCard minWidth={400} maxHeight={590}>
            <Column gap={majorScale(1)}>
              <H4>Thread utilization</H4>
              <SuperTable>
                <SuperTable.Header>
                  <SuperTable.HeaderCell flex={1}>Thread</SuperTable.HeaderCell>
                  <SuperTable.HeaderCell flex={0.5}>
                    Utilization
                  </SuperTable.HeaderCell>
                </SuperTable.Header>
                <SuperTable.Body>
                  {Object.entries(utilizationByThreadId).map(
                    ([threadId, utilization]) => (
                      <SuperTable.Row key={threadId}>
                        <SuperTable.Cell flex={1}>{threadId}</SuperTable.Cell>
                        <SuperTable.Cell flex={0.5}>
                          {numFormat.format(utilization)}%
                        </SuperTable.Cell>
                      </SuperTable.Row>
                    )
                  )}
                </SuperTable.Body>
              </SuperTable>
            </Column>
          </PageCard>
        </Row>
      </Column>
      <SuperDivider />
      <Column gap={majorScale(1)}>
        <H4>Run timeline</H4>
        <DbtModelTimeline
          runResults={run.unifiedRunManifest.target.runResults}
          height={250}
        />
      </Column>
    </Column>
  );
}
