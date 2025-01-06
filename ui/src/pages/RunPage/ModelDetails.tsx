import { SuperCodeEditor, SuperFillBox, SuperTable } from "super";
import { useRunContext } from "../../data/runs";
import { ErrorMessage } from "@mp/ui/src/components/Error/ErrorMessage";
import { Column } from "super/src/components/base/layout";
import { majorScale, Text } from "evergreen-ui";
import { H4 } from "super/src/components/base/type";
import { Link } from "@mp/ui/src/components/base/Link/Link";
import { resourceTypeDisplayName } from "../../utils/target";
import { makeNodeDetailsUrl } from "../../utils/navigate";
import { GenericNodeDetailsHeader } from "./GenericNodeDetailsHeader";

type Props = {
  uniqueId: string;
};

const HEADER_HEIGHT = 40;
const MIN_ROW_HEIGHT = 34;

export function ModelDetails({ uniqueId }: Props) {
  const runContext = useRunContext();
  const model = runContext.unifiedRunManifest.executedNodesByUniqueId[uniqueId];
  const columns = model?.manifest.columns
    ? Object.values(model.manifest.columns)
    : [];
  const dependsOn =
    runContext.unifiedRunManifest.target.manifest.parent_map[uniqueId] ?? [];
  const referencedBy =
    runContext.unifiedRunManifest.target.manifest.child_map[uniqueId] ?? [];
  const didFail =
    model.runResult.status === "fail" || model.runResult.status === "error";

  if (!model) {
    return (
      <SuperFillBox>
        <ErrorMessage title="404" description="Model not found" />
      </SuperFillBox>
    );
  }

  return (
    <Column gap={majorScale(2)}>
      <GenericNodeDetailsHeader node={model} />
      {model.manifest.description && (
        <Text fontSize={14} color="muted">
          {model.manifest.description}
        </Text>
      )}
      {didFail && model.runResult.message && (
        <>
          <Column gap={majorScale(1)}>
            <H4>Message</H4>
            <SuperCodeEditor
              readOnly
              language="plaintext"
              value={model.runResult.message}
            />
          </Column>
          {model.runResult.compiled_code && (
            <Column gap={majorScale(1)}>
              <H4>Compiled code</H4>
              <SuperCodeEditor
                readOnly
                language="sql"
                value={model.runResult.compiled_code.trim()}
              />
            </Column>
          )}
        </>
      )}
      {columns.length > 0 && (
        <Column gap={majorScale(1)}>
          <H4>Columns</H4>
          <SuperTable
            maxMinHeight={
              columns.length < 4
                ? HEADER_HEIGHT + MIN_ROW_HEIGHT * columns.length
                : 260
            }
          >
            <SuperTable.Header>
              <SuperTable.HeaderTextCell>Name</SuperTable.HeaderTextCell>
              <SuperTable.HeaderTextCell>Data type</SuperTable.HeaderTextCell>
              <SuperTable.HeaderTextCell>Description</SuperTable.HeaderTextCell>
            </SuperTable.Header>
            <SuperTable.Body>
              {columns.map((column) => (
                <SuperTable.Row
                  key={column.name}
                  paddingY={majorScale(1)}
                  minHeight={0}
                  height="auto"
                >
                  <SuperTable.Cell>
                    <pre>{column.name}</pre>
                  </SuperTable.Cell>
                  <SuperTable.Cell>
                    <pre>{column.data_type ?? "-"}</pre>
                  </SuperTable.Cell>
                  <SuperTable.Cell paddingY={majorScale(1)}>
                    <Text fontSize={12}>{column.description}</Text>
                  </SuperTable.Cell>
                </SuperTable.Row>
              ))}
            </SuperTable.Body>
          </SuperTable>
        </Column>
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
      {referencedBy.length > 0 && (
        <Column gap={majorScale(1)}>
          <H4>Referenced by</H4>
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
              {referencedBy.map((ref) => {
                const refNode =
                  runContext.unifiedRunManifest.nodesByUniqueId[ref];
                if (!refNode) {
                  return null;
                }
                return (
                  <SuperTable.NavRow
                    key={ref}
                    is={Link}
                    to={makeNodeDetailsUrl(runContext, ref)}
                  >
                    <SuperTable.Cell flex={0.25}>
                      <Text fontSize={12}>
                        {resourceTypeDisplayName(
                          refNode.manifest.resource_type
                        )}
                      </Text>
                    </SuperTable.Cell>
                    <SuperTable.Cell flex={1}>
                      <pre>{refNode.manifest.name}</pre>
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
