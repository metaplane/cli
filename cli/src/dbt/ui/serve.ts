import express from "express";
import bodyParser from "body-parser";
import { makeApiRoutes } from "./api.js";

export async function serve({
  targetPath,
  port,
}: {
  targetPath: string;
  port: number;
}) {
  const app = express();

  app.use(bodyParser.json());

  if (process.env.DEV) {
    // lazy load so that vite deps don't end up in the bundle
    await import("./serve-dev.js").then((m) => m.serveDev({ app, port }));
  } else {
    app.listen(port, () => {
      console.log(`serving ui @ http://localhost:${port}`);
    });
  }

  makeApiRoutes(app, targetPath);

  if (!process.env.DEV) {
    // @ts-expect-error esbuild thing
    const html = await import("../../../../ui/dist/index.html");
    app.get("*", (_, res) => {
      res.send(html.default);
    });
  }
}
