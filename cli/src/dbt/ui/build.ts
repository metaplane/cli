import path from "path";
import { readTarget } from "../../utils/target.js";
import { bootstrap } from "./bootstrap.js";
import { resolveCommitSha } from "../../utils/git.js";
import fs from "fs";

export async function build({ targetPath }: { targetPath: string }) {
  const target = readTarget(targetPath);
  const commitSha = await resolveCommitSha(targetPath);

  if (process.env.DEV) {
    // lazy load so that vite deps don't end up in the bundle
    await import("./build-dev.js").then((m) =>
      m.buildDev({ target, commitSha })
    );
    return;
  } else {
    // @ts-expect-error esbuild thing
    const html = await import("../../../../ui/dist/index.html");
    fs.mkdirSync(path.join(process.cwd(), ".metaplane"), { recursive: true });
    fs.writeFileSync(
      path.join(process.cwd(), ".metaplane", "index.html"),
      bootstrap(html.default, {
        runs: [
          {
            id: target.manifest.metadata.invocation_id,
            status: "completed",
            target,
            commitSha,
          },
        ],
      })
    );
  }

  console.log("done");
}
