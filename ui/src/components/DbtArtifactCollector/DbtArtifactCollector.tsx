import { Link, Text, majorScale, minorScale } from "evergreen-ui";
import { SuperFillBox, SuperIcon } from "super";
import {
  ManifestSchema,
  RunResultsSchema,
  type Target,
} from "../../../../cli/src/utils/target";
import { Column, Row } from "super/src/components/base/layout";
import { PageCard } from "@mp/ui/src/components/base";
import {
  GREEN_600,
  NEUTRAL_050,
  NEUTRAL_400,
  RED_600,
} from "@mp/ui/src/tokens/colors";
import { H1, H4 } from "super/src/components/base/type";
import { useEffect, useState } from "react";
import type { ZodError } from "zod";

export type DbtArtifactFileState =
  | {
      runResults: File;
    }
  | {
      manifest: File;
    }
  | {
      runResults: File;
      manifest: File;
    };

type DbtArtifactState<T extends Target["manifest"] | Target["runResults"]> =
  | {
      type: "missing";
    }
  | {
      type: "invalid";
      error: ZodError;
    }
  | {
      type: "valid";
      artifact: T;
    };

type DbtArtifactsState =
  | {
      type: "ready";
      correlated: boolean;
      runResults: DbtArtifactState<Target["runResults"]> & {
        type: "valid";
      };
      manifest: DbtArtifactState<Target["manifest"]> & {
        type: "valid";
      };
    }
  | {
      type: "pending";
      runResults: DbtArtifactState<Target["runResults"]>;
      manifest: DbtArtifactState<Target["manifest"]>;
    };

type DbtArtifactCollectorProps = {
  files: DbtArtifactFileState;
  onReady: (target: {
    runResults: Target["runResults"];
    manifest: Target["manifest"];
  }) => void;
  onCancel: () => void;
};

async function makeDbtArtifactsState(
  files: DbtArtifactFileState
): Promise<DbtArtifactsState> {
  let runResults: DbtArtifactState<Target["runResults"]> = {
    type: "missing" as const,
  };
  let manifest: DbtArtifactState<Target["manifest"]> = {
    type: "missing" as const,
  };

  if ("runResults" in files) {
    const raw = JSON.parse(await files.runResults.text());
    const parsed = RunResultsSchema.safeParse(raw);
    if (parsed.success) {
      runResults = {
        type: "valid" as const,
        artifact: parsed.data,
      };
    } else {
      runResults = { type: "invalid" as const, error: parsed.error };
    }
  }

  if ("manifest" in files) {
    const parsed = ManifestSchema.safeParse(
      JSON.parse(await files.manifest.text())
    );
    if (parsed.success) {
      manifest = {
        type: "valid" as const,
        artifact: parsed.data,
      };
    } else {
      manifest = { type: "invalid" as const, error: parsed.error };
    }
  }

  if (runResults.type === "valid" && manifest.type === "valid") {
    return {
      type: "ready",
      correlated:
        runResults.artifact.metadata.invocation_id ===
        manifest.artifact.metadata.invocation_id,
      runResults,
      manifest,
    };
  }

  return {
    type: "pending",
    runResults,
    manifest,
  };
}

function StatusIcon({
  statusType,
}: {
  statusType: DbtArtifactState<any>["type"];
}) {
  switch (statusType) {
    case "missing":
      return <SuperIcon name="circle-minus" color={NEUTRAL_400} type="solid" />;
    case "invalid":
      return <SuperIcon name="circle-xmark" color={RED_600} type="solid" />;
    case "valid":
      return <SuperIcon name="circle-check" color={GREEN_600} type="solid" />;
    default: {
      statusType satisfies never;
      throw new Error();
    }
  }
}

function DbtArtifactStatus({
  name,
  artifactState,
}: {
  name: string;
  artifactState: DbtArtifactState<any>;
}) {
  return (
    <Column gap={minorScale(1)}>
      <H4>
        <Row centerY gap={minorScale(1)}>
          <StatusIcon statusType={artifactState.type} />
          <pre style={{ display: "inline" }}>{name}</pre>
        </Row>
      </H4>
    </Column>
  );
}

export function DbtArtifactCollector({
  files,
  onCancel,
  onReady,
}: DbtArtifactCollectorProps) {
  const [artifactsState, setArtifactsState] = useState<DbtArtifactsState>({
    type: "pending",
    runResults: { type: "missing" },
    manifest: { type: "missing" },
  });

  useEffect(() => {
    makeDbtArtifactsState(files).then((state) => {
      setArtifactsState(state);
      if (state.type === "ready" && state.correlated) {
        onReady({
          runResults: state.runResults.artifact,
          manifest: state.manifest.artifact,
        });
      }
    });
  }, [files]);

  return (
    <Column flex={1}>
      <SuperIcon
        position="absolute"
        fontSize={25}
        name="xmark"
        top={majorScale(3)}
        right={majorScale(3)}
        color={NEUTRAL_400}
        onClick={onCancel}
        cursor="pointer"
      />
      <SuperFillBox>
        <PageCard
          display="flex"
          flexDirection="column"
          width={450}
          paddingY={majorScale(8)}
          paddingX={majorScale(5)}
          gap={majorScale(2)}
          alignItems="center"
          border={`1px dashed ${NEUTRAL_400}`}
          borderRadius={8}
          backgroundColor={NEUTRAL_050}
        >
          <Column alignItems="center" gap={majorScale(1)}>
            <SuperIcon
              fontSize={majorScale(6)}
              name="upload"
              color={NEUTRAL_400}
            />
            <H1>Upload dbt artifacts</H1>
          </Column>
          <Text fontSize={14} textAlign="center">
            Drag and drop your dbt artifacts to visualize the results. Your
            artifacts will only be used locally in your browser and never
            persisted.
          </Text>
          <Row gap={majorScale(3)} width="fit-content">
            <DbtArtifactStatus
              name="manifest.json"
              artifactState={artifactsState.manifest}
            />
            <DbtArtifactStatus
              name="run_results.json"
              artifactState={artifactsState.runResults}
            />
          </Row>
          {(artifactsState.runResults.type === "invalid" ||
            artifactsState.manifest.type === "invalid") && (
            <Column gap={majorScale(2)} alignItems="center">
              <Text textAlign="center">
                Uh oh. It looks like we had some trouble parsing your artifacts.
              </Text>
              {artifactsState.runResults.type === "invalid" && (
                <pre>{artifactsState.runResults.error.message}</pre>
              )}
              {artifactsState.manifest.type === "invalid" && (
                <pre>{artifactsState.manifest.error.message}</pre>
              )}
              <Text textAlign="center">
                If you have a minute, please{" "}
                <Link
                  href="https://github.com/metaplane/cli/issues/new"
                  target="_blank"
                >
                  open a Github issue
                </Link>
                .
              </Text>
            </Column>
          )}
          {artifactsState.type === "ready" && !artifactsState.correlated && (
            <Column gap={majorScale(2)} alignItems="center">
              <Text textAlign="center">
                Hmm. It looks like your{" "}
                <pre style={{ display: "inline" }}>manifest.json</pre> and{" "}
                <pre style={{ display: "inline" }}>run_results.json</pre>{" "}
                aren&apos;t from the same dbt run.
              </Text>
              <Text textAlign="center">
                Try re-uploading them while making sure that both files were
                generated by the same run.
              </Text>
            </Column>
          )}
        </PageCard>
      </SuperFillBox>
    </Column>
  );
}
