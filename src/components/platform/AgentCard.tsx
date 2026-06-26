import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge, Tag } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { AGENT_ICONS, ArrowRightIcon, ExternalLinkIcon, ActivityIcon } from "@/icons";
import { formatUptime } from "@/lib/utils";
import { resolveAgentDisplay } from "@/lib/status";
import type { Agent } from "@/lib/agents";
import type { LiveState } from "@/lib/useHealth";

interface AgentCardProps {
  agent: Agent;
  live: LiveState;
}

/**
 * One agent on the platform home. The card itself is informational; the two
 * footer actions are explicit so there's no surprise navigation:
 *   • "Open app" / "Open console"  → the agent's own UI (separate container)
 *   • "Monitor"                    → this platform's /monitoring view for it
 * Monitoring is a first-class action on every card, including coming-soon ones.
 */
export function AgentCard({ agent, live }: AgentCardProps) {
  const Icon = AGENT_ICONS[agent.icon];
  const display = resolveAgentDisplay(agent, live);
  const isLink = agent.href !== null;
  const opensConsole = agent.href?.startsWith("/pgadmin") ?? false;
  const monitorGroup = agent.monitorGroup ?? agent.id;

  return (
    <div className="group relative h-full">
      <Card className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand ring-1 ring-brand/10">
            <Icon width={24} height={24} />
          </span>
          <Badge tone={display.tone} dot pulse={display.pulse}>
            {display.label}
          </Badge>
        </div>

        <div className="mt-5">
          <h3 className="text-lg font-bold tracking-tight text-navy">{agent.name}</h3>
          <p className="mt-1 text-sm font-medium text-ink-muted">{agent.tagline}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{agent.description}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {agent.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-line pt-4 text-xs font-medium text-ink-subtle">
          {agent.status === "live" && agent.uptime !== undefined ? (
            <>
              <StatusDot tone={display.tone} size={7} />
              {formatUptime(agent.uptime)} uptime
            </>
          ) : agent.status === "coming-soon" ? (
            <>
              <StatusDot tone="idle" size={7} />
              In the pipeline
            </>
          ) : (
            <StatusDot tone={display.tone} size={7} />
          )}
        </div>

        {/* mt-auto pins the actions to the bottom so cards of differing copy
            length keep their buttons aligned across the grid row. */}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          {isLink ? (
            <a
              href={agent.href!}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-brand text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:shadow-focus"
            >
              {opensConsole ? "Open console" : "Open app"}
              {opensConsole ? (
                <ExternalLinkIcon width={15} height={15} />
              ) : (
                <ArrowRightIcon width={15} height={15} />
              )}
            </a>
          ) : (
            <span className="inline-flex h-10 cursor-default items-center justify-center gap-1.5 rounded-xl border border-line bg-surface text-sm font-semibold text-ink-subtle">
              Coming soon
            </span>
          )}

          <Link
            to={`/monitoring/${monitorGroup}`}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line-strong bg-surface text-sm font-semibold text-navy transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:shadow-focus"
            aria-label={`Monitor ${agent.name} — containers, CPU, RAM and logs`}
          >
            <ActivityIcon width={15} height={15} />
            Monitor
          </Link>
        </div>
      </Card>
    </div>
  );
}
