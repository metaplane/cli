import { Column } from "super/src/components/base/layout";
import { useRunContext } from "../../data/runs";
import { TestsTable } from "./TestsTable";
import { majorScale } from "evergreen-ui";

export function RunPageTestNodes() {
  const run = useRunContext();
  return (
    <Column flex={1} maxHeight="100vh" overflowY="scroll" gap={majorScale(3)}>
      <TestsTable unifiedRunManifest={run.unifiedRunManifest} />
    </Column>
  );
}
