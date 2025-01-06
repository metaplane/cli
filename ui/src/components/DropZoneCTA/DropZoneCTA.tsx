import {
  NEUTRAL_050,
  NEUTRAL_600,
  NEUTRAL_400,
  NEUTRAL_500,
} from "@mp/ui/src/tokens/colors";
import { Text, majorScale } from "evergreen-ui";
import { minorScale } from "evergreen-ui";
import { Column, Row } from "super/src/components/base/layout";
import { SuperIcon } from "super";
import type { ColumnProps } from "super/src/components/base/layout/Column";

type DropZoneCTA = ColumnProps<"div">;

export function DropZoneCTA({ ...props }: DropZoneCTA) {
  return (
    <Column
      width={600}
      border={`1px dashed ${NEUTRAL_400}`}
      borderRadius={8}
      paddingY={minorScale(3)}
      paddingX={majorScale(2)}
      gap={minorScale(1)}
      backgroundColor={NEUTRAL_050}
      {...props}
    >
      <Row centerY gap={majorScale(2)}>
        <SuperIcon fontSize={30} name="upload" color={NEUTRAL_500} />
        <Text color={NEUTRAL_600}>
          Drag-and-drop your{" "}
          <pre style={{ display: "inline" }}>run_results.json</pre> or{" "}
          <pre style={{ display: "inline" }}>manifest.json</pre> to visualize
          the results.{" "}
          <strong>Your data will remain local within your browser.</strong>
        </Text>
      </Row>
    </Column>
  );
}
