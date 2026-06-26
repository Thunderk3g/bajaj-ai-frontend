import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { ChevronLeftIcon } from "@/icons";
import { useContainers } from "@/monitoring/hooks/useContainers";
import { useStats } from "@/monitoring/hooks/useStats";
import { ContainerList } from "@/monitoring/components/ContainerList";
import { ContainerDetail } from "@/monitoring/components/ContainerDetail";
import { MonitoringShell, OfflineNotice } from "@/monitoring/components/MonitoringShell";
import { groupName } from "@/monitoring/lib/groupMeta";

/** Route `/monitoring/:agentId` — split ContainerList + ContainerDetail. */
export function AgentMonitor() {
  const { agentId = "" } = useParams();
  const { containers, loading, offline, unknownAgent } = useContainers(agentId);
  const stats = useStats(agentId);

  const [selected, setSelected] = useState<string | null>(null);

  // Default the selection to the first running container (else the first).
  useEffect(() => {
    if (selected && containers.some((c) => c.name === selected)) return;
    if (containers.length === 0) {
      setSelected(null);
      return;
    }
    const firstRunning = containers.find((c) => c.state === "running");
    setSelected((firstRunning ?? containers[0]).name);
  }, [containers, selected]);

  const friendly = groupName(agentId, agentId);

  useEffect(() => {
    document.title = `${friendly} · Monitoring · Bajaj Life`;
  }, [friendly]);

  const selectedContainer = useMemo(
    () => containers.find((c) => c.name === selected) ?? null,
    [containers, selected],
  );

  return (
    <MonitoringShell
      crumb={friendly}
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
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-6 sm:px-8">
        <Link
          to="/monitoring"
          className="mb-4 inline-flex items-center gap-1 self-start text-sm font-medium text-ink-muted hover:text-brand"
        >
          <ChevronLeftIcon width={16} height={16} />
          All agents
        </Link>

        {offline ? (
          <OfflineNotice />
        ) : unknownAgent ? (
          <OfflineNotice detail={`No agent group "${agentId}" is known to the backend.`} />
        ) : loading && containers.length === 0 ? (
          <div className="h-96 animate-pulse rounded-2xl border border-line bg-surface" aria-hidden="true" />
        ) : containers.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface px-6 py-8 text-center text-sm text-ink-muted">
            This agent has no containers.
          </p>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(220px,300px)_1fr]">
            {/* Left: container list */}
            <aside className="lg:max-h-[calc(100vh-12rem)] lg:overflow-auto">
              <ContainerList
                containers={containers}
                statsByName={stats.byName}
                selected={selected}
                onSelect={setSelected}
              />
            </aside>

            {/* Right: detail + logs */}
            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-e1 max-h-[calc(100vh-12rem)]">
              {selectedContainer ? (
                <ContainerDetail
                  container={selectedContainer}
                  stat={stats.byName.get(selectedContainer.name)}
                  cpuHistory={stats.cpuHistory.get(selectedContainer.name) ?? []}
                  memHistory={stats.memHistory.get(selectedContainer.name) ?? []}
                />
              ) : (
                <div className="grid flex-1 place-items-center p-8 text-sm text-ink-subtle">
                  Select a container.
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </MonitoringShell>
  );
}
