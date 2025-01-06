import { SuperIcon, SuperTable, SuperTooltip } from "super";
import { useCallback, useMemo, useState } from "react";
import {
  min,
  max,
  intervalToDuration,
  formatDuration,
  type Duration,
} from "date-fns";
import {
  type UnifiedRunManifest,
  type UnifiedRunManifestNode,
} from "../../utils/target";
import { NEUTRAL_400, RED_600, GREEN_600 } from "super/src/tokens/colors";
import { majorScale, Text, TextInput } from "evergreen-ui";
import { Column } from "super/src/components/base/layout";
import { useFuzzyFilter } from "@mp/ui/src/utils/FuzzyFilter";
import { Link } from "@mp/ui/src/components/base/Link/Link";
import { expectNever } from "super/src/utils/type/Never";

export function ModelsTable({
  unifiedRunManifest,
}: {
  unifiedRunManifest: UnifiedRunManifest;
}) {
  const [sortField, setSortField] = useState<
    "status" | "name" | "tests" | "duration"
  >("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");

  const getRowKey = useCallback(
    (node: UnifiedRunManifestNode) => node.uniqueId,
    []
  );
  const modelNodes = useMemo(
    () => unifiedRunManifest.nodesByResourceType.model ?? [],
    [unifiedRunManifest]
  );
  const sortedRows = useMemo(() => {
    return [...modelNodes].sort((a, b) => {
      const manifestNodeA = a.manifest;
      const manifestNodeB = b.manifest;
      const runResultNodeA = a.runResult;
      const runResultNodeB = b.runResult;

      const startedAtA =
        runResultNodeA && runResultNodeA.status !== "skipped"
          ? min(runResultNodeA.timing.map((t) => t.started_at))
          : null;
      const startedAtB =
        runResultNodeB && runResultNodeB.status !== "skipped"
          ? min(runResultNodeB.timing.map((t) => t.started_at))
          : null;
      const completedAtA =
        runResultNodeA && runResultNodeA.status !== "skipped"
          ? max(runResultNodeA.timing.map((t) => t.completed_at))
          : null;
      const completedAtB =
        runResultNodeB && runResultNodeB.status !== "skipped"
          ? max(runResultNodeB.timing.map((t) => t.completed_at))
          : null;
      const statusA = a.runResult?.status ?? "skipped";
      const statusB = b.runResult?.status ?? "skipped";

      let comparison: number;
      switch (sortField) {
        case "status":
          // Put skipped nodes at the end by handling them specially
          if (statusA === "skipped" && statusB !== "skipped") {
            comparison = 1;
          } else if (statusA !== "skipped" && statusB === "skipped") {
            comparison = -1;
          } else {
            comparison = statusA.localeCompare(statusB);
          }
          break;
        case "name":
          comparison = (manifestNodeA.name ?? "").localeCompare(
            manifestNodeB.name ?? ""
          );
          break;
        case "duration": {
          const durationA =
            (completedAtA?.getTime() ?? 0) - (startedAtA?.getTime() ?? 0);
          const durationB =
            (completedAtB?.getTime() ?? 0) - (startedAtB?.getTime() ?? 0);
          comparison = durationA - durationB;
          break;
        }
        case "tests": {
          const testsA = a.tests.length;
          const testsB = b.tests.length;
          comparison = testsA - testsB;
          break;
        }
        default: {
          expectNever(sortField);
          comparison = 0;
        }
      }

      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [modelNodes, sortField, sortDir]);

  const visibleNodes = useFuzzyFilter(
    {
      items: sortedRows,
      keyFn: (node) => node.uniqueId,
    },
    search
  );

  const renderRow = useCallback((node: UnifiedRunManifestNode) => {
    const manifestNode = node.manifest;
    const status = node.runResult?.status ?? "skipped";
    const startedAt =
      node.runResult?.timing && node.runResult.status !== "skipped"
        ? min(node.runResult.timing.map((t) => t.started_at))
        : null;
    const completedAt =
      node.runResult?.timing && node.runResult.status !== "skipped"
        ? max(node.runResult.timing.map((t) => t.completed_at))
        : null;
    let duration: Duration | undefined;
    let formattedDuration = "-";
    if (startedAt && completedAt) {
      duration = intervalToDuration({
        start: startedAt,
        end: completedAt,
      });
      formattedDuration = formatDuration(duration, { zero: true });
    }
    return (
      <SuperTable.NavRow is={Link} to={node.uniqueId}>
        <SuperTable.Cell flex={0.5}>
          <SuperTooltip content={status}>
            {status === "success" || status === "pass" ? (
              <SuperIcon
                name="check-circle"
                color={GREEN_600}
                type="solid"
                fontSize={18}
              />
            ) : status === "fail" ? (
              <SuperIcon
                name="circle-xmark"
                color={RED_600}
                type="solid"
                fontSize={18}
              />
            ) : status === "error" ? (
              <SuperIcon
                name="circle-exclamation"
                color={RED_600}
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
        <SuperTable.Cell flex={4}>
          <pre>{manifestNode.name}</pre>
        </SuperTable.Cell>
        <SuperTable.Cell flex={1}>
          <Text>{node.tests.length}</Text>
        </SuperTable.Cell>
        <SuperTable.Cell flex={1}>
          <Text>
            {status !== "skipped"
              ? formattedDuration === ""
                ? "< 1 second"
                : formattedDuration
              : "-"}
          </Text>
        </SuperTable.Cell>
      </SuperTable.NavRow>
    );
  }, []);
  return (
    <Column gap={majorScale(1)} flex={1}>
      <TextInput
        placeholder="Filter models by name..."
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
            flex={1}
            sortDirection={sortField === "tests" ? sortDir : undefined}
            onSortDirectionChange={(dir) => {
              setSortField("tests");
              setSortDir(dir);
            }}
          >
            Tests
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
