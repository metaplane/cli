import { z } from "zod";
import { Command, Option } from "commander";
import path from "path";
import { serve } from "../dbt/ui/serve.js";
import { build } from "../dbt/ui/build.js";

const DEFAULT_PORT = 1212;

const targetDirOption = new Option(
  "--target-dir <target-dir>",
  "dbt run target directory"
).default(path.join(process.cwd(), "target"));

const serveArgsSchema = z.object({
  targetDir: z.string(),
  port: z.coerce.number(),
});

const buildArgsSchema = z.object({
  targetDir: z.string(),
});

export function makeDbtUICommand() {
  const program = new Command("ui");

  // this is experimental and needs a bit more work in order to support
  // executing dbt commands in all environments
  if (process.env.DANGEROUSLY_ENABLE_DBT_UI_SERVE) {
    program
      .command("serve")
      .description("serve a local UI around a dbt project")
      .addOption(targetDirOption)
      .addOption(
        new Option("--port <port>", "port to listen on").default(DEFAULT_PORT)
      )
      .action(async (opts) => {
        const { targetDir, port } = serveArgsSchema.parse(opts);
        await serve({ targetDir, port });
      });
  }

  program
    .command("build")
    .description(
      "build a self-contained index.html from a dbt project's target directory"
    )
    .addOption(targetDirOption)
    .action(async (opts) => {
      const { targetDir } = buildArgsSchema.parse(opts);
      await build({ targetDir });
    });

  return program;
}
