import type { ComponentType, SVGProps } from "react";
import { AGENTS, type IconKey } from "@/lib/agents";
import {
  AGENT_ICONS,
  ActivityIcon,
  DatabaseIcon,
  SparklesIcon,
} from "@/icons";

type IconComp = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Resolve a friendly icon + name for a monitoring group id.
 *
 * Per the spec, reuse the landing `AGENTS` registry where ids match (so the
 * monitoring section shows the same shield/search/etc. iconography), and fall
 * back to a per-group default + the backend-provided `label` otherwise.
 */
const FALLBACK_ICON: Record<string, IconComp> = {
  shared: DatabaseIcon,
  landing: SparklesIcon,
  monitoring: ActivityIcon,
  other: ActivityIcon,
};

export function groupIcon(id: string): IconComp {
  const registered = AGENTS.find((a) => a.id === id);
  if (registered) return AGENT_ICONS[registered.icon as IconKey];
  return FALLBACK_ICON[id] ?? ActivityIcon;
}

/** Friendly name: prefer the registry name, else the backend label. */
export function groupName(id: string, backendLabel: string): string {
  const registered = AGENTS.find((a) => a.id === id);
  return registered?.name ?? backendLabel;
}
