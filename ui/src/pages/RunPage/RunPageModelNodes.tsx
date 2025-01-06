import { Column } from "super/src/components/base/layout";
import { majorScale } from "evergreen-ui";
import { useRunContext } from "../../data/runs";
import { ModelsTable } from "./ModelsTable";

export function RunPageModelNodes() {
  const run = useRunContext();
  return (
    <Column flex={1} maxHeight="100vh" overflowY="scroll" gap={majorScale(3)}>
      <ModelsTable unifiedRunManifest={run.unifiedRunManifest} />
    </Column>
  );
}
