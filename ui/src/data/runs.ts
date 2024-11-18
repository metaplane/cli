import { useMutation, useQuery } from "@tanstack/react-query";
import type { RunResponse } from "../../../cli/src/dbt/ui/api";

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

export function useRuns() {
  return useQuery<RunResponse[]>({
    queryKey: ["runs"],
    queryFn: fetchRuns,
    refetchInterval: 1000,
  });
}

export function useRun(runId: string) {
  return useQuery<RunResponse[], Error, RunResponse | undefined>({
    queryKey: ["runs", runId],
    queryFn: fetchRuns,
    select: (data) => data.find((run) => run.id === runId),
    staleTime: Infinity, // never goes stale
  });
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
