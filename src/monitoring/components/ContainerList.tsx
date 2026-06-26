import { StatusDot, type Tone } from "@/components/ui/StatusDot";
import { cn } from "@/lib/utils";
import { formatPct } from "@/monitoring/lib/format";
import type { Container, ContainerStat } from "@/monitoring/lib/types";

/** Map a container state to a status-dot tone. */
function stateTone(state: Container["state"]): Tone {
  switch (state) {
    case "running":
      return "ok";
    case "restarting":
    case "paused":
    case "created":
      return "warn";
    case "exited":
    case "dead":
      return "down";
    default:
      return "idle";
  }
}

interface ContainerListProps {
  containers: Container[];
  statsByName: Map<string, ContainerStat>;
  selected: string | null;
  onSelect: (name: string) => void;
}

/** Left pane: selectable list of an agent's containers; stopped rows are muted. */
export function ContainerList({
  containers,
  statsByName,
  selected,
  onSelect,
}: ContainerListProps) {
  return (
    <ul className="flex flex-col gap-1.5" role="listbox" aria-label="Containers">
      {containers.map((c) => {
        const running = c.state === "running";
        const isSelected = c.name === selected;
        const stat = statsByName.get(c.name);
        return (
          <li key={c.id} role="option" aria-selected={isSelected}>
            <button
              type="button"
              onClick={() => onSelect(c.name)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                "focus-visible:outline-none focus-visible:shadow-focus",
                isSelected
                  ? "border-brand/40 bg-brand-soft"
                  : "border-line bg-surface hover:border-brand/30 hover:bg-surface-sunken",
                !running && "opacity-60",
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <StatusDot tone={stateTone(c.state)} pulse={running} size={8} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold text-navy">{c.name}</span>
                  <span className="truncate text-[11px] text-ink-subtle">{c.status}</span>
                </span>
              </span>
              <span className="shrink-0 text-right">
                {running && stat ? (
                  <span className="font-mono text-xs tabular-nums text-ink-muted">
                    {formatPct(stat.cpuPct)}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
                    {c.state}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
