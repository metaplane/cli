import type { Target } from "../../../cli/src/utils/target";

export function testTypeDisplayName(testType: string) {
  return testType
    .split("_")
    .join(" ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

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

export function parseTestNode(node: ManifestNode): TestNode | undefined {
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
