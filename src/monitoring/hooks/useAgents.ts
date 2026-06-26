import { useEffect, useState } from "react";
import { client, MonitoringError } from "@/monitoring/lib/client";
import type { AgentSummary } from "@/monitoring/lib/types";

const POLL_MS = 4000;

export interface AgentsState {
  agents: AgentSummary[];
  generatedAt: string | null;
  loading: boolean;
  /** Backend unreachable / errored — drives the "Monitoring offline" notice. */
  offline: boolean;
}

/**
 * Loads the agent summaries for the overview and refreshes them periodically so
 * the per-agent CPU/RAM rollups stay live.
 */
export function useAgents(): AgentsState {
  const [state, setState] = useState<AgentsState>({
    agents: [],
    generatedAt: null,
    loading: true,
    offline: false,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await client.getAgents();
        if (cancelled) return;
        setState({
          agents: res.agents,
          generatedAt: res.generatedAt,
          loading: false,
          offline: false,
        });
      } catch (err) {
        if (cancelled) return;
        const offline = err instanceof MonitoringError;
        setState((prev) => ({ ...prev, loading: false, offline }));
      }
    };

    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return state;
}
