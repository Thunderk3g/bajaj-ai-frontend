import { useMemo } from "react";
import { TopBar } from "@/components/platform/TopBar";
import { Hero } from "@/components/platform/Hero";
import { StatusStrip } from "@/components/platform/StatusStrip";
import { AgentCard } from "@/components/platform/AgentCard";
import { Footer } from "@/components/platform/Footer";
import { AGENTS } from "@/lib/agents";
import { useHealth } from "@/lib/useHealth";
import { aggregatePlatform } from "@/lib/status";

export function Landing() {
  const health = useHealth(AGENTS);

  const status = useMemo(() => aggregatePlatform(AGENTS, health), [health]);
  const liveCount = useMemo(() => AGENTS.filter((a) => a.status === "live").length, []);
  const lastChecked = useMemo(() => {
    const times = Object.values(health)
      .map((r) => r.checkedAt)
      .filter((t): t is number => t !== null);
    return times.length ? Math.max(...times) : null;
  }, [health]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <TopBar status={status} />

      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Hero liveCount={liveCount} totalCount={AGENTS.length} />

        <div className="px-5 sm:px-8">
          <StatusStrip
            status={status}
            liveCount={liveCount}
            totalCount={AGENTS.length}
            lastChecked={lastChecked}
          />
        </div>

        <section id="agents" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-12 sm:px-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-navy">Agents</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Everything running on the platform, with live health.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {AGENTS.map((agent) => (
              <AgentCard key={agent.id} agent={agent} live={health[agent.id]?.state ?? "unknown"} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
