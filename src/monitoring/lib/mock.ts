/**
 * Dev fixtures for the monitoring UI. Used by `client.ts` when
 * `import.meta.env.DEV && import.meta.env.VITE_MONITORING_MOCK !== "0"`, so the
 * whole UI is developable and testable with NO backend running.
 *
 * The signal MOVES: CPU/mem are derived from a smooth time-based wander per
 * container, so sparklines animate as the client polls. Logs are synthesised on
 * an interval to drive a realistic streaming tail.
 *
 * Shapes here conform to `types.ts` (and therefore §3).
 */

import type {
  AgentSummary,
  AgentsResponse,
  Container,
  ContainerHealth,
  ContainersResponse,
  ContainerStat,
  ContainerState,
  HealthResponse,
  LogLine,
  LogsResponse,
  StatsResponse,
} from "@/monitoring/lib/types";

const GiB = 1024 * 1024 * 1024;

interface MockContainer {
  id: string;
  name: string;
  image: string;
  state: ContainerState;
  status: string;
  startedAt: string;
  restartCount: number;
  health: ContainerHealth;
  memLimitBytes: number;
  ports: string[];
  /** Baseline CPU% the wander oscillates around. */
  cpuBase: number;
  /** Baseline mem fraction (0..1) of the limit. */
  memBase: number;
  /** Phase offset so containers don't move in lockstep. */
  phase: number;
}

interface MockAgent {
  id: string;
  label: string;
  prefix: string;
  containers: MockContainer[];
}

function startedHoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

const AGENTS: MockAgent[] = [
  {
    id: "compliance",
    label: "Regulatory Compliance",
    prefix: "compliance-",
    containers: [
      {
        id: "c0mpl1ance0backend",
        name: "compliance-backend",
        image: "localhost/compliance-backend:latest",
        state: "running",
        status: "Up 6 hours",
        startedAt: startedHoursAgo(6),
        restartCount: 0,
        health: "healthy",
        memLimitBytes: 2 * GiB,
        ports: ["8000/tcp"],
        cpuBase: 34,
        memBase: 0.62,
        phase: 0,
      },
      {
        id: "c0mpl1ance0frontend",
        name: "compliance-frontend",
        image: "localhost/compliance-frontend:latest",
        state: "running",
        status: "Up 6 hours",
        startedAt: startedHoursAgo(6),
        restartCount: 1,
        health: "healthy",
        memLimitBytes: 1 * GiB,
        ports: ["3000/tcp"],
        cpuBase: 9,
        memBase: 0.31,
        phase: 1.7,
      },
    ],
  },
  {
    id: "seo",
    label: "SEO & GEO Intelligence",
    prefix: "seo-",
    containers: [
      {
        id: "se00backend00",
        name: "seo-backend",
        image: "localhost/seo-backend:latest",
        state: "running",
        status: "Up 2 days",
        startedAt: startedHoursAgo(49),
        restartCount: 0,
        health: "healthy",
        memLimitBytes: 2 * GiB,
        ports: ["8001/tcp"],
        cpuBase: 22,
        memBase: 0.48,
        phase: 0.6,
      },
      {
        id: "se00crawler000",
        name: "seo-crawler",
        image: "localhost/seo-crawler:latest",
        state: "running",
        status: "Up 2 days (healthy)",
        startedAt: startedHoursAgo(49),
        restartCount: 0,
        health: "healthy",
        memLimitBytes: 4 * GiB,
        ports: [],
        cpuBase: 58,
        memBase: 0.74,
        phase: 2.4,
      },
      {
        id: "se00worker0000",
        name: "seo-worker",
        image: "localhost/seo-worker:latest",
        state: "exited",
        status: "Exited (0) 20 minutes ago",
        startedAt: startedHoursAgo(50),
        restartCount: 3,
        health: "none",
        memLimitBytes: 1 * GiB,
        ports: [],
        cpuBase: 0,
        memBase: 0,
        phase: 0,
      },
    ],
  },
  {
    id: "shared",
    label: "Shared Infrastructure",
    prefix: "shared-",
    containers: [
      {
        id: "shared0postgres0",
        name: "shared-postgres",
        image: "docker.io/library/postgres:16",
        state: "running",
        status: "Up 9 days (healthy)",
        startedAt: startedHoursAgo(216),
        restartCount: 0,
        health: "healthy",
        memLimitBytes: 4 * GiB,
        ports: ["5432/tcp"],
        cpuBase: 12,
        memBase: 0.55,
        phase: 1.1,
      },
      {
        id: "shared0redis000",
        name: "shared-redis",
        image: "docker.io/library/redis:7",
        state: "running",
        status: "Up 9 days",
        startedAt: startedHoursAgo(216),
        restartCount: 0,
        health: "healthy",
        memLimitBytes: 512 * 1024 * 1024,
        ports: ["6379/tcp"],
        cpuBase: 4,
        memBase: 0.22,
        phase: 3.0,
      },
      {
        id: "shared0nginx000",
        name: "shared-nginx",
        image: "docker.io/library/nginx:1.27",
        state: "running",
        status: "Up 9 days",
        startedAt: startedHoursAgo(216),
        restartCount: 0,
        health: "none",
        memLimitBytes: 256 * 1024 * 1024,
        ports: ["80/tcp", "443/tcp"],
        cpuBase: 6,
        memBase: 0.18,
        phase: 0.3,
      },
    ],
  },
  {
    id: "landing",
    label: "Platform Home",
    prefix: "landing-",
    containers: [
      {
        id: "land1ngfrontend0",
        name: "landing-frontend",
        image: "localhost/landing-frontend:latest",
        state: "running",
        status: "Up 6 hours",
        startedAt: startedHoursAgo(6),
        restartCount: 0,
        health: "none",
        memLimitBytes: 256 * 1024 * 1024,
        ports: ["80/tcp"],
        cpuBase: 3,
        memBase: 0.12,
        phase: 2.0,
      },
    ],
  },
  {
    id: "monitoring",
    label: "Monitoring",
    prefix: "monitoring-",
    containers: [
      {
        id: "mon1tor1ngbackend",
        name: "monitoring-backend",
        image: "localhost/monitoring-backend:latest",
        state: "running",
        status: "Up 1 hour (healthy)",
        startedAt: startedHoursAgo(1),
        restartCount: 0,
        health: "healthy",
        memLimitBytes: 512 * 1024 * 1024,
        ports: ["8002/tcp"],
        cpuBase: 7,
        memBase: 0.28,
        phase: 1.4,
      },
    ],
  },
];

function findAgent(id: string): MockAgent | undefined {
  return AGENTS.find((a) => a.id === id);
}

function findContainer(name: string): MockContainer | undefined {
  for (const a of AGENTS) {
    const c = a.containers.find((cc) => cc.name === name);
    if (c) return c;
  }
  return undefined;
}

/** Smooth, bounded wander in [0,1] derived from the clock + phase. */
function wander(phase: number, periodMs: number): number {
  const t = Date.now() / periodMs + phase;
  // Sum two sines of different frequencies for a non-repetitive feel.
  const v = 0.5 + 0.32 * Math.sin(t) + 0.14 * Math.sin(t * 2.7 + 1.1);
  return Math.max(0, Math.min(1, v));
}

function statFor(c: MockContainer): ContainerStat {
  if (c.state !== "running") {
    return {
      name: c.name,
      online: false,
      cpuPct: 0,
      memUsedBytes: 0,
      memLimitBytes: c.memLimitBytes,
      memPct: 0,
      netRxBytes: 0,
      netTxBytes: 0,
      pids: 0,
    };
  }
  const cpu = Math.max(0, c.cpuBase * (0.55 + 1.1 * wander(c.phase, 9000)));
  const memFrac = Math.max(
    0.02,
    Math.min(0.985, c.memBase * (0.85 + 0.35 * wander(c.phase + 0.9, 17000))),
  );
  const memUsed = Math.round(memFrac * c.memLimitBytes);
  return {
    name: c.name,
    online: true,
    cpuPct: Math.round(cpu * 10) / 10,
    memUsedBytes: memUsed,
    memLimitBytes: c.memLimitBytes,
    memPct: Math.round(memFrac * 1000) / 10,
    netRxBytes: Math.round(1_000_000 + wander(c.phase, 5000) * 8_000_000),
    netTxBytes: Math.round(500_000 + wander(c.phase + 2, 5000) * 4_000_000),
    pids: Math.round(8 + wander(c.phase, 30000) * 40),
  };
}

function toContainer(c: MockContainer): Container {
  return {
    id: c.id,
    name: c.name,
    image: c.image,
    state: c.state,
    status: c.status,
    startedAt: c.startedAt,
    restartCount: c.restartCount,
    health: c.health,
    memLimitBytes: c.memLimitBytes,
    ports: c.ports,
  };
}

function summaryFor(a: MockAgent): AgentSummary {
  const stats = a.containers.map(statFor);
  const running = a.containers.filter((c) => c.state === "running").length;
  const totalMem = stats.reduce((s, st) => s + st.memUsedBytes, 0);
  const aggCpu = stats.reduce((s, st) => s + st.cpuPct, 0);
  return {
    id: a.id,
    label: a.label,
    prefix: a.prefix,
    containers: a.containers.length,
    running,
    totalMemBytes: totalMem,
    aggCpuPct: Math.round(aggCpu * 10) / 10,
  };
}

// ── Public mock API (mirrors client.ts method signatures) ────────────────────

export const mock = {
  getAgents(): AgentsResponse {
    return {
      generatedAt: new Date().toISOString(),
      agents: AGENTS.map(summaryFor),
    };
  },

  getContainers(agent: string): ContainersResponse {
    const a = findAgent(agent);
    if (!a) throw new MockHttpError(400, "unknown_agent");
    return { agent, containers: a.containers.map(toContainer) };
  },

  getStats(agent: string): StatsResponse {
    const a = findAgent(agent);
    if (!a) throw new MockHttpError(400, "unknown_agent");
    return {
      agent,
      generatedAt: new Date().toISOString(),
      stats: a.containers.map(statFor),
    };
  },

  getLogs(name: string, tail: number): LogsResponse {
    const c = findContainer(name);
    if (!c) throw new MockHttpError(404, "container_not_found");
    const n = Math.min(Math.max(tail, 1), 2000);
    const lines: LogLine[] = [];
    const now = Date.now();
    for (let i = n - 1; i >= 0; i--) {
      lines.push(synthLine(name, now - i * 800));
    }
    return { name, lines };
  },

  /**
   * Mock SSE: emits a synthetic log line on an interval. Returns a disposer.
   * Mirrors the EventSource contract used by `useContainerLogs`.
   */
  streamLogs(
    name: string,
    onLine: (line: LogLine) => void,
    onError: (message: string) => void,
  ): () => void {
    const c = findContainer(name);
    if (!c) {
      // Defer so the caller can attach handlers first.
      const t = setTimeout(() => onError("container_not_found"), 0);
      return () => clearTimeout(t);
    }
    // Stopped containers produce no live stream.
    if (c.state !== "running") {
      return () => {};
    }
    const id = setInterval(
      () => onLine(synthLine(name, Date.now())),
      700 + Math.random() * 600,
    );
    return () => clearInterval(id);
  },

  getHealth(): HealthResponse {
    const visible = AGENTS.reduce((s, a) => s + a.containers.length, 0);
    return { status: "ok", engine: "podman", containersVisible: visible };
  },
};

const LEVELS = ["INFO", "INFO", "INFO", "DEBUG", "WARN", "ERROR"] as const;
const MESSAGES: Record<string, string[]> = {
  default: [
    "request handled",
    "cache hit",
    "cache miss, recomputing",
    "background task scheduled",
    "connection pool size now {n}",
    "health check ok",
  ],
};

function synthLine(name: string, atMs: number): LogLine {
  const level = LEVELS[Math.floor(Math.random() * LEVELS.length)];
  const pool = MESSAGES[name] ?? MESSAGES.default;
  let msg = pool[Math.floor(Math.random() * pool.length)];
  msg = msg.replace("{n}", String(4 + Math.floor(Math.random() * 12)));
  const method = ["GET", "POST", "GET", "GET"][Math.floor(Math.random() * 4)];
  const path = ["/api/health", "/api/review", "/api/agents", "/static/app.js"][
    Math.floor(Math.random() * 4)
  ];
  const code = level === "ERROR" ? 500 : level === "WARN" ? 429 : 200;
  const text = `${level} ${name}: ${method} ${path} -> ${code} ${msg}`;
  return { ts: new Date(atMs).toISOString(), text };
}

/** A minimal HTTP-shaped error so the mock can model 400/404/502 like the real API. */
export class MockHttpError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
    this.name = "MockHttpError";
  }
}
