/**
 * TS types mirroring the frozen API contract in
 * `docs/superpowers/specs/2026-06-26-agent-monitoring-design.md` §3.
 *
 * Field names here MUST match the backend `models.py` exactly — the two are the
 * two ends of one contract and any drift is a bug (§7).
 *
 * Base path through nginx: `/monitoring/api`. Timestamps are RFC3339 UTC
 * strings. Byte counts are integers. `0` mem limit = unlimited.
 */

// ── GET /agents ──────────────────────────────────────────────────────────────

export interface AgentSummary {
  id: string;
  label: string;
  prefix: string;
  containers: number;
  running: number;
  totalMemBytes: number;
  aggCpuPct: number;
}

export interface AgentsResponse {
  generatedAt: string;
  agents: AgentSummary[];
}

// ── GET /containers?agent=<id> ───────────────────────────────────────────────

export type ContainerState =
  | "running"
  | "exited"
  | "paused"
  | "created"
  | "restarting"
  | "dead";

export type ContainerHealth = "healthy" | "unhealthy" | "starting" | "none";

export interface Container {
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
}

export interface ContainersResponse {
  agent: string;
  containers: Container[];
}

// ── GET /stats?agent=<id> ────────────────────────────────────────────────────

export interface ContainerStat {
  name: string;
  online: boolean;
  cpuPct: number;
  memUsedBytes: number;
  memLimitBytes: number;
  memPct: number;
  netRxBytes: number;
  netTxBytes: number;
  pids: number;
}

export interface StatsResponse {
  agent: string;
  generatedAt: string;
  stats: ContainerStat[];
}

// ── GET /containers/{name}/logs (and /logs/stream SSE) ───────────────────────

export interface LogLine {
  ts: string;
  text: string;
}

export interface LogsResponse {
  name: string;
  lines: LogLine[];
}

// ── GET /health ──────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  engine: string;
  containersVisible: number;
}

// ── Errors ───────────────────────────────────────────────────────────────────

/** Shape of the JSON error envelope the backend returns (§3 "Errors"). */
export interface ApiError {
  error: string;
}
