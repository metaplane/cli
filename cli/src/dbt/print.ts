import { readTarget } from "../utils/target.js";

export function printRunResults(targetDir: string, indent: number) {
  const { runResults } = readTarget(targetDir);
  console.log(JSON.stringify(runResults, null, indent));
}

export function printManifest(targetDir: string, indent: number) {
  const { manifest } = readTarget(targetDir);
  console.log(JSON.stringify(manifest, null, indent));
}
