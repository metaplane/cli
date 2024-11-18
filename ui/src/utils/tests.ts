export function testTypeDisplayName(testType: string) {
  return testType
    .split("_")
    .join(" ")
    .replace(/^\w/, (c) => c.toUpperCase());
}
