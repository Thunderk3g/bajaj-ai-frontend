import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useContainerLogs } from "@/monitoring/hooks/useContainerLogs";
import { formatClock } from "@/monitoring/lib/format";
import { inferLevel, levelColor, LOG_LEVELS, type LogLevel } from "@/monitoring/lib/logLevel";

interface LogViewerProps {
  /** Container name to stream. */
  name: string;
  /** False for stopped containers — keeps the stream closed. */
  enabled: boolean;
}

type LevelFilter = LogLevel | "all";

/** Distance (px) from the bottom within which we consider the view "at bottom". */
const BOTTOM_SLACK = 24;

/**
 * Streamed log tail with: follow toggle (auto-pauses when the user scrolls up,
 * resumes via the toggle / scroll-to-bottom), text search, level filter, an
 * "earlier lines trimmed" marker when the ring buffer caps, and a visible
 * "reconnecting…" chip on SSE drops.
 */
export function LogViewer({ name, enabled }: LogViewerProps) {
  const { lines, connection, truncated, errorMessage, clear } = useContainerLogs(name, enabled);

  const [follow, setFollow] = useState(true);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");

  const scrollRef = useRef<HTMLDivElement>(null);
  // Guards programmatic scrolls from being mistaken for manual ones.
  const autoScrolling = useRef(false);

  const decorated = useMemo(
    () => lines.map((l) => ({ ...l, level: inferLevel(l.text) })),
    [lines],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return decorated.filter((l) => {
      if (level !== "all" && l.level !== level) return false;
      if (q && !l.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [decorated, query, level]);

  // Follow: stick to the bottom as new (filtered) lines arrive.
  useEffect(() => {
    if (!follow) return;
    const el = scrollRef.current;
    if (!el) return;
    autoScrolling.current = true;
    el.scrollTop = el.scrollHeight;
    // Release the guard after the scroll settles.
    const id = requestAnimationFrame(() => {
      autoScrolling.current = false;
    });
    return () => cancelAnimationFrame(id);
  }, [filtered.length, follow]);

  // Manual scroll-up pauses follow; scrolling back to the bottom resumes it.
  const onScroll = () => {
    if (autoScrolling.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_SLACK;
    if (atBottom) {
      if (!follow) setFollow(true);
    } else if (follow) {
      setFollow(false);
    }
  };

  const connectionChip =
    connection === "reconnecting" ? (
      <Badge tone="warn" dot pulse>
        Reconnecting…
      </Badge>
    ) : connection === "connecting" ? (
      <Badge tone="idle" dot pulse>
        Connecting…
      </Badge>
    ) : connection === "error" ? (
      <Badge tone="down" dot>
        {errorMessage === "container_not_found" ? "Not found" : "Stream offline"}
      </Badge>
    ) : (
      <Badge tone="ok" dot pulse>
        Live
      </Badge>
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search logs…"
          aria-label="Search logs"
          className="h-8 min-w-[8rem] flex-1 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:shadow-focus"
        />
        <label className="sr-only" htmlFor={`log-level-${name}`}>
          Filter by level
        </label>
        <select
          id={`log-level-${name}`}
          value={level}
          onChange={(e) => setLevel(e.target.value as LevelFilter)}
          className="h-8 rounded-lg border border-line bg-surface px-2 text-sm text-ink focus-visible:outline-none focus-visible:shadow-focus"
        >
          <option value="all">All levels</option>
          {LOG_LEVELS.map((lv) => (
            <option key={lv} value={lv}>
              {lv[0].toUpperCase() + lv.slice(1)}
            </option>
          ))}
        </select>
        <Button
          variant={follow ? "primary" : "secondary"}
          size="sm"
          onClick={() => setFollow((f) => !f)}
          aria-pressed={follow}
        >
          {follow ? "Following" : "Paused"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={clear}
          disabled={lines.length === 0}
          title="Clear the log buffer"
        >
          Clear
        </Button>
        {connectionChip}
      </div>

      {/* Log body */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-auto bg-navy-900/[0.02] px-3 py-2 font-mono text-xs leading-relaxed"
        role="log"
        aria-live={follow ? "polite" : "off"}
        aria-label={`${name} logs`}
      >
        {truncated && (
          <div className="mb-1 select-none text-center text-[11px] italic text-ink-subtle">
            — earlier lines trimmed —
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-ink-subtle">
            {lines.length === 0 ? "No log lines yet." : "No lines match the current filter."}
          </div>
        ) : (
          filtered.map((l) => (
            <div key={l.seq} className="flex gap-2 whitespace-pre-wrap break-all">
              <span className="shrink-0 select-none text-ink-subtle">{formatClock(l.ts)}</span>
              <span className={cn("min-w-0", levelColor(l.level))}>{l.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
