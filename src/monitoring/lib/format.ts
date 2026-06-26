/** Formatting helpers for the monitoring UI. */

/** Human-readable bytes, e.g. 1503238553 -> "1.4 GiB". `0` limit = unlimited. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/** "used / limit" string; `0` limit renders as "— (no limit)". */
export function formatMem(usedBytes: number, limitBytes: number): string {
  const used = formatBytes(usedBytes);
  if (limitBytes <= 0) return `${used} / ∞`;
  return `${used} / ${formatBytes(limitBytes)}`;
}

/** CPU% to one decimal, e.g. "38.4%". */
export function formatPct(pct: number): string {
  return `${(Math.round(pct * 10) / 10).toFixed(1)}%`;
}

/** Compact relative uptime from an RFC3339 start time, e.g. "6h 4m". */
export function formatUptimeSince(startedAt: string): string {
  const start = Date.parse(startedAt);
  if (Number.isNaN(start)) return "—";
  let secs = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const d = Math.floor(secs / 86400);
  secs -= d * 86400;
  const h = Math.floor(secs / 3600);
  secs -= h * 3600;
  const m = Math.floor(secs / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** HH:MM:SS from an RFC3339 timestamp (local time). */
export function formatClock(ts: string): string {
  const t = Date.parse(ts);
  if (Number.isNaN(t)) return "";
  return new Date(t).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
