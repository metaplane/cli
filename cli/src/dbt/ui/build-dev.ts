import { build as viteBuild } from "vite";
import viteReact from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";
import { bootstrap } from "./bootstrap.js";
import type { Target } from "../../utils/target.js";

export async function buildDev({
  target,
  commitSha,
}: {
  target: Target;
  commitSha: string | null;
}) {
  await viteBuild({
    plugins: [
      viteReact(),
      viteSingleFile(),
      {
        name: "bootstrap-data",
        transformIndexHtml(html) {
          return bootstrap(html, {
            runs: [
              {
                id: target.manifest.metadata.invocation_id,
                status: "completed",
                target,
                commitSha,
              },
            ],
          });
        },
      },
    ],
    build: {
      emptyOutDir: true,
      outDir: path.join(process.cwd(), ".metaplane"),
    },
  });
}
