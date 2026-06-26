import { useCallback, useEffect, useRef, useState } from "react";
import { client, type StreamHandle } from "@/monitoring/lib/client";
import type { LogLine } from "@/monitoring/lib/types";

/** Ring-buffer cap — older lines beyond this are trimmed. */
export const RING_CAP = 2000;
const TAIL = 500;
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 15000;

export type LogConnection = "connecting" | "open" | "reconnecting" | "error";

export interface LogEntry extends LogLine {
  /** Monotonic id so React keys are stable even with duplicate timestamps. */
  seq: number;
}

export interface ContainerLogsState {
  lines: LogEntry[];
  connection: LogConnection;
  /** True once the ring buffer has dropped earlier lines. */
  truncated: boolean;
  /** Set when the engine reported a hard error (e.g. container_not_found). */
  errorMessage: string | null;
  /** Imperative clear of the current buffer. */
  clear: () => void;
}

/**
 * Streams a container's log tail over SSE (via the client, which falls back to
 * a synthetic feed in mock mode). Keeps a bounded ring buffer (~RING_CAP) and
 * auto-reconnects with exponential backoff on transport drops. `enabled=false`
 * (e.g. for a stopped container) keeps the stream closed.
 */
export function useContainerLogs(
  name: string | null,
  enabled: boolean,
): ContainerLogsState {
  const [lines, setLines] = useState<LogEntry[]>([]);
  const [connection, setConnection] = useState<LogConnection>("connecting");
  const [truncated, setTruncated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const seqRef = useRef(0);

  const push = useCallback((line: LogLine) => {
    setLines((prev) => {
      const entry: LogEntry = { ...line, seq: seqRef.current++ };
      if (prev.length >= RING_CAP) {
        setTruncated(true);
        return [...prev.slice(prev.length - RING_CAP + 1), entry];
      }
      return [...prev, entry];
    });
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setTruncated(false);
  }, []);

  useEffect(() => {
    if (!name || !enabled) {
      setConnection("error");
      return;
    }

    let stopped = false;
    let handle: StreamHandle | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    // Reset buffer when (re)targeting a container.
    setLines([]);
    setTruncated(false);
    setErrorMessage(null);
    seqRef.current = 0;

    const open = () => {
      if (stopped) return;
      setConnection(attempt === 0 ? "connecting" : "reconnecting");

      handle = client.streamLogs(name, TAIL, {
        onOpen: () => {
          if (stopped) return;
          attempt = 0;
          setConnection("open");
        },
        onLine: (line) => {
          if (stopped) return;
          push(line);
        },
        onError: (message) => {
          if (stopped) return;
          // Hard engine errors are terminal; transport drops reconnect.
          if (message === "container_not_found" || message === "unknown_agent") {
            setErrorMessage(message);
            setConnection("error");
            handle?.();
            handle = null;
            return;
          }
          setConnection("reconnecting");
          handle?.();
          handle = null;
          const delay = Math.min(
            BACKOFF_BASE_MS * 2 ** attempt,
            BACKOFF_MAX_MS,
          );
          attempt += 1;
          retryTimer = setTimeout(open, delay);
        },
      });
    };

    // Seed with a backfill of recent lines, then open the live stream.
    void client
      .getLogs(name, TAIL)
      .then((res) => {
        if (stopped) return;
        for (const l of res.lines) push(l);
      })
      .catch(() => {
        /* backfill is best-effort; the stream is the source of truth */
      })
      .finally(() => {
        if (!stopped) open();
      });

    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      handle?.();
    };
    // `push` is stable (useCallback with no deps).
  }, [name, enabled, push]);

  return { lines, connection, truncated, errorMessage, clear };
}
