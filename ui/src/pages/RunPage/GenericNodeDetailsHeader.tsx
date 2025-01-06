import { Badge, minorScale, majorScale, Pane, Text } from "evergreen-ui";
import { SuperIcon } from "super";
import { Row } from "super/src/components/base/layout";
import { H1 } from "super/src/components/base/type";
import { SuperStatusPill } from "super/src/SuperStatusPill/SuperStatusPill";
import { GREEN_600, NEUTRAL_400, RED_600 } from "super/src/tokens/colors";
import {
  resourceTypeDisplayName,
  type UnifiedRunManifestNode,
} from "../../utils/target";
import {
  formatDuration,
  intervalToDuration,
  max,
  min,
  type Duration,
} from "date-fns";

function defaultTitleRenderer(node: UnifiedRunManifestNode) {
  return <pre>{node.manifest.name}</pre>;
}

type Props = {
  node: UnifiedRunManifestNode;
  titleRenderer?: (node: UnifiedRunManifestNode) => React.ReactNode;
};

export function GenericNodeDetailsHeader({
  node,
  titleRenderer = defaultTitleRenderer,
}: Props) {
  const status = node.runResult?.status ?? "skipped";
  const didFail = status === "fail" || status === "error";
  const skipped = status === "skipped";

  let startedAt: Date | undefined;
  let completedAt: Date | undefined;
  let duration: Duration | undefined;
  let formattedDuration: string | undefined;
  if (node.runResult) {
    startedAt = min(node.runResult.timing.map((t) => t.started_at));
    completedAt = max(node.runResult.timing.map((t) => t.completed_at));
    duration = intervalToDuration({
      start: startedAt,
      end: completedAt,
    });
    formattedDuration = formatDuration(duration, { zero: true });
  }

  return (
    <Pane>
      <Text fontSize={12} color="muted">
        {resourceTypeDisplayName(node.manifest.resource_type)}
      </Text>
      <Row centerY gap={majorScale(1)}>
        <H1>{titleRenderer(node)}</H1>
        <SuperStatusPill
          size={19}
          backgroundColor={
            didFail ? RED_600 : skipped ? NEUTRAL_400 : GREEN_600
          }
          icon={
            didFail ? (
              <SuperIcon fontSize={13} name="xmark" type="solid" />
            ) : skipped ? (
              <SuperIcon fontSize={13} name="minus" type="solid" />
            ) : (
              <SuperIcon fontSize={13} name="check" type="solid" />
            )
          }
        />
      </Row>
      {node.manifest.tags && (
        <Row gap={minorScale(1)} marginTop={minorScale(1)}>
          {node.manifest.tags.map((tag) => (
            <Badge key={tag} color="blue">
              {tag}
            </Badge>
          ))}
        </Row>
      )}
      {!skipped && (
        <Row centerY gap={minorScale(1)} marginTop={minorScale(1)}>
          <SuperIcon fontSize={12} name="clock" />
          <Text fontSize={12} color="muted">
            {formattedDuration === "" ? "< 1 second" : formattedDuration}
          </Text>
        </Row>
      )}
    </Pane>
  );
}
