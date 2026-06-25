// Public surface of the Bajaj AI Platform design system.
// This barrel is the entry the /design-sync converter bundles so claude.ai/design
// builds with the real Bajaj components.

// Primitives
export { Button, type ButtonProps } from "@/components/ui/Button";
export { Badge, Tag } from "@/components/ui/Badge";
export { Card } from "@/components/ui/Card";
export { StatusDot, type Tone } from "@/components/ui/StatusDot";

// Platform compositions
export { TopBar } from "@/components/platform/TopBar";
export { Hero } from "@/components/platform/Hero";
export { AgentCard } from "@/components/platform/AgentCard";
export { StatusStrip } from "@/components/platform/StatusStrip";
export { Footer } from "@/components/platform/Footer";

// Brand assets
export {
  BajajMark,
  ShieldIcon,
  SearchIcon,
  DatabaseIcon,
  SparklesIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  ClockIcon,
} from "@/icons";

// Domain types used by the components
export type { Agent, AgentStatus, IconKey } from "@/lib/agents";
export type { LiveState } from "@/lib/useHealth";
