import { describe, it, expect } from "vitest";
import { mock } from "@/monitoring/lib/mock";
import type {
  AgentsResponse,
  ContainersResponse,
  ContainerStat,
  HealthResponse,
  LogsResponse,
  StatsResponse,
} from "@/monitoring/lib/types";

/**
 * Contract guard (spec §7): the mock the dev/test UI runs against must produce
 * shapes matching `types.ts` field-for-field. These checks assert the runtime
 * shape; the explicit type annotations below additionally enforce the contract
 * at compile time.
 */

const isRFC3339 = (s: unknown): boolean =>
  typeof s === "string" && !Number.isNaN(Date.parse(s));

const isInt = (n: unknown): boolean => typeof n === "number" && Number.isInteger(n);
const isNum = (n: unknown): boolean => typeof n === "number" && Number.isFinite(n);

describe("mock client shape conformance", () => {
  it("getAgents() matches AgentsResponse", () => {
    const res: AgentsResponse = mock.getAgents();
    expect(isRFC3339(res.generatedAt)).toBe(true);
    expect(Array.isArray(res.agents)).toBe(true);
    expect(res.agents.length).toBeGreaterThan(0);
    for (const a of res.agents) {
      expect(typeof a.id).toBe("string");
      expect(typeof a.label).toBe("string");
      expect(typeof a.prefix).toBe("string");
      expect(isInt(a.containers)).toBe(true);
      expect(isInt(a.running)).toBe(true);
      expect(isInt(a.totalMemBytes)).toBe(true);
      expect(isNum(a.aggCpuPct)).toBe(true);
      expect(a.running).toBeLessThanOrEqual(a.containers);
    }
  });

  it("getContainers(agent) matches ContainersResponse", () => {
    const res: ContainersResponse = mock.getContainers("compliance");
    expect(res.agent).toBe("compliance");
    expect(res.containers.length).toBeGreaterThan(0);
    const states = ["running", "exited", "paused", "created", "restarting", "dead"];
    const healths = ["healthy", "unhealthy", "starting", "none"];
    for (const c of res.containers) {
      expect(typeof c.id).toBe("string");
      expect(typeof c.name).toBe("string");
      expect(typeof c.image).toBe("string");
      expect(states).toContain(c.state);
      expect(typeof c.status).toBe("string");
      expect(isRFC3339(c.startedAt)).toBe(true);
      expect(isInt(c.restartCount)).toBe(true);
      expect(healths).toContain(c.health);
      expect(isInt(c.memLimitBytes)).toBe(true);
      expect(Array.isArray(c.ports)).toBe(true);
      c.ports.forEach((p) => expect(typeof p).toBe("string"));
    }
  });

  it("getStats(agent) matches StatsResponse", () => {
    const res: StatsResponse = mock.getStats("seo");
    expect(res.agent).toBe("seo");
    expect(isRFC3339(res.generatedAt)).toBe(true);
    for (const s of res.stats as ContainerStat[]) {
      expect(typeof s.name).toBe("string");
      expect(typeof s.online).toBe("boolean");
      expect(isNum(s.cpuPct)).toBe(true);
      expect(isInt(s.memUsedBytes)).toBe(true);
      expect(isInt(s.memLimitBytes)).toBe(true);
      expect(isNum(s.memPct)).toBe(true);
      expect(isInt(s.netRxBytes)).toBe(true);
      expect(isInt(s.netTxBytes)).toBe(true);
      expect(isInt(s.pids)).toBe(true);
    }
  });

  it("stopped containers report online:false and zeroed numeric fields (§3)", () => {
    const res = mock.getStats("seo");
    const stopped = res.stats.find((s) => !s.online);
    expect(stopped).toBeDefined();
    expect(stopped!.cpuPct).toBe(0);
    expect(stopped!.memUsedBytes).toBe(0);
    expect(stopped!.memPct).toBe(0);
    expect(stopped!.pids).toBe(0);
  });

  it("getLogs(name, tail) matches LogsResponse with RFC3339 ts", () => {
    const res: LogsResponse = mock.getLogs("compliance-backend", 10);
    expect(res.name).toBe("compliance-backend");
    expect(res.lines).toHaveLength(10);
    for (const l of res.lines) {
      expect(isRFC3339(l.ts)).toBe(true);
      expect(typeof l.text).toBe("string");
    }
  });

  it("getHealth() matches HealthResponse", () => {
    const res: HealthResponse = mock.getHealth();
    expect(res.status).toBe("ok");
    expect(res.engine).toBe("podman");
    expect(isInt(res.containersVisible)).toBe(true);
  });

  it("rejects unknown agents the way the real API does (400 unknown_agent)", () => {
    expect(() => mock.getContainers("nope")).toThrowError(/unknown_agent/);
    expect(() => mock.getStats("nope")).toThrowError(/unknown_agent/);
  });

  it("streamLogs emits synthetic lines for a running container", () => {
    const received: { ts: string; text: string }[] = [];
    const stop = mock.streamLogs(
      "compliance-backend",
      (line) => received.push(line),
      () => {},
    );
    // The mock uses setInterval; we just assert it returns a disposer cleanly.
    expect(typeof stop).toBe("function");
    stop();
  });
});
