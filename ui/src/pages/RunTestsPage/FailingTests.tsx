import { Link, majorScale, minorScale, Text } from "evergreen-ui";
import { Column, Row, Span } from "super/src/components/base/layout";
import { H1, H4 } from "super/src/components/base/type";
import { SuperDivider } from "super/src/SuperDivider/SuperDivider";
import {
  GREEN_400,
  NEUTRAL_200,
  NEUTRAL_500,
  NEUTRAL_700,
  RED_600,
} from "super/src/tokens/colors";
import { testTypeDisplayName } from "../../utils/tests";
import { SuperIcon } from "super/src/SuperIcon/SuperIcon";
import { TypeIconOf } from "@mp/commons-ui/src/TypeIcon";
import { SuperCodeEditor, SuperFillBox, SuperStatusPill } from "super";
import type { Target } from "../../../../cli/src/utils/target";
import { PageCard } from "@mp/ui/src/components/base/Page";
import { resolveManifestNode } from "../../utils/manifest";

type TestNode =
  | {
      targetNode: "column";
      testType: string;
      tableName: string;
      columnName: string;
    }
  | {
      targetNode: "table";
      testType: string | null;
      tableNames: string[];
    };

type ManifestNode = NonNullable<Target["manifest"]["nodes"][string]>;

function parseTestNode(node: ManifestNode): TestNode | undefined {
  const testType = node.test_metadata?.name;

  // if the node doesn't have a test type then it's a custom test
  if (!testType) {
    return {
      targetNode: "table",
      testType: node.name ?? "Custom",
      tableNames: node.depends_on?.nodes ?? [],
    };
  }

  // if the node's name doesn't start with the test type then the user likely assigned
  // a custom name to the test. in that case, we should prefer the custom name to any
  // special rendering we might want to do.
  // the exception to this case is test names that start with a package namespace, e.g.,`dbt_utils`.
  // https://docs.getdbt.com/reference/resource-properties/data-tests#custom-data-test-name
  if (
    !node.name?.startsWith(testType) &&
    !(
      node.test_metadata?.namespace != null &&
      node.name?.startsWith(node.test_metadata.namespace)
    )
  ) {
    return;
  }

  if (node.column_name != null) {
    const tableName = node.depends_on?.nodes?.[0];
    if (!tableName) {
      // not expected
      return;
    }
    return {
      targetNode: "column",
      testType: testTypeDisplayName(testType),
      tableName,
      columnName: node.column_name,
    };
  }

  const tableNames = node.depends_on?.nodes;
  if (tableNames != null && tableNames.length > 0) {
    return {
      targetNode: "table",
      testType: testTypeDisplayName(testType),
      tableNames,
    };
  }
}

export function FailingTests({ target }: { target: Target }) {
  const { runResults, manifest } = target;

  const failingTests = runResults.results.filter((result) => {
    const node = resolveManifestNode(manifest, result.unique_id);
    return node?.resource_type === "test" && result.status === "fail";
  });

  if (!failingTests.length) {
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
              <H1>All tests passed!</H1>
              <SuperIcon
                name="check-circle"
                color={GREEN_400}
                type="solid"
                fontSize={60}
              />
              <Text>All tests in this run completed successfully.</Text>
            </Column>
          </PageCard>
        </SuperFillBox>
      </Column>
    );
  }

  return (
    <Column maxHeight="100vh" overflowY="scroll" gap={majorScale(3)}>
      <Column gap={majorScale(2)}>
        <H1>Failing tests</H1>
        <Column flex={1} gap={majorScale(3)}>
          {failingTests.map((runResultNode) => {
            const manifestNode = manifest.nodes[runResultNode.unique_id];
            const parsedTestNode = parseTestNode(manifestNode);

            // FIXME
            if (!parsedTestNode) {
              return null;
            }

            return (
              <Row
                key={runResultNode.unique_id}
                borderRadius={4}
                border={`1px solid ${NEUTRAL_200}`}
                padding={majorScale(2)}
                gap={majorScale(1)}
              >
                <Column flex={1} gap={majorScale(1)}>
                  <Column gap={minorScale(1)}>
                    <Row centerY gap={minorScale(2)}>
                      <SuperStatusPill
                        size={18}
                        backgroundColor={RED_600}
                        icon={
                          <SuperIcon fontSize={13} name="xmark" type="solid" />
                        }
                      />
                      <H4>{parsedTestNode.testType}</H4>
                    </Row>
                    <Row gap={majorScale(1)} centerY>
                      {parsedTestNode.targetNode === "table" ? (
                        parsedTestNode.tableNames.length > 1 ? (
                          <Span color={NEUTRAL_500} fontSize={13}>
                            {parsedTestNode.tableNames.length} nodes
                          </Span>
                        ) : (
                          <>
                            <TypeIconOf of={{ type: "table" }} size={12} />{" "}
                            <Span color={NEUTRAL_500} fontSize={13}>
                              {parsedTestNode.tableNames[0]}
                            </Span>
                          </>
                        )
                      ) : (
                        <>
                          <TypeIconOf of={{ type: "table" }} size={12} />{" "}
                          <Span color={NEUTRAL_500} fontSize={13}>
                            {parsedTestNode.tableName}
                          </Span>
                          <TypeIconOf of={{ type: "column" }} size={12} />{" "}
                          <Span color={NEUTRAL_500} fontSize={13}>
                            {parsedTestNode.columnName}
                          </Span>
                        </>
                      )}
                    </Row>
                  </Column>
                  {runResultNode.compiled_code && (
                    <SuperCodeEditor
                      readOnly
                      language="sql"
                      value={runResultNode.compiled_code.trim()}
                    />
                  )}
                  {runResultNode.message && (
                    <SuperCodeEditor
                      readOnly
                      language="plaintext"
                      value={runResultNode.message}
                    />
                  )}
                  {runResultNode.adapter_response.mp_test_failure_meta
                    ?.results_url && (
                    <Link
                      href={
                        runResultNode.adapter_response.mp_test_failure_meta
                          .results_url
                      }
                      target="_blank"
                    >
                      Download results
                    </Link>
                  )}
                </Column>
              </Row>
            );
          })}
        </Column>
      </Column>
      <SuperDivider />
    </Column>
  );
}
