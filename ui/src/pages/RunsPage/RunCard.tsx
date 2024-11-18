import { Column, Row } from "super/src/components/base/layout";
import {
  EMERALD_600,
  NEUTRAL_050,
  NEUTRAL_200,
  RED_600,
} from "super/src/tokens/colors";
import { minorScale, Text } from "evergreen-ui";
import { ClickableAreaLink } from "@mp/ui/src/components/ClickableArea/ClickableAreaLink";
import { SuperIcon } from "super/src/SuperIcon/SuperIcon";
import { SuperCodeEditor, SuperStatusPill } from "super";
import { formatDuration, intervalToDuration, max, min } from "date-fns";
import { format, isToday, isYesterday } from "date-fns";
import { useEffect, useMemo, useRef } from "react";
import pluralize from "pluralize";
import type { RunResponse } from "../../../../cli/src/dbt/ui/api";

function CompletedRunCard({
  run,
}: {
  run: RunResponse & { status: "completed" };
}) {
  const startedAt = useMemo(
    () =>
      min(
        run.target.runResults.results
          .filter((r) => r.timing.length > 0)
          .map((r) => r.timing[0].started_at)
      ),
    [run]
  );
  const completedAt = useMemo(
    () =>
      max(
        run.target.runResults.results
          .filter((r) => r.timing.length > 0)
          .map((r) => r.timing[0].completed_at)
      ),
    [run]
  );
  const duration = useMemo(
    () => intervalToDuration({ start: startedAt, end: completedAt }),
    [completedAt, startedAt]
  );
  const resourceTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const node of Object.values(run.target.manifest.nodes)) {
      counts[node.resource_type] = (counts[node.resource_type] || 0) + 1;
    }
    return counts;
  }, [run]);
  const allPassed = useMemo(
    () =>
      run.target.runResults.results.every(
        (r) =>
          r.status === "success" ||
          r.status === "skipped" ||
          r.status === "pass"
      ),
    [run]
  );

  return (
    <Row borderRadius={4} border={`1px solid ${NEUTRAL_200}`}>
      <ClickableAreaLink
        to={`/runs/${run.id}`}
        replace
        width="100%"
        hoverColor={NEUTRAL_050}
        padding={minorScale(3)}
      >
        <Row justifyContent="space-between">
          <Row gap={minorScale(3)}>
            <Column paddingTop={2}>
              <SuperStatusPill
                size={18}
                backgroundColor={allPassed ? EMERALD_600 : RED_600}
                icon={
                  <SuperIcon
                    fontSize={13}
                    name={allPassed ? "check" : "xmark"}
                    type="solid"
                  />
                }
              />
            </Column>
            <Column>
              <Row gap={minorScale(1)}>
                <Text fontWeight={600} fontSize={15}>
                  {isToday(startedAt)
                    ? "Today"
                    : isYesterday(startedAt)
                    ? "Yesterday"
                    : format(startedAt, "MMM d")}
                </Text>
                <Text color="muted" fontSize={15}>
                  at
                </Text>
                <Text fontSize={15}>
                  {format(startedAt, "h:mma").toLowerCase()}
                </Text>
              </Row>
              <Text fontSize={12} color="muted">
                Took {formatDuration(duration)}
              </Text>
            </Column>
          </Row>
          <Column>
            <Row gap={minorScale(1)}>
              {Object.entries(resourceTypeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([resourceType, count], index, array) => (
                  <>
                    <Text fontSize={12} color="muted" fontWeight="bold">
                      {count}
                    </Text>{" "}
                    <Text fontSize={12} color="muted">
                      {pluralize(resourceType, count)}
                    </Text>
                    {index < array.length - 1 && (
                      <Text fontSize={12} color="muted">
                        {" / "}
                      </Text>
                    )}
                  </>
                ))}
            </Row>
            {run.commitSha && (
              <Row justifyContent="flex-end">
                <Text fontSize={12} color="muted">
                  <SuperIcon name="code-commit" type="solid" />{" "}
                  {run.commitSha.slice(0, 7)}
                </Text>
              </Row>
            )}
          </Column>
        </Row>
      </ClickableAreaLink>
    </Row>
  );
}

function PendingRunCard({ run }: { run: RunResponse & { status: "pending" } }) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTo({
        top: logRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [run.stdout]);

  return (
    <Row
      borderRadius={4}
      border={`1px solid ${NEUTRAL_200}`}
      padding={minorScale(3)}
    >
      <Column padding={minorScale(3)} flex={1}>
        <Text fontSize={15} fontWeight={600}>
          <SuperCodeEditor
            readOnly
            language="shell-session"
            value={run.stdout}
            maxHeight={200}
            ref={logRef}
          />
        </Text>
      </Column>
    </Row>
  );
}

export function RunCard({ run }: { run: RunResponse }) {
  if (run.status === "completed") {
    return <CompletedRunCard run={run} />;
  } else {
    return <PendingRunCard run={run} />;
  }
}
