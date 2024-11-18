import type { Express } from "express";
import ViteExpress from "vite-express";

export async function serveDev({ app, port }: { app: Express; port: number }) {
  app.use(ViteExpress.static());

  const server = app.listen(port, () => {
    console.log(`serving ui @ http://localhost:${port}`);
  });

  ViteExpress.bind(app, server);
}
