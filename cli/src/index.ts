import { Command } from "commander";
import { makeDbtCommand } from "./commands/dbt.js";

async function main(argv: string[]) {
  const program = new Command();

  program.name("metaplane");

  // register subcommands
  program.addCommand(makeDbtCommand());

  program.parse(argv);
}

main(process.argv).catch((err) =>
  setImmediate(() => {
    console.error(err.message);
    process.exitCode = 1;
  })
);
