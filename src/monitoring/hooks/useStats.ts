import { useEffect, useRef, useState } from "react";
import { client, MonitoringError } from "@/monitoring/lib/client";
import type { ContainerStat } from "@/monitoring/lib/types";

const POLL_MS = 2500;
/** Max points kept in the rolling sparkline history, per container per metric. */
export const HISTORY_CAP = 40;

/** Rolling history keyed by container name. */
export type History = Map<string, number[]>;

export interface StatsState {
  /** Latest snapshot keyed by container name. */
  byName: Map<string, ContainerStat>;
  cpuHistory: History;
  memHistory: History;
  generatedAt: string | null;
  loading: boolean;
  offline: boolean;
}

/**
 * Append `value` to the rolling buffer for `key`, capping length at `cap`
 * (drops oldest). Returns a NEW Map (immutable update) so React re-renders.
 * Pure and exported for unit testing.
 */
export function appendCapped(
  history: History,
  key: string,
  value: number,
  cap: number,
): History {
  const next = new Map(history);
  const prev = next.get(key) ?? [];
  const arr = prev.length >= cap ? [...prev.slice(prev.length - cap + 1), value] : [...prev, value];
  next.set(key, arr);
  return next;
}

/** Drop history entries whose container is no longer present. */
function prune(history: History, liveNames: Set<string>): History {
  let changed = false;
  const next = new Map(history);
  for (const k of next.keys()) {
    if (!liveNames.has(k)) {
      next.delete(k);
      changed = true;
    }
  }
  return changed ? next : history;
}

/**
 * Polls `GET /stats?agent=` every ~2500ms and keeps a short rolling history of
 * CPU% and mem% per container (capped at HISTORY_CAP points) to feed the
 * sparklines. One poll updates the whole agent's container list.
 */
export function useStats(agentId: string): StatsState {
  const [state, setState] = useState<StatsState>(() => ({
    byName: new Map(),
    cpuHistory: new Map(),
    memHistory: new Map(),
    generatedAt: null,
    loading: true,
    offline: false,
  }));

  // Keep latest history in refs so the interval closure always appends to the
  // newest buffers without re-subscribing on every tick.
  const cpuRef = useRef<History>(new Map());
  const memRef = useRef<History>(new Map());

  useEffect(() => {
    let cancelled = false;
    cpuRef.current = new Map();
    memRef.current = new Map();
    setState({
      byName: new Map(),
      cpuHistory: new Map(),
      memHistory: new Map(),
      generatedAt: null,
      loading: true,
      offline: false,
    });

    const load = async () => {
      try {
        const res = await client.getStats(agentId);
        if (cancelled) return;

        const byName = new Map<string, ContainerStat>();
        const liveNames = new Set<string>();
        let cpuHist = prune(cpuRef.current, new Set(res.stats.map((s) => s.name)));
        let memHist = prune(memRef.current, new Set(res.stats.map((s) => s.name)));

        for (const s of res.stats) {
          byName.set(s.name, s);
          liveNames.add(s.name);
          cpuHist = appendCapped(cpuHist, s.name, s.cpuPct, HISTORY_CAP);
          memHist = appendCapped(memHist, s.name, s.memPct, HISTORY_CAP);
        }

        cpuRef.current = cpuHist;
        memRef.current = memHist;

        setState({
          byName,
          cpuHistory: cpuHist,
          memHistory: memHist,
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
  }, [agentId]);

  return state;
}
