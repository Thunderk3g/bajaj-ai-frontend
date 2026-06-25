import { Card } from "@/components/ui/Card";
import { Badge, Tag } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { AGENT_ICONS, ArrowRightIcon, ExternalLinkIcon } from "@/icons";
import { formatUptime } from "@/lib/utils";
import { resolveAgentDisplay } from "@/lib/status";
import type { Agent } from "@/lib/agents";
import type { LiveState } from "@/lib/useHealth";

interface AgentCardProps {
  agent: Agent;
  live: LiveState;
}

export function AgentCard({ agent, live }: AgentCardProps) {
  const Icon = AGENT_ICONS[agent.icon];
  const display = resolveAgentDisplay(agent, live);
  const isLink = agent.href !== null;
  const titleId = `agent-${agent.id}-title`;
  const descId = `agent-${agent.id}-tagline`;
  const opensConsole = agent.href?.startsWith("/pgadmin") ?? false;

  const inner = (
    <Card interactive={isLink} className="flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand ring-1 ring-brand/10">
          <Icon width={24} height={24} />
        </span>
        <Badge tone={display.tone} dot pulse={display.pulse}>
          {display.label}
        </Badge>
      </div>

      <div className="mt-5">
        <h3 id={titleId} className="text-lg font-bold tracking-tight text-navy">
          {agent.name}
        </h3>
        <p id={descId} className="mt-1 text-sm font-medium text-ink-muted">
          {agent.tagline}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{agent.description}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {agent.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        <span className="flex items-center gap-2 text-xs font-medium text-ink-subtle">
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
            <span />
          )}
        </span>

        {isLink ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand group-hover:text-brand-hover">
            {opensConsole ? "Open console" : "Open"}
            {opensConsole ? (
              <ExternalLinkIcon width={16} height={16} />
            ) : (
              <ArrowRightIcon width={16} height={16} />
            )}
          </span>
        ) : (
          <span className="text-sm font-semibold text-ink-subtle">Soon</span>
        )}
      </div>
    </Card>
  );

  if (!isLink) return <div className="group h-full">{inner}</div>;
  return (
    <a
      href={agent.href!}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:shadow-focus"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {inner}
    </a>
  );
}
