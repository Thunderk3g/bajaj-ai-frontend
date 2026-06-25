import { StatusDot } from "@/components/ui/StatusDot";
import type { Display } from "@/lib/status";

interface StatusStripProps {
  status: Display;
  liveCount: number;
  totalCount: number;
  lastChecked: number | null;
}

export function StatusStrip({ status, liveCount, totalCount, lastChecked }: StatusStripProps) {
  const time =
    lastChecked === null
      ? null
      : new Date(lastChecked).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="mx-auto mt-6 flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/70 px-4 py-3 sm:px-5"
      role="status"
      aria-live="polite"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="flex items-center gap-2.5">
          <StatusDot tone={status.tone} pulse={status.pulse} size={9} />
          <span className="text-sm font-semibold text-navy">{status.label}</span>
        </span>
        <span className="basis-full text-sm text-ink-muted sm:basis-auto">
          · {liveCount} of {totalCount} agents live
        </span>
      </div>
      {time && (
        <span className="font-mono text-xs text-ink-subtle" aria-hidden="true">
          Last checked {time}
        </span>
      )}
    </div>
  );
}
