/** Client-side log-level inference (the backend ships raw text — §3). */

export type LogLevel = "error" | "warn" | "info" | "debug" | "other";

export const LOG_LEVELS: LogLevel[] = ["error", "warn", "info", "debug", "other"];

/** Infer a level from a log line's text by matching common level tokens. */
export function inferLevel(text: string): LogLevel {
  // Look only at the head of the line where level tokens normally sit.
  const head = text.slice(0, 64).toUpperCase();
  if (/\b(ERROR|ERR|FATAL|CRITICAL|PANIC)\b/.test(head)) return "error";
  if (/\b(WARN|WARNING)\b/.test(head)) return "warn";
  if (/\b(INFO|NOTICE)\b/.test(head)) return "info";
  if (/\b(DEBUG|TRACE|VERBOSE)\b/.test(head)) return "debug";
  return "other";
}

/** Tailwind text-color class for a level (light theme, AA-safe). */
export function levelColor(level: LogLevel): string {
  switch (level) {
    case "error":
      return "text-down-text";
    case "warn":
      return "text-warn-text";
    case "info":
      return "text-ink";
    case "debug":
      return "text-ink-subtle";
    default:
      return "text-ink-muted";
  }
}
