import { PageError, PageLayout } from "@mp/ui/src/components/base";
import { SuperButton, SuperFillSpinner } from "super";
import { Column, Row } from "super/src/components/base/layout";
import { RunCard } from "./RunCard";
import { useMakeRun, useRuns } from "../../data/runs";
import { useCallback } from "react";
import { majorScale } from "evergreen-ui";
import { isStandalone } from "../../utils/standalone";
import { DropZoneCTA } from "../../components/DropZoneCTA/DropZoneCTA";

export function RunsPage() {
  const { isPending, error, data } = useRuns();
  const { mutate: createRun, isPending: isCreatingRun } = useMakeRun();

  const handleCreateRun = useCallback(() => {
    createRun();
  }, [createRun]);

  if (isPending) {
    return <SuperFillSpinner />;
  }

  if (error) {
    return <PageError />;
  }

  return (
    <PageLayout
      title="Runs"
      backgroundColor="white"
      actions={
        !isStandalone() ? (
          <SuperButton
            appearance="primary"
            onClick={handleCreateRun}
            isLoading={isCreatingRun}
          >
            Re-run
          </SuperButton>
        ) : null
      }
    >
      <Column flex={1} maxHeight="100vh" overflowY="scroll" gap={majorScale(3)}>
        {data.map((run) => (
          <RunCard key={run.id} run={run} />
        ))}
        <Row justifyContent="center">
          <DropZoneCTA
            justifyContent="center"
            paddingX={majorScale(4)}
            paddingY={majorScale(8)}
          />
        </Row>
      </Column>
    </PageLayout>
  );
}
