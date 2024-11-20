import type { RunResponse } from "./api.js";

export type BootstrapData = {
  runs: RunResponse[];
};

export function bootstrap(html: string, data: BootstrapData) {
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64");
  return html.replace(
    "<!-- BOOTSTRAP_DATA -->",
    `<script>var BOOTSTRAP_DATA = JSON.parse(atob("${encoded}"))</script>`
  );
}
