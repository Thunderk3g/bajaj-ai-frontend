import { useEffect, useState } from "react";
import { client, MonitoringError } from "@/monitoring/lib/client";
import type { Container } from "@/monitoring/lib/types";

const POLL_MS = 8000;

export interface ContainersState {
  containers: Container[];
  loading: boolean;
  /** Backend unreachable. */
  offline: boolean;
  /** Set when the agent id is unknown to the backend (400 unknown_agent). */
  unknownAgent: boolean;
}

/**
 * Loads an agent's container list (the relatively static metadata: state,
 * image, ports, restart count). Refreshed slowly — live numbers come from
 * `useStats`. The container roster itself rarely changes.
 */
export function useContainers(agentId: string): ContainersState {
  const [state, setState] = useState<ContainersState>({
    containers: [],
    loading: true,
    offline: false,
    unknownAgent: false,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ containers: [], loading: true, offline: false, unknownAgent: false });

    const load = async () => {
      try {
        const res = await client.getContainers(agentId);
        if (cancelled) return;
        setState({
          containers: res.containers,
          loading: false,
          offline: false,
          unknownAgent: false,
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof MonitoringError) {
          const unknownAgent = err.code === "unknown_agent";
          setState((prev) => ({
            ...prev,
            loading: false,
            offline: !unknownAgent,
            unknownAgent,
          }));
        } else {
          setState((prev) => ({ ...prev, loading: false, offline: true }));
        }
      }
    };

    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [agentId]);

  return state;
}
