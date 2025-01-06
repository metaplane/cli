import { useParams } from "react-router-dom";
import { z } from "zod";
import { ModelDetails } from "./ModelDetails";
import { TestDetails } from "./TestDetails";
import { GenericNodeDetails } from "./GenericNodeDetails";

export function RunPageNodeDetails() {
  const { nodeType, nodeId } = z
    .object({
      nodeType: z.string(),
      nodeId: z.string(),
    })
    .parse(useParams());

  if (nodeType === "model") {
    return <ModelDetails uniqueId={nodeId} />;
  } else if (nodeType === "test") {
    return <TestDetails uniqueId={nodeId} />;
  }

  return <GenericNodeDetails uniqueId={nodeId} />;
}
