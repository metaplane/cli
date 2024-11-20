import { SuperIcon, SuperIconButton, SuperTable, SuperTooltip } from "super";
import type { Target } from "../../../../cli/src/utils/target";
import { useCallback, useMemo, useState } from "react";
import { min, max, intervalToDuration, formatDuration } from "date-fns";
import { useRunTest } from "../../data/runs";
import { useNavigate } from "react-router-dom";
import { isStandalone } from "../../utils/standalone";
import { resolveManifestNode } from "../../utils/manifest";
import { NEUTRAL_400, RED_400, GREEN_400 } from "super/src/tokens/colors";
import { Code, majorScale, TextInput } from "evergreen-ui";
import { Column } from "super/src/components/base/layout";
import { useFuzzyFilter } from "@mp/ui/src/utils/FuzzyFilter";

type RunResultNode = Target["runResults"]["results"][number];

export function NodeTable({ target }: { target: Target }) {
  const [sortField, setSortField] = useState<
    "status" | "type" | "name" | "startedAt" | "completedAt" | "duration"
  >("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { mutate: runTest } = useRunTest();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const getRowKey = useCallback((node: RunResultNode) => node.unique_id, []);

  const sortedRows = useMemo(() => {
    const rows = Object.values(target.runResults.results);

    return rows.sort((a, b) => {
      const manifestNodeA = resolveManifestNode(target.manifest, a.unique_id);
      const manifestNodeB = resolveManifestNode(target.manifest, b.unique_id);
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

  const visibleNodes = useFuzzyFilter(
    {
      items: sortedRows,
      keyFn: (node) => node.unique_id,
    },
    search
  );

  const renderRow = useCallback(
    (runResultNode: RunResultNode) => {
      const manifestNode = resolveManifestNode(
        target.manifest,
        runResultNode.unique_id
      );
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
          <SuperTable.Cell flex={0.5}>
            <SuperTooltip content={status}>
              {status === "success" || status === "pass" ? (
                <SuperIcon
                  name="check-circle"
                  color={GREEN_400}
                  type="solid"
                  fontSize={18}
                />
              ) : status === "fail" ? (
                <SuperIcon
                  name="circle-xmark"
                  color={RED_400}
                  type="solid"
                  fontSize={18}
                />
              ) : status === "error" ? (
                <SuperIcon
                  name="circle-exclamation"
                  color={RED_400}
                  type="solid"
                  fontSize={18}
                />
              ) : status === "skipped" ? (
                <SuperIcon
                  name="minus"
                  color={NEUTRAL_400}
                  type="solid"
                  fontSize={18}
                />
              ) : (
                status
              )}
            </SuperTooltip>
          </SuperTable.Cell>
          <SuperTable.Cell flex={1}>
            {manifestNode.resource_type}
          </SuperTable.Cell>
          <SuperTable.Cell flex={4}>
            <Code overflowX="hidden" textOverflow="ellipsis">
              {manifestNode.name}
            </Code>
          </SuperTable.Cell>
          <SuperTable.Cell flex={1.5}>
            {status !== "skipped" ? startedAt.toLocaleString() : "-"}
          </SuperTable.Cell>
          <SuperTable.Cell flex={1.5}>
            {status !== "skipped" ? completedAt.toLocaleString() : "-"}
          </SuperTable.Cell>
          <SuperTable.Cell flex={1}>
            {status !== "skipped"
              ? formattedDuration === ""
                ? "< 1 second"
                : formattedDuration
              : "-"}
          </SuperTable.Cell>
          {!isStandalone() && (
            <SuperTable.Cell flex={0.5}>
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
    <Column gap={majorScale(1)} flex={1}>
      <TextInput
        placeholder="Filter nodes by name..."
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSearch(e.target.value)
        }
      />
      <SuperTable>
        <SuperTable.Header>
          <SuperTable.SortableHeaderCell
            flex={0.5}
            sortDirection={sortField === "status" ? sortDir : undefined}
            onSortDirectionChange={(dir) => {
              setSortField("status");
              setSortDir(dir);
            }}
          >
            Status
          </SuperTable.SortableHeaderCell>
          <SuperTable.SortableHeaderCell
            flex={1}
            sortDirection={sortField === "type" ? sortDir : undefined}
            onSortDirectionChange={(dir) => {
              setSortField("type");
              setSortDir(dir);
            }}
          >
            Type
          </SuperTable.SortableHeaderCell>
          <SuperTable.SortableHeaderCell
            flex={4}
            sortDirection={sortField === "name" ? sortDir : undefined}
            onSortDirectionChange={(dir) => {
              setSortField("name");
              setSortDir(dir);
            }}
          >
            Name
          </SuperTable.SortableHeaderCell>
          <SuperTable.SortableHeaderCell
            flex={1.5}
            sortDirection={sortField === "startedAt" ? sortDir : undefined}
            onSortDirectionChange={(dir) => {
              setSortField("startedAt");
              setSortDir(dir);
            }}
          >
            Started at
          </SuperTable.SortableHeaderCell>
          <SuperTable.SortableHeaderCell
            flex={1.5}
            sortDirection={sortField === "completedAt" ? sortDir : undefined}
            onSortDirectionChange={(dir) => {
              setSortField("completedAt");
              setSortDir(dir);
            }}
          >
            Completed at
          </SuperTable.SortableHeaderCell>
          <SuperTable.SortableHeaderCell
            flex={1}
            sortDirection={sortField === "duration" ? sortDir : undefined}
            onSortDirectionChange={(dir) => {
              setSortField("duration");
              setSortDir(dir);
            }}
          >
            Duration
          </SuperTable.SortableHeaderCell>
          {!isStandalone() && (
            <SuperTable.HeaderCell flex={0.5}></SuperTable.HeaderCell>
          )}
        </SuperTable.Header>
        <SuperTable.VirtualBody
          getRowKey={getRowKey}
          rows={visibleNodes}
          rowHeight={40}
          renderRow={renderRow}
        />
      </SuperTable>
    </Column>
  );
}
