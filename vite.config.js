import viteReact from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { defineConfig } from "vite";

const plugins = [viteReact()];
if (!process.env.DEV) {
  plugins.push(viteSingleFile());
}

// https://vitejs.dev/config/
export default defineConfig({
  root: "ui",
  plugins,
  build: {
    outDir: "dist",
  },
});
