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
