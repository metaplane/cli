import { Column } from "super/src/components/base/layout";
import { useNodeTypeParam } from "./params";
import { RunPageAllNodes } from "./RunPageAllNodes";
import { RunPageModelNodes } from "./RunPageModelNodes";
import { RunPageTestNodes } from "./RunPageTestNodes";
import { majorScale } from "evergreen-ui";
import { NodeTable } from "./NodeTable";
import { useRunContext } from "../../data/runs";

export function RunPageNodeType() {
  const runContext = useRunContext();
  const nodeType = useNodeTypeParam();
  if (nodeType === "all") {
    return <RunPageAllNodes />;
  } else if (nodeType === "model") {
    return <RunPageModelNodes />;
  } else if (nodeType === "test") {
    return <RunPageTestNodes />;
  }
  return (
    <Column flex={1} maxHeight="100vh" overflowY="scroll" gap={majorScale(3)}>
      <NodeTable
        unifiedRunManifest={runContext.unifiedRunManifest}
        nodeType={nodeType}
      />
    </Column>
  );
}
