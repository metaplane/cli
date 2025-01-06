import { Link as EvergreenLink, majorScale, Text } from "evergreen-ui";
import { Column, Row } from "super/src/components/base/layout";
import { useRunContext } from "../../data/runs";
import { GenericNodeDetailsHeader } from "./GenericNodeDetailsHeader";
import { SuperCodeEditor, SuperFillBox, SuperTable } from "super";
import { ErrorMessage } from "@mp/ui/src/components/Error/ErrorMessage";
import { useCallback } from "react";
import {
  resourceTypeDisplayName,
  type UnifiedRunManifestNode,
} from "../../utils/target";
import { H1, H4 } from "super/src/components/base/type";
import { makeNodeDetailsUrl } from "../../utils/navigate";
import { Link } from "@mp/ui/src/components/base/Link/Link";
import { parseTestNode } from "../../utils/tests";

type Props = {
  uniqueId: string;
};

export function TestDetails({ uniqueId }: Props) {
  const runContext = useRunContext();
  const test = runContext.unifiedRunManifest.nodesByUniqueId[uniqueId];
  const parsedTestNode = parseTestNode(test.manifest);
  const testedNodeId = test.manifest.depends_on?.nodes?.[0];
  const testedNode = testedNodeId
    ? runContext.unifiedRunManifest.nodesByUniqueId[testedNodeId]
    : null;
  const runResultNode = test.runResult;

  const dependsOn =
    runContext.unifiedRunManifest.target.manifest.parent_map[uniqueId] ?? [];

  const titleRenderer = useCallback(
    (node: UnifiedRunManifestNode) => {
      if (!parsedTestNode) {
        return <pre>{node.manifest.name}</pre>;
      }

      if (parsedTestNode.targetNode === "column") {
        return (
          <Row gap={majorScale(1)}>
            <H1>{parsedTestNode.testType}</H1>
            {"/"}
            <pre>{testedNode?.manifest.name}</pre>
            {"/"}
            <pre>{parsedTestNode.columnName}</pre>
          </Row>
        );
      }

      return (
        <Row gap={majorScale(1)}>
          <pre>{parsedTestNode.testType}</pre>
          {">"}
          <pre>{testedNode?.manifest.name}</pre>
        </Row>
      );
    },
    [parsedTestNode, testedNode]
  );

  if (!test) {
    return (
      <SuperFillBox>
        <ErrorMessage title="404" description="Test not found" />
      </SuperFillBox>
    );
  }

  return (
    <Column gap={majorScale(2)}>
      <GenericNodeDetailsHeader node={test} titleRenderer={titleRenderer} />
      {runResultNode?.message && (
        <Column gap={majorScale(1)}>
          <H4>Message</H4>
          <SuperCodeEditor
            readOnly
            language="plaintext"
            value={runResultNode.message}
          />
        </Column>
      )}
      {test.manifest.raw_code && (
        <Column gap={majorScale(1)}>
          <H4>Raw code</H4>
          <SuperCodeEditor
            readOnly
            language="sql"
            value={test.manifest.raw_code.trim()}
          />
        </Column>
      )}
      {runResultNode?.compiled_code && (
        <Column gap={majorScale(1)}>
          <H4>Compiled code</H4>
          <SuperCodeEditor
            readOnly
            language="sql"
            value={runResultNode.compiled_code.trim()}
          />
        </Column>
      )}
      {runResultNode?.adapter_response.mp_test_failure_meta?.results_url && (
        <EvergreenLink
          href={runResultNode.adapter_response.mp_test_failure_meta.results_url}
          target="_blank"
        >
          Download results
        </EvergreenLink>
      )}
      {dependsOn.length > 0 && (
        <Column gap={majorScale(1)}>
          <H4>Depends on</H4>
          <SuperTable>
            <SuperTable.Header>
              <SuperTable.HeaderTextCell flex={0.25}>
                Type
              </SuperTable.HeaderTextCell>
              <SuperTable.HeaderTextCell flex={1}>
                Name
              </SuperTable.HeaderTextCell>
            </SuperTable.Header>
            <SuperTable.Body>
              {dependsOn.map((dep) => {
                const depNode =
                  runContext.unifiedRunManifest.nodesByUniqueId[dep];
                if (!depNode) {
                  return null;
                }
                return (
                  <SuperTable.NavRow
                    key={dep}
                    is={Link}
                    to={makeNodeDetailsUrl(runContext, dep)}
                    paddingY={majorScale(1)}
                  >
                    <SuperTable.Cell flex={0.25}>
                      <Text fontSize={12}>
                        {resourceTypeDisplayName(
                          depNode.manifest.resource_type
                        )}
                      </Text>
                    </SuperTable.Cell>
                    <SuperTable.Cell flex={1}>
                      <pre>{depNode.manifest.name}</pre>
                    </SuperTable.Cell>
                  </SuperTable.NavRow>
                );
              })}
            </SuperTable.Body>
          </SuperTable>
        </Column>
      )}
    </Column>
  );
}
