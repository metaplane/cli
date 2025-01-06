import { useParams } from "react-router-dom";
import { z } from "zod";

export function useNodeTypeParam() {
  const { nodeType } = z.object({ nodeType: z.string() }).parse(useParams());
  return nodeType;
}

export function useRunIdParam() {
  const { runId } = z.object({ runId: z.string() }).parse(useParams());
  return runId;
}
