import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowRightIcon } from "@/icons";
import { groupIcon, groupName } from "@/monitoring/lib/groupMeta";
import { formatBytes, formatPct } from "@/monitoring/lib/format";
import type { AgentSummary } from "@/monitoring/lib/types";

/** Overview tile: containers up/total, aggregate CPU, total RAM for one agent. */
export function AgentMonitorCard({ agent }: { agent: AgentSummary }) {
  const Icon = groupIcon(agent.id);
  const name = groupName(agent.id, agent.label);
  const allUp = agent.running === agent.containers;
  const tone = agent.containers === 0 ? "idle" : allUp ? "ok" : "warn";
  const statusLabel =
    agent.containers === 0
      ? "No containers"
      : allUp
        ? "All up"
        : `${agent.containers - agent.running} down`;

  return (
    <Link
      to={`/monitoring/${agent.id}`}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:shadow-focus"
      aria-label={`Open ${name} monitoring`}
    >
      <Card interactive className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand ring-1 ring-brand/10">
            <Icon width={24} height={24} />
          </span>
          <Badge tone={tone} dot pulse={tone === "ok"}>
            {statusLabel}
          </Badge>
        </div>

        <h3 className="mt-5 text-lg font-bold tracking-tight text-navy">{name}</h3>
        <p className="mt-1 font-mono text-xs text-ink-subtle">{agent.prefix}*</p>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
          <Metric label="Containers" value={`${agent.running}/${agent.containers}`} />
          <Metric label="CPU" value={formatPct(agent.aggCpuPct)} />
          <Metric label="RAM" value={formatBytes(agent.totalMemBytes)} />
        </dl>

        <div className="mt-5 flex items-center justify-end">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand group-hover:text-brand-hover">
            Inspect
            <ArrowRightIcon width={16} height={16} />
          </span>
        </div>
      </Card>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="order-2 text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
        {label}
      </dt>
      <dd className="order-1 text-base font-bold tabular-nums tracking-tight text-navy">
        {value}
      </dd>
    </div>
  );
}
