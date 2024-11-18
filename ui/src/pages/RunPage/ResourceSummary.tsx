import { majorScale } from "evergreen-ui";
import type { Target } from "../../../../cli/src/utils/target";
import { Row } from "super/src/components/base/layout";
import { useMemo } from "react";
import { ResourceSummaryCard } from "./ResourceSummaryCard";

function displayName(resourceType: string) {
  return resourceType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

type Node = Target["manifest"]["nodes"][string];

export function ResourceSummary({ target }: { target: Target }) {
  const resourcesByType = useMemo(() => {
    const result: Record<string, { nodes: Node[]; testCount: number }> = {};
    const testedNodes = new Set<string>();

    for (const node of Object.values(target.manifest.nodes)) {
      result[node.resource_type] = result[node.resource_type] || {
        nodes: [],
        testCount: 0,
      };
      result[node.resource_type].nodes.push(node);
      if (node.resource_type === "test") {
        for (const depId of node.depends_on?.nodes || []) {
          const testedNode = target.manifest.nodes[depId];
          if (testedNode && !testedNodes.has(depId)) {
            result[testedNode.resource_type].testCount++;
            testedNodes.add(depId);
          }
        }
      }
    }

    return result;
  }, [target]);

  return (
    <Row gap={majorScale(3)} justifyContent="center">
      {Object.entries(resourcesByType).map(([resourceType, resources]) => (
        <ResourceSummaryCard
          key={resourceType}
          label={`${displayName(resourceType)}s`}
          count={resources.nodes.length}
          testCount={resources.testCount}
        />
      ))}
    </Row>
  );
}
