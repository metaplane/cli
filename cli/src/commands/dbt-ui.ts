import { z } from "zod";
import { Command, Option } from "commander";
import path from "path";
import { serve } from "../dbt/ui/serve.js";
import { build } from "../dbt/ui/build.js";

const DEFAULT_PORT = 1212;

const targetPathOption = new Option(
  "--target-path <target-path>",
  "dbt run target directory"
).default(path.join(process.cwd(), "target"));

const serveArgsSchema = z.object({
  targetPath: z.string(),
  port: z.coerce.number(),
});

const buildArgsSchema = z.object({
  targetPath: z.string(),
});

export function makeDbtUICommand() {
  const program = new Command("ui");

  // this is experimental and needs a bit more work in order to support
  // executing dbt commands in all environments
  if (process.env.DANGEROUSLY_ENABLE_DBT_UI_SERVE) {
    program
      .command("serve")
      .description("serve a local UI around a dbt project")
      .addOption(targetPathOption)
      .addOption(
        new Option("--port <port>", "port to listen on").default(DEFAULT_PORT)
      )
      .action(async (opts) => {
        const { targetPath, port } = serveArgsSchema.parse(opts);
        await serve({ targetPath, port });
      });
  }

  program
    .command("build")
    .description(
      "build a self-contained index.html from a dbt project's target directory"
    )
    .addOption(targetPathOption)
    .action(async (opts) => {
      const { targetPath } = buildArgsSchema.parse(opts);
      await build({ targetPath });
    });

  return program;
}
