import { SuperIcon } from "super";
import { Column, Row } from "super/src/components/base/layout";
import { SidebarContainer } from "@mp/ui/src/apps/AuthenticatedApp/Sidebar/SidebarContainer";
import { SidebarRow } from "@mp/ui/src/apps/AuthenticatedApp/Sidebar/SidebarRow";
import {
  SidebarStateContext,
  useSidebarState,
} from "@mp/ui/src/apps/AuthenticatedApp/Sidebar/SidebarStateContext";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { RunsPage } from "./pages/RunsPage/RunsPage";
import { RunPage } from "./pages/RunPage/RunPage";
import { RunPageOverview } from "./pages/RunPage/RunPageOverview";
import { RunPageNodeType } from "./pages/RunPage/RunPageNodeType";
import { RunPageNodeDetails } from "./pages/RunPage/RunPageNodeDetails";
import { RunPagePerformance } from "./pages/RunPage/RunPagePerformance";
import { FileDropZone } from "./components/FileDropZone/FileDropZone";
import { useState, useCallback } from "react";
import {
  DbtArtifactCollector,
  type DbtArtifactFileState,
} from "./components/DbtArtifactCollector/DbtArtifactCollector";
import { minorScale } from "evergreen-ui";
import type { Target } from "../../cli/src/utils/target";
import { useQueryClient } from "@tanstack/react-query";
import { RUNS_QUERY_KEY } from "./data/runs";
import type { RunResponse } from "../../cli/src/dbt/ui/api";
import { DropZoneCTA } from "./components/DropZoneCTA/DropZoneCTA";

export function App({
  standalone: _standalone = false,
}: {
  standalone?: boolean;
}) {
  const location = useLocation();
  const sidebarState = useSidebarState();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [manualArtifactFiles, setManualArtifactFiles] =
    useState<DbtArtifactFileState | null>(null);
  const [usingManualArtifacts, setUsingManualArtifacts] = useState(false);

  const handleDrop = useCallback((file: File) => {
    if (file.name === "manifest.json") {
      setManualArtifactFiles((prev) => ({ ...prev, manifest: file }));
    } else if (file.name === "run_results.json") {
      setManualArtifactFiles((prev) => ({ ...prev, runResults: file }));
    }
  }, []);

  const handleArtifactsReady = useCallback(
    (target: {
      runResults: Target["runResults"];
      manifest: Target["manifest"];
    }) => {
      const id = target.runResults.metadata.invocation_id;
      const run = {
        id,
        status: "completed",
        target: target,
        commitSha: null,
      };
      queryClient.setQueryData(RUNS_QUERY_KEY, (runs: RunResponse[]) => {
        return [run, ...runs];
      });
      queryClient.setQueryData(["runs", run.id], run);
      navigate(`/runs/${run.id}`);
      setManualArtifactFiles(null);
      setUsingManualArtifacts(true);
    },
    []
  );

  return (
    <SidebarStateContext.Provider value={sidebarState}>
      <FileDropZone
        fileNameAllowList={["manifest.json", "run_results.json"]}
        onDrop={handleDrop}
      >
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
            {manualArtifactFiles ? (
              <DbtArtifactCollector
                files={manualArtifactFiles}
                onCancel={() => setManualArtifactFiles(null)}
                onReady={handleArtifactsReady}
              />
            ) : (
              <Routes>
                <Route path="/runs" element={<RunsPage />} />
                <Route path="/runs/:runId" element={<RunPage />}>
                  <Route path="overview" element={<RunPageOverview />}>
                    <Route path="" element={<Navigate replace to="all" />} />
                    <Route path=":nodeType" element={<RunPageNodeType />} />
                    <Route
                      path=":nodeType/:nodeId"
                      element={<RunPageNodeDetails />}
                    />
                  </Route>
                  <Route path="performance" element={<RunPagePerformance />} />
                  <Route
                    path=""
                    element={<Navigate replace to="overview/all" />}
                  />
                </Route>
                <Route path="*" element={<Navigate replace to="/runs" />} />
              </Routes>
            )}
          </Column>
          {!manualArtifactFiles &&
            !usingManualArtifacts &&
            location.pathname !== "/runs" && (
              <DropZoneCTA
                position="absolute"
                top={minorScale(5)}
                right={minorScale(3)}
              />
            )}
        </Row>
      </FileDropZone>
    </SidebarStateContext.Provider>
  );
}
