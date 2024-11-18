import type { RunResponse } from "./api.js";

export type BootstrapData = {
  runs: RunResponse[];
};

export function bootstrap(html: string, data: BootstrapData) {
  return html.replace(
    "<!-- BOOTSTRAP_DATA -->",
    `<script>var BOOTSTRAP_DATA = ${JSON.stringify(data)}</script>`
  );
}
