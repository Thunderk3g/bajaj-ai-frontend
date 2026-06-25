import { useEffect, useState } from "react";
import type { Agent, HealthCheck } from "@/lib/agents";

export type LiveState = "unknown" | "up" | "degraded" | "down";

export interface ProbeResult {
  state: LiveState;
  checkedAt: number | null;
}

const TIMEOUT_MS = 6000;
const INTERVAL_MS = 30000;

async function probe(check: HealthCheck): Promise<LiveState> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(check.url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
      redirect: "follow",
    });
    if (res.ok) return "up";
    const allowed = check.healthyStatuses;
    if (allowed && allowed.includes(res.status)) return "up";
    // Reached the origin but the upstream answered unhealthily (e.g. 502/503).
    return "degraded";
  } catch {
    // Network error, timeout, or (in local dev) a cross-origin/unreachable host.
    return "down";
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Polls each agent's declared `healthCheck` from the browser. Because the
 * landing page and every agent share one origin behind nginx, these are
 * same-origin GETs in production. Agents without a `healthCheck` are reported
 * as "unknown" and simply fall back to their declared status in the UI.
 */
export function useHealth(agents: Agent[]): Record<string, ProbeResult> {
  const [results, setResults] = useState<Record<string, ProbeResult>>(() => seed(agents));

  useEffect(() => {
    // A flag local to THIS effect run — unlike a component-lifetime ref, it
    // correctly ignores in-flight probes from a torn-down run even under
    // StrictMode's double-invoke.
    let cancelled = false;

    // Honor the array-prop contract: add entries for new agents, drop removed.
    setResults((prev) => reconcile(prev, agents));

    const runAll = async () => {
      await Promise.all(
        agents
          .filter((a) => a.healthCheck)
          .map(async (a) => {
            const state = await probe(a.healthCheck!);
            if (cancelled) return;
            setResults((prev) => ({ ...prev, [a.id]: { state, checkedAt: Date.now() } }));
          }),
      );
    };

    void runAll();
    const id = setInterval(() => void runAll(), INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [agents]);

  return results;
}

function seed(agents: Agent[]): Record<string, ProbeResult> {
  return Object.fromEntries(
    agents.map((a) => [a.id, { state: "unknown" as LiveState, checkedAt: null }]),
  );
}

function reconcile(
  prev: Record<string, ProbeResult>,
  agents: Agent[],
): Record<string, ProbeResult> {
  const next: Record<string, ProbeResult> = {};
  for (const a of agents) next[a.id] = prev[a.id] ?? { state: "unknown", checkedAt: null };
  return next;
}
