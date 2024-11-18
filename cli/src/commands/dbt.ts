/**
 * `commander` specific details for the `dbt` command.
 */

import path from "path";
import { z } from "zod";
import { Command, Option } from "commander";
import { printManifest, printRunResults } from "../dbt/print.js";
import { generateManifestOverview } from "../dbt/generateManifestOverview.js";
import { makeDbtUICommand } from "./dbt-ui.js";

const targetDirOption = new Option(
  "--target-dir <target-dir>",
  "dbt run target directory"
).default(path.join(process.cwd(), "target"));

const indentOption = new Option(
  "--indent <indent>",
  "indentation level"
).default(2);

const printArgsSchema = z.object({
  targetDir: z.string(),
  indent: z.coerce.number(),
});

const generateTestsArgsSchema = z.object({
  targetDir: z.string(),
});

export function makeDbtCommand() {
  const program = new Command("dbt");

  program
    .command("print-run-results")
    .description("pretty print the run_results.json")
    .addOption(targetDirOption)
    .addOption(indentOption)
    .action((opts) => {
      const { targetDir, indent } = printArgsSchema.parse(opts);
      printRunResults(targetDir, indent);
    });

  program
    .command("manifest-overview")
    .description("Generate high level information about the manifest")
    .addOption(targetDirOption)
    .action((opts) => {
      const { targetDir } = generateTestsArgsSchema.parse(opts);
      generateManifestOverview(targetDir);
    });

  program
    .command("print-manifest")
    .description("pretty print the manifest.json")
    .addOption(targetDirOption)
    .addOption(indentOption)
    .action((opts) => {
      const { targetDir, indent } = printArgsSchema.parse(opts);
      printManifest(targetDir, indent);
    });

  program.addCommand(makeDbtUICommand());

  return program;
}
