import { majorScale, minorScale, Pill, Text } from "evergreen-ui";
import { Column, Row } from "super/src/components/base/layout";
import { SuperDivider, SuperIcon } from "super";
import { ClickableAreaLink } from "@mp/ui/src/components/ClickableArea/ClickableAreaLink";
import { useNodeTypeParam } from "./params";
import { NEUTRAL_050, NEUTRAL_200, PRIMARY_100 } from "super/src/tokens/colors";
import { resourceTypeDisplayName } from "../../utils/target";
import { useRunContext } from "../../data/runs";
import { useMemo } from "react";
import { numFormat } from "super/src/utils/number/NumberFormat";

export function RunNavSidebar() {
  const nodeType = useNodeTypeParam();
  const run = useRunContext();

  const failuresByResourceType = useMemo(() => {
    const result: Record<string, number> = {};
    for (const node of run.unifiedRunManifest.nodes) {
      const status = node.runResult?.status;
      if (status === "fail" || status === "error") {
        result[node.manifest.resource_type] =
          (result[node.manifest.resource_type] || 0) + 1;
      }
    }
    return result;
  }, [run]);
  const allCount = useMemo(
    () =>
      Object.values(run.unifiedRunManifest.nodesByResourceType).reduce(
        (acc, resource) => acc + resource.length,
        0
      ),
    [run]
  );

  return (
    <Column width={220} gap={majorScale(1)}>
      <SuperDivider />
      <ClickableAreaLink
        borderRadius={minorScale(1)}
        backgroundColor={nodeType === "all" ? PRIMARY_100 : undefined}
        paddingX={majorScale(2)}
        paddingY={majorScale(1)}
        to="all"
      >
        <Row centerY justifyContent="space-between">
          <Text>All nodes</Text>
          {!!allCount && (
            <Pill
              transition="background-color 0.2s ease-in-out"
              backgroundColor={nodeType === "all" ? NEUTRAL_050 : NEUTRAL_200}
            >
              {numFormat.format(allCount)}
            </Pill>
          )}
        </Row>
      </ClickableAreaLink>
      <SuperDivider />
      {Object.entries(run.unifiedRunManifest.nodesByResourceType).map(
        ([type, nodes]) => {
          const isActive = nodeType === type;
          const failureCount = failuresByResourceType[type] ?? 0;
          return (
            <ClickableAreaLink
              key={type}
              borderRadius={minorScale(1)}
              backgroundColor={isActive ? PRIMARY_100 : undefined}
              paddingX={majorScale(2)}
              paddingY={majorScale(1)}
              to={type}
            >
              <Row centerY justifyContent="space-between">
                <Text>{resourceTypeDisplayName(type)}s</Text>
                <Row centerY gap={majorScale(1)}>
                  <Pill
                    transition="background-color 0.2s ease-in-out"
                    backgroundColor={
                      nodeType === type ? NEUTRAL_050 : NEUTRAL_050
                    }
                  >
                    {numFormat.format(nodes.length)}
                  </Pill>
                  {!!failureCount && (
                    <Pill color="red">
                      <SuperIcon
                        fontSize={10}
                        marginLeft={2}
                        name="warning"
                        type="solid"
                      />{" "}
                      {numFormat.format(failureCount)}
                    </Pill>
                  )}
                </Row>
              </Row>
            </ClickableAreaLink>
          );
        }
      )}
    </Column>
  );
}
