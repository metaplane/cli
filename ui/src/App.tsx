import { SuperIcon } from "super";
import { Column, Row } from "super/src/components/base/layout";
import { SidebarContainer } from "@mp/ui/src/apps/AuthenticatedApp/Sidebar/SidebarContainer";
import { SidebarRow } from "@mp/ui/src/apps/AuthenticatedApp/Sidebar/SidebarRow";
import {
  SidebarStateContext,
  useSidebarState,
} from "@mp/ui/src/apps/AuthenticatedApp/Sidebar/SidebarStateContext";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { RunsPage } from "./pages/RunsPage/RunsPage";
import { RunPage } from "./pages/RunPage/RunPage";
import { z } from "zod";
import { RunTestsPage } from "./pages/RunTestsPage/RunTestsPage";

// intentional indirection to decouple `RunPage` from `useParams` so
// that it can be rendered directly in standalone mode
function RunPageHandler() {
  const { runId } = z.object({ runId: z.string() }).parse(useParams());
  return <RunPage runId={runId} />;
}

export function App({
  standalone: _standalone = false,
}: {
  standalone?: boolean;
}) {
  const sidebarState = useSidebarState();

  return (
    <SidebarStateContext.Provider value={sidebarState}>
      <Row minHeight="100vh">
        <SidebarContainer>
          {({ size }) => (
            <>
              <SidebarRow
                icon={<SuperIcon name="gears" />}
                to="/runs"
                size={size}
              >
                Runs
              </SidebarRow>
            </>
          )}
        </SidebarContainer>
        <Column flex={1}>
          <Routes>
            <Route path="/runs" element={<RunsPage />} />
            <Route path="/runs/:runId" element={<RunPageHandler />} />
            <Route path="/runs/:runId/tests" element={<RunTestsPage />} />
            <Route path="*" element={<Navigate replace to="/runs" />} />
          </Routes>
        </Column>
      </Row>
    </SidebarStateContext.Provider>
  );
}
