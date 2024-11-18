import { SuperIcon, SuperIconButton, SuperTable } from "super";
import type { Target } from "../../../../cli/src/utils/target";
import { useCallback, useMemo, useState } from "react";
import { min, max, intervalToDuration, formatDuration } from "date-fns";
import { useRunTest } from "../../data/runs";
import { useNavigate } from "react-router-dom";
import { isStandalone } from "../../utils/standalone";

type RunResultNode = Target["runResults"]["results"][number];

export function NodeTable({ target }: { target: Target }) {
  const [sortField, setSortField] = useState<
    "status" | "type" | "name" | "startedAt" | "completedAt" | "duration"
  >("startedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const { mutate: runTest } = useRunTest();
  const navigate = useNavigate();

  const getRowKey = useCallback((node: RunResultNode) => node.unique_id, []);

  const sortedRows = useMemo(() => {
    const rows = Object.values(target.runResults.results);

    return rows.sort((a, b) => {
      const manifestNodeA = target.manifest.nodes[a.unique_id]!;
      const manifestNodeB = target.manifest.nodes[b.unique_id];
      const startedAtA = min(a.timing.map((t) => t.started_at));
      const startedAtB = min(b.timing.map((t) => t.started_at));
      const completedAtA = max(a.timing.map((t) => t.completed_at));
      const completedAtB = max(b.timing.map((t) => t.completed_at));

      let comparison: number;
      switch (sortField) {
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "type":
          comparison = manifestNodeA.resource_type.localeCompare(
            manifestNodeB.resource_type
          );
          break;
        case "name":
          comparison = (manifestNodeA.name ?? "").localeCompare(
            manifestNodeB.name ?? ""
          );
          break;
        case "startedAt":
          comparison = startedAtA.getTime() - startedAtB.getTime();
          break;
        case "completedAt":
          comparison = completedAtA.getTime() - completedAtB.getTime();
          break;
        case "duration": {
          const durationA = completedAtA.getTime() - startedAtA.getTime();
          const durationB = completedAtB.getTime() - startedAtB.getTime();
          comparison = durationA - durationB;
          break;
        }
        default:
          comparison = 0;
      }

      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [target, sortField, sortDir]);

  const renderRow = useCallback(
    (runResultNode: RunResultNode) => {
      const manifestNode = target.manifest.nodes[runResultNode.unique_id]!;
      const status = runResultNode.status;
      const startedAt = min(runResultNode.timing.map((t) => t.started_at));
      const completedAt = max(runResultNode.timing.map((t) => t.completed_at));
      const duration = intervalToDuration({
        start: startedAt,
        end: completedAt,
      });
      const formattedDuration = formatDuration(duration, { zero: true });
      return (
        <SuperTable.Row>
          <SuperTable.Cell>{status}</SuperTable.Cell>
          <SuperTable.Cell>{manifestNode.resource_type}</SuperTable.Cell>
          <SuperTable.Cell>{manifestNode.name}</SuperTable.Cell>
          <SuperTable.Cell>
            {status !== "skipped" ? startedAt.toLocaleString() : "-"}
          </SuperTable.Cell>
          <SuperTable.Cell>
            {status !== "skipped" ? completedAt.toLocaleString() : "-"}
          </SuperTable.Cell>
          <SuperTable.Cell>
            {status !== "skipped"
              ? formattedDuration === ""
                ? "< 1 second"
                : formattedDuration
              : "-"}
          </SuperTable.Cell>
          {!isStandalone() && (
            <SuperTable.Cell>
              <SuperIconButton
                onClick={async () => {
                  await runTest(manifestNode.name ?? "");
                  navigate("/runs");
                }}
                size="small"
                icon={<SuperIcon name="rotate-right" />}
              />
            </SuperTable.Cell>
          )}
        </SuperTable.Row>
      );
    },
    [target, navigate, runTest]
  );
  return (
    <SuperTable>
      <SuperTable.Header>
        <SuperTable.SortableHeaderCell
          sortDirection={sortField === "status" ? sortDir : undefined}
          onSortDirectionChange={(dir) => {
            setSortField("status");
            setSortDir(dir);
          }}
        >
          Status
        </SuperTable.SortableHeaderCell>
        <SuperTable.SortableHeaderCell
          sortDirection={sortField === "type" ? sortDir : undefined}
          onSortDirectionChange={(dir) => {
            setSortField("type");
            setSortDir(dir);
          }}
        >
          Type
        </SuperTable.SortableHeaderCell>
        <SuperTable.SortableHeaderCell
          sortDirection={sortField === "name" ? sortDir : undefined}
          onSortDirectionChange={(dir) => {
            setSortField("name");
            setSortDir(dir);
          }}
        >
          Name
        </SuperTable.SortableHeaderCell>
        <SuperTable.SortableHeaderCell
          sortDirection={sortField === "startedAt" ? sortDir : undefined}
          onSortDirectionChange={(dir) => {
            setSortField("startedAt");
            setSortDir(dir);
          }}
        >
          Started at
        </SuperTable.SortableHeaderCell>
        <SuperTable.SortableHeaderCell
          sortDirection={sortField === "completedAt" ? sortDir : undefined}
          onSortDirectionChange={(dir) => {
            setSortField("completedAt");
            setSortDir(dir);
          }}
        >
          Completed at
        </SuperTable.SortableHeaderCell>
        <SuperTable.SortableHeaderCell
          sortDirection={sortField === "duration" ? sortDir : undefined}
          onSortDirectionChange={(dir) => {
            setSortField("duration");
            setSortDir(dir);
          }}
        >
          Duration
        </SuperTable.SortableHeaderCell>
        {!isStandalone() && <SuperTable.HeaderCell></SuperTable.HeaderCell>}
      </SuperTable.Header>
      <SuperTable.VirtualBody
        getRowKey={getRowKey}
        rows={sortedRows}
        rowHeight={40}
        renderRow={renderRow}
      />
    </SuperTable>
  );
}
