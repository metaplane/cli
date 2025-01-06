import type { RunContext } from "../data/runs";

export function makeNodeDetailsUrl(ctx: RunContext, uniqueId: string) {
  const node = ctx.unifiedRunManifest.nodesByUniqueId[uniqueId];
  if (!node) {
    return `/run/${ctx.response.id}/overview`;
  }
  return `/runs/${ctx.response.id}/overview/${node.manifest.resource_type}/${node.uniqueId}`;
}
