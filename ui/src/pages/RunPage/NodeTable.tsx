import { SuperIcon, SuperIconButton, SuperTable, SuperTooltip } from "super";
import { useCallback, useMemo, useState } from "react";
import {
  min,
  max,
  intervalToDuration,
  formatDuration,
  type Duration,
} from "date-fns";
import { useRunContext, useRunTest } from "../../data/runs";
import { useNavigate } from "react-router-dom";
import { isStandalone } from "../../utils/standalone";
import {
  resourceTypeDisplayName,
  type UnifiedRunManifest,
  type UnifiedRunManifestNode,
} from "../../utils/target";
import { NEUTRAL_400, RED_600, GREEN_600 } from "super/src/tokens/colors";
import { majorScale, Text, TextInput } from "evergreen-ui";
import { Column } from "super/src/components/base/layout";
import { useFuzzyFilter } from "@mp/ui/src/utils/FuzzyFilter";
import { Link } from "@mp/ui/src/components/base/Link/Link";
import { makeNodeDetailsUrl } from "../../utils/navigate";

export function NodeTable({
  unifiedRunManifest,
  nodeType,
}: {
  unifiedRunManifest: UnifiedRunManifest;
  nodeType?: string;
}) {
  const runContext = useRunContext();
  const [sortField, setSortField] = useState<
    "status" | "type" | "name" | "startedAt" | "completedAt" | "duration"
  >("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { mutate: runTest } = useRunTest();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const getRowKey = useCallback(
    (node: UnifiedRunManifestNode) => node.uniqueId,
    []
  );

  const sortedRows = useMemo(() => {
    const rows = nodeType
      ? unifiedRunManifest.nodesByResourceType[nodeType]
      : unifiedRunManifest.nodes;

    return [...rows].sort((a, b) => {
      const manifestNodeA = a.manifest;
      const manifestNodeB = b.manifest;
      const startedAtA =
        a.runResult && a.runResult.status !== "skipped"
          ? min(a.runResult.timing.map((t) => t.started_at))
          : null;
      const startedAtB =
        b.runResult && b.runResult.status !== "skipped"
          ? min(b.runResult.timing.map((t) => t.started_at))
          : null;
      const completedAtA =
        a.runResult && a.runResult.status !== "skipped"
          ? max(a.runResult.timing.map((t) => t.completed_at))
          : null;
      const completedAtB =
        b.runResult && b.runResult.status !== "skipped"
          ? max(b.runResult.timing.map((t) => t.completed_at))
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
          comparison =
            startedAtA?.getTime() ?? 0 - (startedAtB?.getTime() ?? 0);
          break;
        case "completedAt":
          comparison =
            (completedAtA?.getTime() ?? 0) - (completedAtB?.getTime() ?? 0);
          break;
        case "duration": {
          const durationA =
            (completedAtA?.getTime() ?? 0) - (startedAtA?.getTime() ?? 0);
          const durationB =
            (completedAtB?.getTime() ?? 0) - (startedAtB?.getTime() ?? 0);
          comparison = durationA - durationB;
          break;
        }
        default:
          comparison = 0;
      }

      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [unifiedRunManifest, sortField, sortDir, nodeType]);

  const visibleNodes = useFuzzyFilter(
    {
      items: sortedRows,
      keyFn: (node) => node.uniqueId,
    },
    search
  );

  const renderRow = useCallback(
    (node: UnifiedRunManifestNode) => {
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
        <SuperTable.NavRow
          is={Link}
          to={makeNodeDetailsUrl(runContext, node.uniqueId)}
        >
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
          {nodeType === undefined && (
            <SuperTable.Cell flex={1}>
              <Text>{resourceTypeDisplayName(manifestNode.resource_type)}</Text>
            </SuperTable.Cell>
          )}
          <SuperTable.Cell flex={4}>
            <pre>{manifestNode.name}</pre>
          </SuperTable.Cell>
          <SuperTable.Cell flex={1.5}>
            <Text>{startedAt?.toLocaleString() ?? "-"}</Text>
          </SuperTable.Cell>
          <SuperTable.Cell flex={1.5}>
            <Text>{completedAt?.toLocaleString() ?? "-"}</Text>
          </SuperTable.Cell>
          <SuperTable.Cell flex={1}>
            <Text>
              {formattedDuration === "" ? "< 1 second" : formattedDuration}
            </Text>
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
        </SuperTable.NavRow>
      );
    },
    [navigate, runTest, runContext, nodeType]
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
          {nodeType === undefined && (
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
          )}
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
