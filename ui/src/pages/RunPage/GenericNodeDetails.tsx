import { Column } from "super/src/components/base/layout";
import { useRunContext } from "../../data/runs";
import { majorScale, Text } from "evergreen-ui";
import { GenericNodeDetailsHeader } from "./GenericNodeDetailsHeader";
import { H4 } from "super/src/components/base/type";
import { SuperCodeEditor, SuperTable } from "super";
import { Link } from "@mp/ui/src/components/base/Link/Link";
import { makeNodeDetailsUrl } from "../../utils/navigate";
import { resourceTypeDisplayName } from "../../utils/target";

type Props = {
  uniqueId: string;
};

export function GenericNodeDetails({ uniqueId }: Props) {
  const runContext = useRunContext();
  const node = runContext.unifiedRunManifest.nodesByUniqueId[uniqueId];
  const didFail =
    node.runResult?.status === "fail" || node.runResult?.status === "error";
  const dependsOn =
    runContext.unifiedRunManifest.target.manifest.parent_map[uniqueId] ?? [];
  const referencedBy =
    runContext.unifiedRunManifest.target.manifest.child_map[uniqueId] ?? [];

  return (
    <Column gap={majorScale(1)}>
      <GenericNodeDetailsHeader node={node} />
      {node.manifest.description && (
        <Text fontSize={14} color="muted">
          {node.manifest.description}
        </Text>
      )}
      {didFail && node.runResult?.message && (
        <>
          <Column gap={majorScale(1)}>
            <H4>Message</H4>
            <SuperCodeEditor
              readOnly
              language="plaintext"
              value={node.runResult.message}
            />
          </Column>
          {node.runResult?.compiled_code && (
            <Column gap={majorScale(1)}>
              <H4>Compiled code</H4>
              <SuperCodeEditor
                readOnly
                language="sql"
                value={node.runResult.compiled_code.trim()}
              />
            </Column>
          )}
        </>
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
