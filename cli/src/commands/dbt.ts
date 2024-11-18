/**
 * `commander` specific details for the `dbt` command.
 */

import path from "path";
import { z } from "zod";
import { Command, Option } from "commander";
import { printManifest, printRunResults } from "../dbt/print.js";
import { generateManifestOverview } from "../dbt/generateManifestOverview.js";
import { makeDbtUICommand } from "./dbt-ui.js";

const targetPathOption = new Option(
  "--target-path <target-path>",
  "dbt run target directory"
).default(path.join(process.cwd(), "target"));

const indentOption = new Option(
  "--indent <indent>",
  "indentation level"
).default(2);

const printArgsSchema = z.object({
  targetPath: z.string(),
  indent: z.coerce.number(),
});

const generateTestsArgsSchema = z.object({
  targetPath: z.string(),
});

export function makeDbtCommand() {
  const program = new Command("dbt");

  program
    .command("print-run-results")
    .description("pretty print the run_results.json")
    .addOption(targetPathOption)
    .addOption(indentOption)
    .action((opts) => {
      const { targetPath, indent } = printArgsSchema.parse(opts);
      printRunResults(targetPath, indent);
    });

  program
    .command("manifest-overview")
    .description("Generate high level information about the manifest")
    .addOption(targetPathOption)
    .action((opts) => {
      const { targetPath } = generateTestsArgsSchema.parse(opts);
      generateManifestOverview(targetPath);
    });

  program
    .command("print-manifest")
    .description("pretty print the manifest.json")
    .addOption(targetPathOption)
    .addOption(indentOption)
    .action((opts) => {
      const { targetPath, indent } = printArgsSchema.parse(opts);
      printManifest(targetPath, indent);
    });

  program.addCommand(makeDbtUICommand());

  return program;
}
