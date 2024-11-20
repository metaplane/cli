import { Column, Row } from "super/src/components/base/layout";
import type { Target } from "../../../../cli/src/utils/target";
import { resolveManifestNode } from "../../utils/manifest";
import { SuperCodeEditor, SuperIcon, SuperStatusPill } from "super";
import { GREEN_400, NEUTRAL_200, RED_600 } from "super/src/tokens/colors";
import { majorScale, minorScale, Text } from "evergreen-ui";
import { SuperFillBox } from "super";
import { PageCard } from "@mp/ui/src/components/base";
import { NEUTRAL_700 } from "super/src/tokens/colors";
import { H1, H4 } from "super/src/components/base/type";

export function FailingModels({ target }: { target: Target }) {
  const { runResults, manifest } = target;

  const failingModels = runResults.results.filter((result) => {
    const node = resolveManifestNode(manifest, result.unique_id);
    return (
      node?.resource_type === "model" &&
      (result.status === "fail" || result.status === "error")
    );
  });

  if (!failingModels.length) {
    return (
      <Column maxHeight="100vh" overflowY="scroll" gap={majorScale(3)} flex={1}>
        <SuperFillBox>
          <PageCard
            display="flex"
            flexDirection="column"
            width={400}
            paddingY={majorScale(5)}
            paddingX={majorScale(5)}
            boxShadow={`0px 4px 8px 0px ${NEUTRAL_700}22`}
            gap={majorScale(2)}
          >
            <Column
              justifyContent="center"
              alignItems="center"
              gap={majorScale(4)}
            >
              <SuperIcon
                name="check-circle"
                color={GREEN_400}
                type="solid"
                fontSize={60}
              />
              <Text>All models in this run completed successfully.</Text>
            </Column>
          </PageCard>
        </SuperFillBox>
      </Column>
    );
  }

  return (
    <Column maxHeight="100vh" overflowY="scroll" gap={majorScale(3)}>
      <Column gap={majorScale(2)}>
        <H1>Failing models</H1>
        <Column flex={1} gap={majorScale(3)}>
          {failingModels.map((runResultNode) => {
            const manifestNode = resolveManifestNode(
              manifest,
              runResultNode.unique_id
            );

            return (
              <Row
                key={runResultNode.unique_id}
                borderRadius={4}
                border={`1px solid ${NEUTRAL_200}`}
                padding={majorScale(2)}
                gap={majorScale(1)}
              >
                <Column gap={majorScale(1)} flex={1}>
                  <Row centerY gap={minorScale(2)}>
                    <SuperStatusPill
                      size={18}
                      backgroundColor={RED_600}
                      icon={
                        <SuperIcon fontSize={13} name="xmark" type="solid" />
                      }
                    />
                    <H4>{manifestNode?.name}</H4>
                  </Row>
                  {runResultNode.compiled_code && (
                    <Column gap={majorScale(1)}>
                      <Text fontWeight="bold">Compiled code</Text>
                      <SuperCodeEditor
                        readOnly
                        language="sql"
                        value={runResultNode.compiled_code.trim()}
                      />
                    </Column>
                  )}
                  {runResultNode.message && (
                    <Column gap={majorScale(1)}>
                      <Text fontWeight="bold">Error message</Text>
                      <SuperCodeEditor
                        readOnly
                        language="plaintext"
                        value={runResultNode.message}
                      />
                    </Column>
                  )}
                </Column>
              </Row>
            );
          })}
        </Column>
      </Column>
    </Column>
  );
}
