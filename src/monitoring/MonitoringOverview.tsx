import { useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { useAgents } from "@/monitoring/hooks/useAgents";
import { AgentMonitorCard } from "@/monitoring/components/AgentMonitorCard";
import { MonitoringShell, OfflineNotice } from "@/monitoring/components/MonitoringShell";

/** Route `/monitoring` — grid of per-agent monitoring cards. */
export function MonitoringOverview() {
  const { agents, loading, offline } = useAgents();

  useEffect(() => {
    document.title = "Monitoring · Bajaj Life AI Platform";
  }, []);

  return (
    <MonitoringShell
      actions={
        offline ? (
          <Badge tone="down" dot>
            Offline
          </Badge>
        ) : (
          !loading && (
            <Badge tone="ok" dot pulse>
              Live
            </Badge>
          )
        )
      }
    >
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-navy">Agent monitoring</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Live container health, CPU, RAM and logs — grouped by agent.
          </p>
        </div>

        {offline ? (
          <OfflineNotice />
        ) : loading && agents.length === 0 ? (
          <SkeletonGrid />
        ) : agents.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface px-6 py-8 text-center text-sm text-ink-muted">
            No containers visible.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <AgentMonitorCard key={a.id} agent={a} />
            ))}
          </div>
        )}
      </main>
    </MonitoringShell>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-56 animate-pulse rounded-2xl border border-line bg-surface shadow-e1"
        />
      ))}
    </div>
  );
}
