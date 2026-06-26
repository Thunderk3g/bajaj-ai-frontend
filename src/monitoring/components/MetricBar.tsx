import type { Tone } from "@/components/ui/StatusDot";
import { cn } from "@/lib/utils";

/** RAM-usage tone thresholds (spec §5): ok < 75, warn < 90, down ≥ 90. */
export function memTone(pct: number): Extract<Tone, "ok" | "warn" | "down"> {
  if (pct >= 90) return "down";
  if (pct >= 75) return "warn";
  return "ok";
}

const FILL: Record<"ok" | "warn" | "down", string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  down: "bg-down",
};

interface MetricBarProps {
  /** Percentage 0..100. */
  pct: number;
  className?: string;
}

/** A thin used/limit progress bar whose fill tone follows the % thresholds. */
export function MetricBar({ pct, className }: MetricBarProps) {
  const clamped = Math.max(0, Math.min(100, pct));
  const tone = memTone(clamped);
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-idle-soft", className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", FILL[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
