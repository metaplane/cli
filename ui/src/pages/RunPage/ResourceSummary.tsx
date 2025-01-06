import { majorScale } from "evergreen-ui";
import type { Target } from "../../../../cli/src/utils/target";
import { Row } from "super/src/components/base/layout";
import { useMemo } from "react";
import { ResourceSummaryCard } from "./ResourceSummaryCard";
import {
  getManifestNodesByType,
  resourceTypeDisplayName,
} from "../../utils/target";

export function ResourceSummary({ target }: { target: Target }) {
  const resourcesByType = useMemo(
    () => getManifestNodesByType(target),
    [target]
  );
  return (
    <Row gap={majorScale(3)} justifyContent="center">
      {Object.entries(resourcesByType).map(([resourceType, resources]) => (
        <ResourceSummaryCard
          key={resourceType}
          label={`${resourceTypeDisplayName(resourceType)}s`}
          count={resources.nodes.length}
          testCount={resources.testCount}
        />
      ))}
    </Row>
  );
}
