import type { Agent } from "@/lib/agents";
import type { LiveState, ProbeResult } from "@/lib/useHealth";

export type Severity = "ok" | "warn" | "down" | "idle";

export interface Display {
  tone: Severity;
  label: string;
  pulse: boolean;
}

/**
 * Resolve one agent's display from its declared status + live probe.
 *
 * A client-side probe can only tell us three useful things:
 *  - `up`        : reachable and healthy            -> green "Live"
 *  - `degraded`  : origin reached, upstream 5xx     -> red "Unreachable" (the container is down)
 *  - `down`/none : inconclusive (timeout / network / cross-origin local dev)
 *                  -> trust the declared "Live", no false alarm
 */
export function resolveAgentDisplay(agent: Agent, live: LiveState): Display {
  if (agent.status === "coming-soon") return { tone: "idle", label: "Coming soon", pulse: false };
  if (agent.status === "maintenance") return { tone: "warn", label: "Maintenance", pulse: true };
  if (live === "degraded") return { tone: "down", label: "Unreachable", pulse: true };
  if (live === "up") return { tone: "ok", label: "Live", pulse: true };
  return { tone: "ok", label: "Live", pulse: false };
}

/**
 * Collapse the agents into one platform banner. Positive signal wins and a lone
 * inconclusive probe never blanks the banner: a single timed-out fetch can't put
 * the whole platform into "down".
 */
export function aggregatePlatform(
  agents: Agent[],
  health: Record<string, ProbeResult>,
): Display {
  const displays = agents
    .filter((a) => a.status === "live" || a.status === "maintenance")
    .map((a) => resolveAgentDisplay(a, health[a.id]?.state ?? "unknown"));

  if (displays.some((d) => d.tone === "down"))
    return { tone: "down", label: "Service issue detected", pulse: true };
  if (displays.some((d) => d.tone === "warn"))
    return { tone: "warn", label: "Degraded performance", pulse: true };
  if (displays.some((d) => d.tone === "ok"))
    return { tone: "ok", label: "All systems operational", pulse: true };
  return { tone: "idle", label: "Checking status", pulse: false };
}
