import { clsx, type ClassValue } from "clsx";

/** Tailwind-friendly className combiner. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Format a fractional uptime (0..1) as a percentage string, e.g. 0.999 -> "99.9%". */
export function formatUptime(fraction: number): string {
  const pct = Math.max(0, Math.min(100, fraction * 100));
  return `${pct.toFixed(pct >= 99.95 ? 2 : 1)}%`;
}
