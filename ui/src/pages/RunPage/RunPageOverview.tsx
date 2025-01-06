import { Column, Row } from "super/src/components/base/layout";
import { majorScale } from "evergreen-ui";
import { RunNavSidebar } from "./RunNavSidebar";
import { Outlet } from "react-router-dom";

export function RunPageOverview() {
  return (
    <Row width="100%" gap={majorScale(3)}>
      <RunNavSidebar />
      <Column
        flex={1}
        maxHeight="100vh"
        overflowY="scroll"
        gap={majorScale(3)}
        justifyContent="flex-start"
      >
        <Outlet />
      </Column>
    </Row>
  );
}
