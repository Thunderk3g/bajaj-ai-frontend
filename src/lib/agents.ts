/**
 * The agent registry — the single source of truth for what the platform home
 * presents. Add an agent here and it appears on the landing page; wire its
 * `healthCheck` and the card reflects live reachability.
 *
 * Routing matches `ai-infra` nginx (path-based, single origin on the VM):
 *   /compliance         -> compliance-frontend:3000
 *   /compliance/api/*   -> compliance-backend:8000
 *   /seo, /seo/api/*    -> seo-frontend:3002 / seo-backend:8001 (built, not yet enabled)
 *   /pgadmin/*          -> shared-pgadmin:5050
 *   /health             -> nginx 200
 */

export type AgentStatus = "live" | "coming-soon" | "maintenance";
export type IconKey = "shield" | "search" | "database" | "sparkles";

export interface HealthCheck {
  /** Same-origin path probed by the browser (GET). */
  url: string;
  /** HTTP statuses treated as healthy. Default: any 2xx/3xx. */
  healthyStatuses?: number[];
}

export interface Agent {
  id: string;
  name: string;
  /** One short line under the name. */
  tagline: string;
  /** Slightly longer supporting sentence. */
  description: string;
  /** Where the card links; null = not navigable (coming soon). */
  href: string | null;
  status: AgentStatus;
  icon: IconKey;
  /** Short capability chips. */
  tags: string[];
  /** Optional live health probe; omit for agents that should not be probed. */
  healthCheck?: HealthCheck;
  /** Declared baseline uptime shown when no live metric is available (0..1). */
  uptime?: number;
  /**
   * Monitoring group id when it differs from `id`. The monitoring backend groups
   * containers by name-prefix (`compliance-`, `seo-`, `shared-`, ...), so the
   * "Data & Infrastructure" card (`id: "infra"`) must point at the `shared` group.
   */
  monitorGroup?: string;
}

/** Platform-wide health probe (nginx `location /health`). */
export const PLATFORM_HEALTH: HealthCheck = { url: "/health" };

export const AGENTS: Agent[] = [
  {
    id: "compliance",
    name: "Regulatory Compliance",
    tagline: "Pre-publication compliance for marketing content",
    description:
      "Reviews Bajaj Life marketing copy against IRDAI / SEBI rules and brand guidelines, grading each draft against past reviewer decisions.",
    href: "/compliance",
    status: "live",
    icon: "shield",
    tags: ["IRDAI", "SEBI", "Brand", "RAG"],
    healthCheck: { url: "/compliance/api/health" },
    uptime: 0.999,
  },
  {
    id: "seo",
    name: "SEO & GEO Intelligence",
    tagline: "Technical audits, AI grading & competitor intel",
    description:
      "Crawls and grades web properties — technical SEO, Core Web Vitals, content and competitor analysis with AI-visibility scoring.",
    href: null,
    status: "coming-soon",
    icon: "search",
    tags: ["Crawler", "GSC", "SEMrush", "AI grading"],
  },
  {
    id: "infra",
    name: "Data & Infrastructure",
    tagline: "Shared Postgres, Redis & pgAdmin console",
    description:
      "The shared backbone every agent runs on — pgvector-enabled Postgres, Redis cache, and the pgAdmin database console.",
    href: "/pgadmin/",
    status: "live",
    icon: "database",
    monitorGroup: "shared",
    tags: ["pgvector", "Redis", "pgAdmin"],
    // pgAdmin has no health endpoint; its root 302s to a login page. Treat the
    // redirect/auth responses as "reachable" so a logged-out probe still reads up.
    healthCheck: { url: "/pgadmin/", healthyStatuses: [200, 302, 401] },
    uptime: 0.999,
  },
];
