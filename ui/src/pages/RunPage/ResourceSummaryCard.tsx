import { PageCard } from "@mp/ui/src/components/base";
import { minorScale, Text } from "evergreen-ui";
import { Row } from "super/src/components/base/layout";
import { NEUTRAL_400, NEUTRAL_500 } from "super/src/tokens/colors";

export function ResourceSummaryCard({
  label,
  count,
  testCount,
}: {
  label: string;
  count: number;
  testCount: number;
}) {
  return (
    <PageCard
      display="flex"
      flex={1}
      flexDirection="column"
      paddingX={minorScale(6)}
      paddingY={minorScale(5)}
      backgroundColor="#F9FAFC"
      height={122}
      maxWidth={380}
    >
      <Text is="dt" color={NEUTRAL_500} fontWeight="500">
        {label}
      </Text>
      <Text
        is="dd"
        lineHeight="36px"
        fontSize={30}
        fontWeight="600"
        marginTop={minorScale(1)}
      >
        {count}
      </Text>
      {testCount > 0 && (
        <Row centerY gap={minorScale(1)}>
          <Text color={NEUTRAL_500} fontWeight="500" fontSize={12}>
            {testCount} tested
          </Text>
          <Text color={NEUTRAL_400} fontWeight="500" fontSize={12}>
            ({Math.floor((testCount / count) * 100)}%)
          </Text>
        </Row>
      )}
    </PageCard>
  );
}
