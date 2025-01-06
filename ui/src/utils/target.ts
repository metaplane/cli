import { indexBy } from "ramda";
import type { Target } from "../../../cli/src/utils/target";

export function resolveManifestNode(
  manifest: Target["manifest"],
  uniqueId: string
) {
  return (
    manifest.nodes[uniqueId] ??
    manifest.sources[uniqueId] ??
    manifest.exposures[uniqueId] ??
    manifest.unit_tests[uniqueId]
  );
}

type RunResultNode = Target["runResults"]["results"][number];
type ManifestNode = Target["manifest"]["nodes"][string];

export function getManifestNodesByType(target: Target) {
  const result: Record<string, { nodes: ManifestNode[]; testCount: number }> =
    {};
  const testedNodes = new Set<string>();

  for (const manifestNode of Object.values(target.manifest.nodes)) {
    result[manifestNode.resource_type] = result[manifestNode.resource_type] || {
      nodes: [],
      testCount: 0,
    };
    result[manifestNode.resource_type].nodes.push(manifestNode);
    if (manifestNode.resource_type === "test") {
      for (const depId of manifestNode.depends_on?.nodes || []) {
        const testedNode = resolveManifestNode(target.manifest, depId);
        if (testedNode && !testedNodes.has(depId)) {
          (
            result[testedNode.resource_type] || {
              nodes: [],
              testCount: 0,
            }
          ).testCount++;
          testedNodes.add(depId);
        }
      }
    }
  }

  return result;
}

export function resourceTypeDisplayName(resourceType: string) {
  return resourceType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export type UnifiedRunManifestNode = {
  uniqueId: string;
  manifest: ManifestNode;
  runResult: RunResultNode | null;
  tests: UnifiedRunManifestNode[];
};

export type ExecutedRunManifestNode = UnifiedRunManifestNode & {
  runResult: RunResultNode;
};

export type UnifiedRunManifest = {
  target: Target;
  nodes: UnifiedRunManifestNode[];
  nodesByUniqueId: Record<string, UnifiedRunManifestNode>;
  nodesByResourceType: Record<string, UnifiedRunManifestNode[]>;
  executedNodesByUniqueId: Record<string, ExecutedRunManifestNode>;
  executedNodesByResourceType: Record<string, ExecutedRunManifestNode[]>;
};

export function makeUnifiedRunManifest(target: Target): UnifiedRunManifest {
  const nodes: UnifiedRunManifestNode[] = [];
  const nodesByUniqueId: Record<string, UnifiedRunManifestNode> = {};
  const nodesByResourceType: Record<string, UnifiedRunManifestNode[]> = {};
  const executedNodesByUniqueId: Record<string, ExecutedRunManifestNode> = {};
  const executedNodesByResourceType: Record<string, ExecutedRunManifestNode[]> =
    {};

  const runResultNodesByUniqueId = indexBy(
    (result) => result.unique_id,
    target.runResults.results
  );

  const allNodes = [
    ...Object.values(target.manifest.nodes),
    ...Object.values(target.manifest.sources),
    ...Object.values(target.manifest.exposures),
    ...Object.values(target.manifest.unit_tests),
  ];

  for (const manifestNode of allNodes) {
    const uniqueId = manifestNode.unique_id;
    const runResultNode = runResultNodesByUniqueId[uniqueId];
    const unifiedNode = {
      uniqueId,
      manifest: manifestNode,
      runResult: runResultNode,
      tests: [],
    };

    nodesByUniqueId[uniqueId] = unifiedNode;

    nodesByResourceType[manifestNode.resource_type] =
      nodesByResourceType[manifestNode.resource_type] || [];
    nodesByResourceType[manifestNode.resource_type].push(unifiedNode);

    if (runResultNode) {
      executedNodesByUniqueId[uniqueId] = unifiedNode;
      executedNodesByResourceType[manifestNode.resource_type] =
        executedNodesByResourceType[manifestNode.resource_type] || [];
      executedNodesByResourceType[manifestNode.resource_type].push(unifiedNode);
    }

    nodes.push(unifiedNode);
  }

  // fill in test nodes to make it easier to go from model node -> test nodes
  for (const node of nodes) {
    if (node.manifest.resource_type === "test") {
      for (const depId of node.manifest.depends_on?.nodes || []) {
        const testedNode = nodesByUniqueId[depId];
        if (testedNode) {
          testedNode.tests.push(node);
        }
      }
    }
  }

  return {
    target,
    nodes,
    nodesByUniqueId,
    nodesByResourceType,
    executedNodesByUniqueId,
    executedNodesByResourceType,
  };
}
