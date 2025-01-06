import { majorScale } from "evergreen-ui";
import { Column } from "super/src/components/base/layout";
import { ResourceSummary } from "./ResourceSummary";
import { SuperCodeEditor } from "super/src/SuperCodeEditor/SuperCodeEditor";
import { NodeTable } from "./NodeTable";
import { useRunContext } from "../../data/runs";

export function RunPageAllNodes() {
  const run = useRunContext();
  return (
    <Column flex={1} maxHeight="100vh" overflowY="scroll" gap={majorScale(3)}>
      <ResourceSummary target={run.unifiedRunManifest.target} />
      {run.response.stdout && (
        <SuperCodeEditor
          readOnly
          language="shell-session"
          value={run.response.stdout}
          maxHeight={200}
        />
      )}
      <NodeTable unifiedRunManifest={run.unifiedRunManifest} />
    </Column>
  );
}
