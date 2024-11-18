/**
 * utilities for reading artifacts from a dbt project's target directory.
 */

import fs from "fs";
import path from "path";
import { z } from "zod";

const RunResultsSchema = z.object({
  results: z.array(
    z.object({
      status: z.enum(["success", "error", "pass", "fail", "skipped"]),
      unique_id: z.string(),
      message: z.string().nullish(),
      compiled_code: z.string().nullish(),
      adapter_response: z.record(z.any()),
      timing: z.array(
        z.object({
          name: z.string(),
          started_at: z.coerce.date(),
          completed_at: z.coerce.date(),
        })
      ),
    })
  ),
  args: z.object({
    project_dir: z.string(),
  }),
});

const NodeSchema = z.object({
  unique_id: z.string(),

  database: z.string().nullish(),
  schema: z.string().nullish(),
  name: z.string().nullish(),
  // this is a more correct version of what the model name will be in the DB
  // it's usually the same as `name` but you can alter it to rename what goes into the db
  alias: z.string().nullish(),
  materialized: z.string().nullish(),

  // this is sorta like alias, but for source nodes only
  // https://docs.getdbt.com/reference/resource-properties/identifier
  identifier: z.string().nullish(),
  original_file_path: z.string().nullish(),
  package_name: z.string().nullish(),
  column_name: z.string().nullish(),
  test_metadata: z
    .object({ name: z.string(), namespace: z.string().nullish() })
    .nullish(),
  config: z.object({
    severity: z.string().nullish(),
    fail_cal: z.string().nullish(),
    warn_if: z.string().nullish(),
    error_if: z.string().nullish(),
    store_failures: z.boolean().nullish(),
  }),
  resource_type: z.enum([
    "model",
    "test",
    "seed",
    "operation",
    "source",
    "unit_test",
    "exposure",
    "snapshot",
    "semantic_model",
    "saved_query",
    "metric",
    "analysis",
  ]),
  description: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  depends_on: z
    .object({
      nodes: z.array(z.string()).nullish(),
    })
    .nullish(),
});

const ManifestSchema = z.object({
  metadata: z.object({
    project_name: z.string(),
    invocation_id: z.string(),
  }),
  child_map: z.record(z.array(z.string())).default({}),
  parent_map: z.record(z.array(z.string())).default({}),
  nodes: z.record(z.string(), NodeSchema).default({}),
  sources: z.record(z.string(), NodeSchema).default({}),
  exposures: z.record(z.string(), NodeSchema).default({}),
  unit_tests: z.record(z.string(), NodeSchema).default({}),
});

export type RunResults = z.infer<typeof RunResultsSchema>;
export type Manifest = z.infer<typeof ManifestSchema>;
export type DbtNode = z.infer<typeof NodeSchema>;

function isErrnoException(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}

function readRunResults(targetDir: string) {
  const runResultsPath = path.join(targetDir, "run_results.json");
  try {
    return RunResultsSchema.parse(
      JSON.parse(fs.readFileSync(runResultsPath, "utf8"))
    );
  } catch (err) {
    if (isErrnoException(err) && err.code === "ENOENT") {
      throw new Error(`run_results.json not found in ${targetDir}`);
    } else if (err instanceof z.ZodError) {
      throw new Error(`failed to parse run_results.json\n${err.message}`);
    }
    throw err;
  }
}

function readManifest(targetDir: string) {
  const manifestPath = path.join(targetDir, "manifest.json");
  try {
    return ManifestSchema.parse(
      JSON.parse(fs.readFileSync(manifestPath, "utf8"))
    );
  } catch (err) {
    if (isErrnoException(err) && err.code === "ENOENT") {
      throw new Error(`manifest.json not found in ${targetDir}`);
    } else if (err instanceof z.ZodError) {
      throw new Error(`failed to parse manifest.json\n${err.message}`);
    }
    throw err;
  }
}

export type Target = ReturnType<typeof readTarget>;

export function readTarget(targetDir: string) {
  return {
    runResults: readRunResults(targetDir),
    manifest: readManifest(targetDir),
  };
}
