/**
 * Typed fetch/EventSource client for the monitoring backend.
 *
 * Base path (through nginx): `/monitoring/api`.
 *
 * In dev, when `import.meta.env.DEV && import.meta.env.VITE_MONITORING_MOCK !== "0"`,
 * every method routes to `mock.ts` so the UI is fully developable/testable with
 * no backend. Set `VITE_MONITORING_MOCK=0` to hit a real backend from dev.
 */

import { mock, MockHttpError } from "@/monitoring/lib/mock";
import type {
  AgentsResponse,
  ContainersResponse,
  HealthResponse,
  LogLine,
  LogsResponse,
  StatsResponse,
} from "@/monitoring/lib/types";

export const BASE = "/monitoring/api";

/** True when the client should serve from `mock.ts` instead of the network. */
export const USE_MOCK =
  import.meta.env.DEV && import.meta.env.VITE_MONITORING_MOCK !== "0";

/** Thrown for any non-2xx / unreachable response. `code` is the API error code. */
export class MonitoringError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
    this.name = "MonitoringError";
  }
}

/** A handle returned by `streamLogs`; call to stop the stream. */
export type StreamHandle = () => void;

export interface StreamHandlers {
  onLine: (line: LogLine) => void;
  /** Called when the stream errors or the engine reports an error. */
  onError: (message: string) => void;
  /** Called once the underlying connection opens (real SSE only; optional). */
  onOpen?: () => void;
}

async function getJSON<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  } catch {
    // Network error / origin unreachable → treat like the backend's 502.
    throw new MonitoringError(0, "engine_unreachable");
  }
  if (!res.ok) {
    let code = `http_${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body && typeof body.error === "string") code = body.error;
    } catch {
      /* non-JSON body — keep the generic code */
    }
    throw new MonitoringError(res.status, code);
  }
  return (await res.json()) as T;
}

function fromMock<T>(fn: () => T): Promise<T> {
  try {
    return Promise.resolve(fn());
  } catch (err) {
    if (err instanceof MockHttpError) {
      return Promise.reject(new MonitoringError(err.status, err.code));
    }
    return Promise.reject(err);
  }
}

export const client = {
  getAgents(): Promise<AgentsResponse> {
    if (USE_MOCK) return fromMock(() => mock.getAgents());
    return getJSON<AgentsResponse>("/agents");
  },

  getContainers(agent: string): Promise<ContainersResponse> {
    if (USE_MOCK) return fromMock(() => mock.getContainers(agent));
    return getJSON<ContainersResponse>(`/containers?agent=${encodeURIComponent(agent)}`);
  },

  getStats(agent: string): Promise<StatsResponse> {
    if (USE_MOCK) return fromMock(() => mock.getStats(agent));
    return getJSON<StatsResponse>(`/stats?agent=${encodeURIComponent(agent)}`);
  },

  getLogs(name: string, tail = 500): Promise<LogsResponse> {
    if (USE_MOCK) return fromMock(() => mock.getLogs(name, tail));
    const t = Math.min(Math.max(tail, 1), 2000);
    return getJSON<LogsResponse>(
      `/containers/${encodeURIComponent(name)}/logs?tail=${t}`,
    );
  },

  getHealth(): Promise<HealthResponse> {
    if (USE_MOCK) return fromMock(() => mock.getHealth());
    return getJSON<HealthResponse>("/health");
  },

  /**
   * Open the SSE log tail for a container. Returns a handle to close it.
   * In mock mode, a synthetic interval feed stands in for the EventSource.
   */
  streamLogs(name: string, tail: number, handlers: StreamHandlers): StreamHandle {
    if (USE_MOCK) {
      handlers.onOpen?.();
      return mock.streamLogs(name, handlers.onLine, handlers.onError);
    }

    const t = Math.min(Math.max(tail, 1), 2000);
    const url = `${BASE}/containers/${encodeURIComponent(name)}/logs/stream?tail=${t}`;
    const es = new EventSource(url);

    es.onopen = () => handlers.onOpen?.();

    es.onmessage = (ev: MessageEvent<string>) => {
      try {
        const line = JSON.parse(ev.data) as LogLine;
        handlers.onLine(line);
      } catch {
        /* ignore malformed frames */
      }
    };

    // Backend emits `event: error\ndata: {"error":"..."}` on engine failure.
    es.addEventListener("error", (ev: MessageEvent<string>) => {
      // A typed `error` event carries data; a transport drop does not.
      if (ev.data) {
        let message = "engine_unreachable";
        try {
          const body = JSON.parse(ev.data) as { error?: string };
          if (body?.error) message = body.error;
        } catch {
          /* keep default */
        }
        handlers.onError(message);
      } else {
        // Connection-level error (drop / reconnecting). The hook owns backoff.
        handlers.onError("disconnected");
      }
    });

    return () => es.close();
  },
};
