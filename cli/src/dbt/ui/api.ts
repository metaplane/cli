import type { Express } from "express";
import { readTarget, type Target } from "../../utils/target.js";
import { resolveCommitSha } from "../../utils/git.js";
import path from "path";
import fs from "fs";
import { execa } from "execa";
import { z } from "zod";
import stripAnsi from "strip-ansi";

export type RunResponse =
  | {
      id: string;
      status: "completed";
      target: Target;
      commitSha: string | null;
      stdout?: string;
    }
  | {
      id: string;
      status: "pending";
      stdout: string;
    };

function makeRunResponses(targetDir: string): RunResponse[] {
  const projectDir = path.dirname(targetDir);
  const runsDir = path.join(projectDir, ".metaplane", "runs");

  fs.mkdirSync(runsDir, { recursive: true });

  const runIds = fs.readdirSync(runsDir);

  return runIds.reverse().map((id) => {
    const runDir = path.join(runsDir, id.toString());
    const metadata = z
      .object({
        commitSha: z.string(),
        status: z.enum(["completed", "error", "pending"]),
        message: z.string().optional(),
      })
      .parse(
        JSON.parse(
          fs.readFileSync(path.join(runDir, "mp-metadata.json"), "utf8")
        )
      );

    if (metadata.status === "completed") {
      return {
        id,
        status: "completed",
        commitSha: metadata.commitSha,
        target: readTarget(runDir),
        stdout: stripAnsi(
          fs.readFileSync(path.join(runDir, "stdout.log"), "utf8")
        ),
      };
    } else {
      return {
        id,
        status: "pending",
        stdout: stripAnsi(
          fs.readFileSync(path.join(runDir, "stdout.log"), "utf8")
        ),
      };
    }
  });
}

async function execRun({
  targetDir,
  args,
}: {
  targetDir: string;
  args: string[];
}) {
  // TODO this might not always be true
  const projectDir = path.dirname(targetDir);
  const commitSha = await resolveCommitSha(targetDir);

  const runsDir = path.join(projectDir, ".metaplane", "runs");

  fs.mkdirSync(runsDir, { recursive: true });

  const runs = fs.readdirSync(runsDir).map(Number);
  const maxId = runs.length > 0 ? Math.max(...runs) : 0;
  const nextId = maxId + 1;
  const newRunDir = path.join(runsDir, nextId.toString());

  fs.mkdirSync(newRunDir, { recursive: true });

  fs.writeFileSync(
    path.join(newRunDir, "mp-metadata.json"),
    JSON.stringify({ commitSha, status: "pending" }, null, 2)
  );

  const stdoutFile = fs.createWriteStream(path.join(newRunDir, "stdout.log"));
  const stderrFile = fs.createWriteStream(path.join(newRunDir, "stderr.log"));

  const subprocess = execa(
    "dbt",
    [
      ...args,
      "--profiles-dir",
      ".dbt",
      "--target-path",
      path.relative(projectDir, newRunDir),
    ],
    {
      cwd: projectDir,
      env: process.env,
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  subprocess.stdout.pipe(stdoutFile);
  subprocess.stderr.pipe(stderrFile);

  subprocess
    .catch(() => {
      // noop
    })
    .finally(() => {
      fs.writeFileSync(
        path.join(newRunDir, "mp-metadata.json"),
        JSON.stringify({ commitSha, status: "completed" }, null, 2)
      );
    });

  return {
    id: nextId,
    subprocess,
  };
}

export function makeApiRoutes(app: Express, targetDir: string) {
  app.get("/api/runs", async (_, res) => {
    const commitSha = await resolveCommitSha(targetDir);
    const target = readTarget(targetDir);
    const id = target.manifest.metadata.invocation_id;
    const response: RunResponse = {
      id,
      status: "completed",
      target,
      commitSha,
    };
    res.json([...makeRunResponses(targetDir), response]);
  });

  app.post("/api/runs", async (_, res) => {
    const { id } = await execRun({ targetDir, args: ["build"] });
    res.json({ id });
  });

  app.post("/api/run-test/:name", async (req, res) => {
    const { id } = await execRun({
      targetDir,
      args: ["test", "--select", req.params.name],
    });
    res.json({ id });
  });
}
