import { execa } from "execa";

export async function resolveCommitSha(cwd: string) {
  let commitSha: string | null = null;
  try {
    ({ stdout: commitSha } = await execa({
      cwd,
    })`git rev-parse HEAD`);
  } catch (err) {
    // ignore
  }
  return commitSha;
}
