import { useMutation, useQuery } from "@tanstack/react-query";
import type { RunResponse } from "../../../cli/src/dbt/ui/api";
import { createContext, useContext } from "react";
import type { UnifiedRunManifest } from "../utils/target";

export type RunContext = {
  response: RunResponse & {
    status: "completed";
  };
  unifiedRunManifest: UnifiedRunManifest;
};

export const RunContext = createContext<RunContext | null>(null);

function fetchRuns() {
  if (window.BOOTSTRAP_DATA) {
    return Promise.resolve(window.BOOTSTRAP_DATA.runs);
  }
  return fetch("/api/runs").then((res) => res.json());
}

function createRun() {
  return fetch("/api/runs", {
    method: "POST",
  }).then((res) => res.json());
}

function createRunTest(name: string) {
  return fetch(`/api/run-test/${name}`, {
    method: "POST",
  }).then((res) => res.json());
}

export const RUNS_QUERY_KEY = ["runs"];

export function useRuns() {
  return useQuery<RunResponse[]>({
    queryKey: RUNS_QUERY_KEY,
    queryFn: fetchRuns,
    staleTime: Infinity,
  });
}

export function useRunContext() {
  const run = useContext(RunContext);
  if (!run) {
    throw new Error("No current run");
  }
  return run;
}

export function useMakeRun() {
  return useMutation({
    mutationFn: createRun,
  });
}

export function useRunTest() {
  return useMutation({
    mutationFn: (name: string) => createRunTest(name),
  });
}
