import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import type { Tone } from "@/components/ui/StatusDot";
import { ChevronLeftIcon } from "@/icons";
import { MetricSparkline } from "@/monitoring/components/MetricSparkline";
import { MetricBar, memTone } from "@/monitoring/components/MetricBar";
import { LogViewer } from "@/monitoring/components/LogViewer";
import { formatBytes, formatMem, formatPct, formatUptimeSince } from "@/monitoring/lib/format";
import type { Container, ContainerHealth, ContainerStat } from "@/monitoring/lib/types";

function healthTone(health: ContainerHealth): Tone {
  switch (health) {
    case "healthy":
      return "ok";
    case "starting":
      return "warn";
    case "unhealthy":
      return "down";
    default:
      return "idle";
  }
}

interface ContainerDetailProps {
  container: Container;
  stat: ContainerStat | undefined;
  cpuHistory: number[];
  memHistory: number[];
}

/** Right pane: live stats (CPU sparkline, RAM bar+sparkline), metadata, logs. */
export function ContainerDetail({
  container,
  stat,
  cpuHistory,
  memHistory,
}: ContainerDetailProps) {
  const [statsOpen, setStatsOpen] = useState(true);
  const running = container.state === "running";
  const cpuPct = stat?.cpuPct ?? 0;
  const memPct = stat?.memPct ?? 0;
  const memUsed = stat?.memUsedBytes ?? 0;
  const memLimit = stat?.memLimitBytes ?? container.memLimitBytes;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold tracking-tight text-navy">
            {container.name}
          </h2>
          <p className="truncate font-mono text-xs text-ink-subtle">{container.image}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={running ? "ok" : "down"} dot pulse={running}>
            {container.state}
          </Badge>
          {container.health !== "none" && (
            <Badge tone={healthTone(container.health)} variant="outline">
              {container.health}
            </Badge>
          )}
          <button
            onClick={() => setStatsOpen(!statsOpen)}
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-line hover:text-ink"
            aria-label={statsOpen ? "Collapse metrics" : "Expand metrics"}
            title={statsOpen ? "Collapse" : "Expand"}
          >
            <ChevronLeftIcon
              width={18}
              height={18}
              className={`transition-transform ${statsOpen ? "rotate-90" : "rotate-180"}`}
            />
          </button>
        </div>
      </div>

      {/* Stats panel & metadata (collapsible) */}
      {statsOpen && (
        <>
          <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2">
            {/* CPU */}
            <div className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
                  CPU
                </span>
                <span className="font-mono text-lg font-bold tabular-nums text-navy">
                  {running ? formatPct(cpuPct) : "—"}
                </span>
              </div>
              <div className="mt-3">
                <MetricSparkline data={running ? cpuHistory : []} className="w-full text-brand" width={260} height={44} label="CPU" />
              </div>
            </div>

            {/* RAM */}
            <div className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
                  RAM
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums text-navy">
                  {running ? `${formatPct(memPct)} · ${formatMem(memUsed, memLimit)}` : "—"}
                </span>
              </div>
              <div className="mt-3">
                <MetricBar pct={running ? memPct : 0} />
              </div>
              <div className="mt-2">
                <MetricSparkline
                  data={running ? memHistory : []}
                  max={100}
                  className={
                    running
                      ? memTone(memPct) === "down"
                        ? "w-full text-down"
                        : memTone(memPct) === "warn"
                          ? "w-full text-warn"
                          : "w-full text-ok"
                      : "w-full text-ok"
                  }
                  width={260}
                  height={36}
                  label="RAM"
                />
              </div>
            </div>
          </div>

          {/* Metadata */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 pb-4 sm:grid-cols-4">
            <Meta label="State" value={container.status} />
            <Meta label="Uptime" value={running ? formatUptimeSince(container.startedAt) : "—"} />
            <Meta label="Restarts" value={String(container.restartCount)} />
            <Meta label="Mem limit" value={memLimit > 0 ? formatBytes(memLimit) : "unlimited"} />
            <Meta
              label="Ports"
              value={container.ports.length ? container.ports.join(", ") : "—"}
            />
            <Meta label="PIDs" value={running && stat ? String(stat.pids) : "—"} />
            <Meta
              label="Net RX"
              value={running && stat ? formatBytes(stat.netRxBytes) : "—"}
            />
            <Meta
              label="Net TX"
              value={running && stat ? formatBytes(stat.netTxBytes) : "—"}
            />
          </dl>
        </>
      )}

      {/* Logs */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-line">
        <div className="px-5 pt-3 text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
          Live logs
        </div>
        <div className="mt-2 flex min-h-0 flex-1 flex-col">
          <LogViewer key={container.name} name={container.name} enabled={running} />
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-ink" title={value}>
        {value}
      </dd>
    </div>
  );
}
