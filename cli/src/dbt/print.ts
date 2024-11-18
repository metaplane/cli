import { readTarget } from "../utils/target.js";

export function printRunResults(targetPath: string, indent: number) {
  const { runResults } = readTarget(targetPath);
  console.log(JSON.stringify(runResults, null, indent));
}

export function printManifest(targetPath: string, indent: number) {
  const { manifest } = readTarget(targetPath);
  console.log(JSON.stringify(manifest, null, indent));
}
