import { SuperIcon, SuperTable, SuperTooltip } from "super";
import { useCallback, useMemo, useState } from "react";
import {
  type UnifiedRunManifest,
  type UnifiedRunManifestNode,
} from "../../utils/target";
import {
  NEUTRAL_400,
  RED_400,
  GREEN_600,
  RED_600,
} from "super/src/tokens/colors";
import { majorScale, Text, TextInput } from "evergreen-ui";
import { Column } from "super/src/components/base/layout";
import { useFuzzyFilter } from "@mp/ui/src/utils/FuzzyFilter";
import { Link } from "@mp/ui/src/components/base/Link/Link";
import { expectNever } from "super/src/utils/type/Never";
import { parseTestNode } from "../../utils/tests";

export function TestsTable({
  unifiedRunManifest,
}: {
  unifiedRunManifest: UnifiedRunManifest;
}) {
  const [sortField, setSortField] = useState<
    "status" | "testType" | "resource" | "column"
  >("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");

  const getRowKey = useCallback(
    (node: UnifiedRunManifestNode) => node.uniqueId,
    []
  );
  const testNodes = useMemo(
    () => unifiedRunManifest.nodesByResourceType.test ?? [],
    [unifiedRunManifest]
  );
  const sortedRows = useMemo(() => {
    return [...testNodes].sort((a, b) => {
      const manifestNodeA = a.manifest;
      const manifestNodeB = b.manifest;
      const runResultNodeA = a.runResult;
      const runResultNodeB = b.runResult;
      const runResultNodeAStatus = runResultNodeA?.status ?? "skipped";
      const runResultNodeBStatus = runResultNodeB?.status ?? "skipped";

      const testedNodeIdA = manifestNodeA.depends_on?.nodes?.[0];
      const testedNodeIdB = manifestNodeB.depends_on?.nodes?.[0];

      let comparison: number;
      switch (sortField) {
        case "status":
          comparison = runResultNodeAStatus.localeCompare(runResultNodeBStatus);
          break;
        case "resource": {
          const resourceA = testedNodeIdA ?? "";
          const resourceB = testedNodeIdB ?? "";
          comparison = resourceA.localeCompare(resourceB);
          break;
        }
        case "column": {
          const columnA = manifestNodeA.column_name ?? "";
          const columnB = manifestNodeB.column_name ?? "";
          comparison = columnA.localeCompare(columnB);
          break;
        }
        case "testType": {
          const parsedTestNodeA = parseTestNode(manifestNodeA);
          const parsedTestNodeB = parseTestNode(manifestNodeB);
          comparison = (parsedTestNodeA?.testType ?? "").localeCompare(
            parsedTestNodeB?.testType ?? ""
          );
          break;
        }
        default: {
          expectNever(sortField);
          comparison = 0;
        }
      }

      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [testNodes, sortField, sortDir]);

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
      const testedNodeId = manifestNode.depends_on?.nodes?.[0];
      const testedNode = testedNodeId
        ? unifiedRunManifest.nodesByUniqueId[testedNodeId]
        : null;
      const parsedTestNode = parseTestNode(manifestNode);

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
            <Text>{parsedTestNode?.testType ?? "-"}</Text>
          </SuperTable.Cell>
          <SuperTable.Cell flex={1}>
            <pre>{testedNode?.manifest.name ?? "-"}</pre>
          </SuperTable.Cell>
          <SuperTable.Cell flex={1}>
            <pre>{manifestNode.column_name ?? "-"}</pre>
          </SuperTable.Cell>
        </SuperTable.NavRow>
      );
    },
    [unifiedRunManifest]
  );
  return (
    <Column gap={majorScale(1)} flex={1}>
      <TextInput
        placeholder="Filter tests by name..."
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
            sortDirection={sortField === "testType" ? sortDir : undefined}
            onSortDirectionChange={(dir) => {
              setSortField("testType");
              setSortDir(dir);
            }}
          >
            Test Type
          </SuperTable.SortableHeaderCell>
          <SuperTable.SortableHeaderCell
            flex={1}
            sortDirection={sortField === "resource" ? sortDir : undefined}
            onSortDirectionChange={(dir) => {
              setSortField("resource");
              setSortDir(dir);
            }}
          >
            Resource
          </SuperTable.SortableHeaderCell>
          <SuperTable.SortableHeaderCell
            flex={1}
            sortDirection={sortField === "column" ? sortDir : undefined}
            onSortDirectionChange={(dir) => {
              setSortField("column");
              setSortDir(dir);
            }}
          >
            Column
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
