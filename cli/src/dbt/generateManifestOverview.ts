import { type DbtNode, type Manifest, readTarget } from "../utils/target.js";

export function generateManifestOverview(targetPath: string) {
  const { manifest } = readTarget(targetPath);
  const dbtStats = computeManifestStats(manifest);
  console.log("Overall Project Stats:");
  console.log(`- Model Count: ${dbtStats.modelCount}`);
  console.log(`- Sources Count: ${dbtStats.sourcesCount}`);
  console.log(`- Seeds Count: ${dbtStats.seedsCount}`);
  console.log(`- Test Count: ${dbtStats.testCount}`);
  console.log(`- Unit Tests Count: ${dbtStats.unitTestsCount}`);
  console.log(
    `- Models with Tests: ${dbtStats.modelsWithTests}/${dbtStats.modelCount}`
  );
  console.log(
    `- Seeds with Tests: ${dbtStats.seedsWithTests}/${dbtStats.seedsCount}`
  );
  console.log(
    `- Sources with Tests: ${dbtStats.sourcesWithTests}/${dbtStats.sourcesCount}`
  );

  console.log(
    `- Important Nodes with Tests: ${
      dbtStats.importantNodes.filter((node) => node.testCount > 0).length
    }/${dbtStats.importantNodes.length}`
  );

  console.log("\nImportant Nodes:");
  dbtStats.importantNodes.forEach((node, index) => {
    console.log(
      `${(index + 1).toString().concat(".").padEnd(4, " ")} Node=${
        node.uniqueId
      } Tests=${node.testCount}`
    );
  });
}

interface DbtImportantNode {
  uniqueId: string;
  name: string;
  resourceType: string;
  testCount: number;
  materialized: string | undefined | null;
  unitTestCount: number;
}

interface DbtStatsResult {
  modelCount: number;
  sourcesCount: number;
  seedsCount: number;
  testCount: number;
  unitTestsCount: number;
  modelsWithTests: number;
  seedsWithTests: number;
  sourcesWithTests: number;
  importantNodes: DbtImportantNode[];
}

interface NodeDegree {
  inDegree: number;
  outDegree: number;
}

interface NodeLineageInfo {
  downstreamTotal: number;
  downstreamExposures: number;
}

interface NodeAndScore {
  nodeId: string;
  score: number;
}

// Constants
const TABLE_TYPES = new Set(["model", "source", "seed"]);
const RELEVANT_LINEAGE_TYPES = new Set(["model", "source", "seed", "exposure"]);

export function computeManifestStats(dbtManifest: Manifest): DbtStatsResult {
  const counts: Record<string, number> = {};
  const modelCoverage = { value: 0 };
  const sourceCoverage = { value: 0 };
  const seedCoverage = { value: 0 };

  getAllDbtNodes(dbtManifest).forEach((dbtNode) => {
    const type = dbtNode.resource_type;
    counts[type] = (counts[type] || 0) + 1;
  });

  Object.entries(dbtManifest.child_map).forEach(([node, children]) => {
    if (children.some((child) => child.startsWith("test."))) {
      if (node.startsWith("model.")) {
        modelCoverage.value++;
      } else if (node.startsWith("source.")) {
        sourceCoverage.value++;
      } else if (node.startsWith("seed.")) {
        seedCoverage.value++;
      }
    }
  });

  const importantNodes = computeCriticality(dbtManifest);

  return {
    modelCount: counts["model"] || 0,
    sourcesCount: counts["source"] || 0,
    seedsCount: counts["seed"] || 0,
    testCount: counts["test"] || 0,
    unitTestsCount: counts["unit_test"] || 0,
    modelsWithTests: modelCoverage.value,
    seedsWithTests: seedCoverage.value,
    sourcesWithTests: sourceCoverage.value,
    importantNodes,
  };
}

function getNodeFromUniqueId(
  manifest: Manifest,
  uniqueId: string
): DbtNode | undefined {
  return (
    manifest.nodes[uniqueId] ??
    manifest.sources[uniqueId] ??
    manifest.exposures[uniqueId] ??
    manifest.unit_tests[uniqueId]
  );
}

function getAllDbtNodes(manifest: Manifest): DbtNode[] {
  return [
    ...Object.values(manifest.nodes),
    ...Object.values(manifest.sources),
    ...Object.values(manifest.unit_tests),
  ];
}

// Main functions
function computeCriticality(manifest: Manifest): DbtImportantNode[] {
  const nodeLineageInfoMap: Map<string, NodeLineageInfo> = new Map();
  const nodeDegreeInfo: Map<string, NodeDegree> = new Map();

  getAllDbtNodes(manifest).forEach((dbtNode) => {
    if (TABLE_TYPES.has(dbtNode.resource_type)) {
      const nodeLineageInfo = nodeDownstreamCount(manifest, dbtNode.unique_id);
      nodeLineageInfoMap.set(dbtNode.unique_id, nodeLineageInfo);
      nodeDegreeInfo.set(dbtNode.unique_id, {
        inDegree: manifest.parent_map[dbtNode.unique_id]?.length || 0,
        outDegree: manifest.child_map[dbtNode.unique_id]?.length || 0,
      });
    }
  });

  const nodeAndLineageScore = calcLineageScores(nodeLineageInfoMap);
  const nodeDegreeScore = calcDegreeScores(nodeDegreeInfo);

  const scores: NodeAndScore[] = [];
  nodeAndLineageScore.forEach((lineageScore, id) => {
    const degreeScore = nodeDegreeScore.get(id) || 0;
    scores.push({ nodeId: id, score: lineageScore * 0.8 + degreeScore * 0.2 });
  });

  scores.sort((a, b) => a.score - b.score);
  const percentileRank = toPercentileRank(scores);

  const numberTableNodes = nodeAndLineageScore.size;
  let topN: number;
  if (numberTableNodes < 30) {
    topN = Math.floor(numberTableNodes / 3);
  } else if (numberTableNodes < 1000) {
    topN = Math.floor(numberTableNodes / 10);
  } else {
    topN = 100;
  }

  const topNIds = Array.from(percentileRank.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key)
    .slice(0, topN);

  return buildImportantNodes(topNIds, manifest);
}

function buildImportantNodes(
  importantNodeIds: string[],
  manifest: Manifest
): DbtImportantNode[] {
  const importantNodes: DbtImportantNode[] = [];

  for (const importantNodeId of importantNodeIds) {
    const node = getNodeFromUniqueId(manifest, importantNodeId);
    if (node) {
      const children = manifest.child_map[node.unique_id] || [];
      importantNodes.push({
        uniqueId: node.unique_id,
        name: node.name || node.unique_id,
        resourceType: node.resource_type,
        testCount: children.filter((v) => v.startsWith("test.")).length,
        materialized: node.materialized,
        unitTestCount: children.filter((v) => v.startsWith("unit_test."))
          .length,
      });
    }
  }

  return importantNodes;
}

function calcDegreeScores(
  nodeDegreeMap: Map<string, NodeDegree>
): Map<string, number> {
  const scoreNodes: NodeAndScore[] = [];
  nodeDegreeMap.forEach((nodeLineageInfo, id) => {
    scoreNodes.push({
      nodeId: id,
      score: nodeLineageInfo.outDegree * 0.8 + nodeLineageInfo.inDegree * 0.2,
    });
  });

  scoreNodes.sort((a, b) => a.score - b.score);
  return toPercentileRank(scoreNodes);
}

function calcLineageScores(
  nodeLineageInfoMap: Map<string, NodeLineageInfo>
): Map<string, number> {
  const scoreNodes: NodeAndScore[] = [];
  nodeLineageInfoMap.forEach((nodeLineageInfo, id) => {
    scoreNodes.push({
      nodeId: id,
      score:
        nodeLineageInfo.downstreamTotal -
        nodeLineageInfo.downstreamExposures +
        nodeLineageInfo.downstreamExposures * 3.0,
    });
  });

  scoreNodes.sort((a, b) => a.score - b.score);
  return toPercentileRank(scoreNodes);
}

// assumes sorted in ascending order with 0 being lowest score
function toPercentileRank(nodeAndScores: NodeAndScore[]): Map<string, number> {
  const scoreNodes = new Map<string, number>();

  nodeAndScores.forEach((value, i) => {
    const percentileRank =
      value.score === 0 ? 0 : (i / (nodeAndScores.length - 1)) * 100;
    scoreNodes.set(value.nodeId, percentileRank);
  });

  return scoreNodes;
}

function nodeDownstreamCount(
  dbtManifest: Manifest,
  startNodeId: string
): NodeLineageInfo {
  const totalDownstream = new Set<string>();
  const downstreamExposures = new Set<string>();
  const stack: string[] = [startNodeId];

  while (stack.length > 0) {
    const currentNode = stack.pop()!;
    // we have already visited
    if (totalDownstream.has(currentNode)) {
      continue;
    }

    totalDownstream.add(currentNode);
    const children = dbtManifest.child_map[currentNode] || [];

    for (const childId of children) {
      const node = dbtManifest.nodes[childId];
      if (node) {
        if (RELEVANT_LINEAGE_TYPES.has(node.resource_type)) {
          stack.push(node.unique_id);
        }

        if (node.resource_type === "exposure") {
          downstreamExposures.add(node.unique_id);
        }
      }
    }
  }

  return {
    downstreamTotal: totalDownstream.size,
    downstreamExposures: downstreamExposures.size,
  };
}
