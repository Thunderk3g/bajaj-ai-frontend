# Agent Monitoring — Design Spec

**Date:** 2026-06-26
**Status:** Approved, in implementation
**Repos touched:** `bajaj-ai-store` (frontend UI) and `ai-infra/bajaj-ai-platform` (backend service + infra)

## 1. Goal

From the platform home, let an operator click into an agent (Regulatory Compliance,
SEO, Shared Infrastructure, Platform Home) and watch, per container, in real time:

- **CPU %** (live + short rolling chart)
- **RAM usage** (used / limit, with a bar + rolling chart)
- **Live logs** (streamed tail, follow/pause, search, level filter)

Plus per-container metadata: state, uptime, restart count, health, ports.

These are **Podman containers** on a single RHEL9 VM (`10.3.5.99`), not Kubernetes
pods. Grouping into "agents" is derived from the container-name prefix convention
(`compliance-*`, `seo-*`, `shared-*`, `landing-*`, `monitoring-*`).

### Decisions (locked)
- **Custom service + custom UI** (not cAdvisor/Dozzle).
- **Live only** — no persistent metric history; rolling charts live in browser memory.
- **Gated** — the monitoring section sits behind nginx basic-auth, and a GET-only
  socket-proxy makes engine access genuinely read-only.

### Out of scope
- Historical metrics / Prometheus / Grafana.
- Container control (start/stop/restart/exec) — read-only only.
- SSO; platform-wide auth. Only `/monitoring*` is gated.
- Alerting / notifications.

## 2. Architecture

```
 Browser
   │  GET /monitoring        (UI shell, served by landing-frontend SPA) ── basic-auth
   │  GET /monitoring/api/*  (data + SSE)                                ── basic-auth
   ▼
shared-nginx ──► /monitoring      → landing-frontend:80   (this repo's SPA)
            └──► /monitoring/api/  → monitoring-backend:8002
   │ shared-network
   ▼
monitoring-backend (FastAPI :8002)
   │  Docker-compatible REST over tcp://socket-proxy:2375  (GET only)
   ▼
socket-proxy (tecnativa/docker-socket-proxy) ──► /run/podman/podman.sock (rootful)
```

Two new containers in `ai-infra`: `monitoring-backend`, `socket-proxy`. The UI is a
new route **inside `bajaj-ai-store`** (no new frontend container — it ships in the
existing `landing-frontend`).

## 3. API contract (frozen — both repos build to this)

Base path (through nginx): `/monitoring/api`. All responses JSON unless noted.
Timestamps are RFC3339 UTC strings. Byte counts are integers. `0` mem limit = unlimited.

### `GET /agents`
```json
{
  "generatedAt": "2026-06-26T12:00:00Z",
  "agents": [
    { "id": "compliance", "label": "Regulatory Compliance", "prefix": "compliance-",
      "containers": 2, "running": 2, "totalMemBytes": 1503238553, "aggCpuPct": 38.4 }
  ]
}
```
Group id/label/prefix mapping (backend owns this table):
| id | label | prefix |
|---|---|---|
| `compliance` | Regulatory Compliance | `compliance-` |
| `seo` | SEO & GEO Intelligence | `seo-` |
| `shared` | Shared Infrastructure | `shared-` |
| `landing` | Platform Home | `landing-` |
| `monitoring` | Monitoring | `monitoring-` |
Containers not matching a known prefix go to a synthetic `other` group.

### `GET /containers?agent=<id>`
```json
{ "agent": "compliance", "containers": [
  { "id": "abc123", "name": "compliance-backend", "image": "localhost/compliance-backend:latest",
    "state": "running", "status": "Up 6 hours", "startedAt": "2026-06-26T06:00:00Z",
    "restartCount": 0, "health": "healthy", "memLimitBytes": 2147483648, "ports": ["8000/tcp"] }
]}
```
`state` ∈ running|exited|paused|created|restarting|dead. `health` ∈ healthy|unhealthy|starting|none.

### `GET /stats?agent=<id>`
Bulk snapshot for all of an agent's containers (one poll updates the whole list).
```json
{ "agent": "compliance", "generatedAt": "2026-06-26T12:00:00Z", "stats": [
  { "name": "compliance-backend", "online": true, "cpuPct": 38.4,
    "memUsedBytes": 1503238553, "memLimitBytes": 2147483648, "memPct": 70.0,
    "netRxBytes": 12345, "netTxBytes": 6789, "pids": 24 }
]}
```
Stopped containers: `online:false`, numeric fields `0`. CPU% via the standard
Docker formula (delta cpu / delta system × online CPUs × 100); if precpu is absent
on a snapshot, return `0` for that sample.

### `GET /containers/{name}/logs?tail=<n>` (default 500, max 2000)
```json
{ "name": "compliance-backend", "lines": [ { "ts": "2026-06-26T12:04:01Z", "text": "INFO ..." } ] }
```
Backend requests logs with timestamps and splits the leading RFC3339 stamp off each
line into `ts`; remainder is `text`. (Level is inferred client-side.)

### `GET /containers/{name}/logs/stream?tail=<n>` (SSE)
`Content-Type: text/event-stream`. Each line → `data: {"ts":"...","text":"..."}\n\n`.
Comment heartbeat `: ping\n\n` ~every 20s. On engine error → `event: error\ndata: {"error":"..."}\n\n` then close. Must tolerate client disconnect.

### `GET /health`
```json
{ "status": "ok", "engine": "podman", "containersVisible": 9 }
```

### Errors
`404 {"error":"container_not_found"}` · `502 {"error":"engine_unreachable"}` ·
`400 {"error":"unknown_agent"}`. Backend never exposes raw engine errors verbatim.

## 4. Backend (`ai-infra/bajaj-ai-platform/monitoring-agent/`)

```
monitoring-agent/
  docker-compose.yml          # monitoring-backend + socket-proxy, shared-network (external)
  backend/
    Dockerfile                # python:3.11-slim (already pre-pulled on VM)
    requirements.txt          # fastapi, uvicorn[standard], docker, anyio
    app/
      main.py                 # FastAPI app, routes, CORS off (same-origin via nginx)
      engine.py               # Docker SDK client -> tcp://socket-proxy:2375; list/inspect/stats/logs
      grouping.py             # name-prefix -> agent group table + classifier
      stats.py                # CPU%/mem math, snapshot normalisation
      models.py               # pydantic response models matching §3
    tests/
      test_grouping.py
      test_stats.py           # CPU/mem math against captured Docker/Podman stats JSON
      test_endpoints.py       # FastAPI TestClient + fake engine (no real socket)
  .env.example                # MON_BASIC_AUTH note, SOCKET_PROXY_URL
  README.md                   # VM deploy steps (enable podman.socket, pre-pull, route, htpasswd)
```

- **engine.py** uses `docker.DockerClient(base_url=os.environ.get("SOCKET_PROXY_URL","tcp://socket-proxy:2375"))`.
  Only read calls: `containers.list(all=True)`, `container.stats(stream=False)`,
  `container.logs(...)`. No start/stop/exec anywhere.
- **socket-proxy** service: `ghcr.io/tecnativa/docker-socket-proxy`, mounts
  `/run/podman/podman.sock:/var/run/docker.sock:ro`, env `CONTAINERS=1 INFO=1 PING=1
  VERSION=1 POST=0 EXEC=0 IMAGES=0 NETWORKS=0 VOLUMES=0` (POST=0 blocks all writes →
  list/inspect/stats/logs work, start/stop/exec rejected). On `shared-network`, no host port.
- **monitoring-backend** service: built image `localhost/monitoring-backend:latest`,
  `pull_policy: never`, `restart: always`, on `shared-network`, no host port (nginx routes).
  Port 8002 (per port-registry; compliance=8000, seo=8001).
- SSE: FastAPI `StreamingResponse` wrapping the blocking `logs(stream=True, follow=True)`
  generator (runs in threadpool); handle disconnect; heartbeat.

### Infra wiring (also in ai-infra)
- **nginx** (`shared/nginx.conf`, via the BEGIN/END markers or `add-agent-route` style):
  ```nginx
  location /monitoring/api/ {
    auth_basic "Bajaj AI Monitoring"; auth_basic_user_file /etc/nginx/.htpasswd-monitoring;
    set $mon http://monitoring-backend:8002;
    rewrite ^/monitoring/api/(.*)$ /$1 break;
    proxy_pass $mon; include /etc/nginx/proxy_params.conf;
    proxy_buffering off; proxy_read_timeout 1h;   # for SSE
  }
  location /monitoring {                            # UI shell -> landing SPA
    auth_basic "Bajaj AI Monitoring"; auth_basic_user_file /etc/nginx/.htpasswd-monitoring;
    set $landing http://landing-frontend:80;
    proxy_pass $landing; include /etc/nginx/proxy_params.conf;
  }
  ```
  Document mounting `.htpasswd-monitoring` into shared-nginx and generating it with `htpasswd`.
- **podman.socket**: README step `sudo systemctl enable --now podman.socket`.
- **pre-pull**: add `ghcr.io/tecnativa/docker-socket-proxy` to `pre-pull-images.sh`.
- Update `docs/port-registry.md` (8002 → monitoring) and `start-all.sh` picks it up
  automatically (it loops `/opt/*/`), but the monitoring dir must be deployed under `/opt/`.

**Verification expected from the backend agent:** code compiles (`python -m compileall`),
`pytest` passes against the fake engine, `docker compose config`/compose file is valid YAML.
Do NOT attempt to reach a real Podman socket from this dev machine. Do NOT commit.

## 5. Frontend (`bajaj-ai-store`)

Add `react-router-dom`. nginx already SPA-fallbacks, so real paths work.

```
src/
  main.tsx                    # wrap <BrowserRouter>
  App.tsx                     # <Routes>: "/" -> <Landing/>, "/monitoring" + "/monitoring/:agentId"
  pages/Landing.tsx           # current App body extracted here UNCHANGED in behaviour
  monitoring/
    MonitoringOverview.tsx     # route /monitoring : grid of AgentMonitorCard
    AgentMonitor.tsx           # route /monitoring/:agentId : split ContainerList + ContainerDetail
    components/
      AgentMonitorCard.tsx
      ContainerList.tsx
      ContainerDetail.tsx      # stats panel + LogViewer
      MetricSparkline.tsx      # inline SVG line (NO chart library)
      MetricBar.tsx            # used/limit bar
      LogViewer.tsx            # SSE tail, follow toggle (pauses on scroll-up), search, level filter, ring buffer (~2000)
    hooks/
      useAgents.ts
      useContainers.ts         # GET /containers?agent=
      useStats.ts              # poll GET /stats every ~2500ms, keep rolling history Map<name, number[]> (cap ~40 pts) for cpu & mem
      useContainerLogs.ts      # EventSource w/ backoff reconnect, ring buffer
    lib/
      client.ts                # typed fetch/EventSource client, base "/monitoring/api"
      mock.ts                  # dev fixtures; used when import.meta.env.DEV && VITE_MONITORING_MOCK!=="0"
      types.ts                 # TS types mirroring §3 exactly
  components/platform/TopBar.tsx   # add <Link to="/monitoring">Monitoring</Link>
  components/platform/AgentCard.tsx# add small secondary "Logs & metrics" link -> /monitoring/{id}
```

- **Reuse design system**: `Card`, `Badge`, `StatusDot`, `Button`, Tailwind tokens
  (navy/brand/ink, `shadow-e1..e3`, `rounded-2xl`, status tones ok/warn/down/idle).
  Light theme. Sparklines use `brand`; RAM bar tones by % (ok < 75, warn < 90, down ≥ 90).
- **Mock mode** so the UI is fully developable/testable offline: `client.ts` routes
  to `mock.ts` when in dev and `VITE_MONITORING_MOCK` is not `"0"`. Mock fabricates a
  realistic moving signal (so charts animate) and a synthetic log stream.
- **Status/labels**: map backend group `id` → friendly icon/name via existing `AGENTS`
  registry where ids match; fall back to backend `label`.
- **Error states**: backend unreachable → inline "Monitoring offline" notice (reuse
  Badge tone `down`); stopped container → muted row; SSE drop → auto-reconnect with
  visible "reconnecting…" chip; logs truncated → "earlier lines trimmed" marker.

### Frontend tests (add vitest + RTL + jsdom)
- `useStats` rolling buffer caps length and appends per poll.
- `LogViewer` follows tail, pauses on manual scroll-up, resumes via follow toggle.
- `client.ts` mock returns shapes matching `types.ts`.

**Verification expected from the frontend agent:** `npm install` deps,
`npm run typecheck`, `npm run build`, and `vitest run` all green. Do NOT commit.

## 6. Build sequence (per repo, agents work the whole vertical)
1. Backend: engine/grouping/stats/models → endpoints → compose/socket-proxy → nginx/auth/docs → pytest.
2. Frontend: types/client/mock → router + Landing extraction → overview → agent-detail stats + sparklines → LogViewer (SSE) → nav/card entry points → vitest.

## 7. Integration & contract guard
Both sides import the SAME field names from §3. The frontend `types.ts` and backend
`models.py` are the two ends of one contract; any drift is a bug. After both return,
the coordinator runs frontend build+tests, reviews backend tests, and (manually, later)
deploys to the VM to verify against the live socket.
