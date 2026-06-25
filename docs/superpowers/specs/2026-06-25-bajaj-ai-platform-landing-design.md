# Bajaj AI Platform — Landing / Platform Home — Design Spec

**Date:** 2026-06-25
**Author:** Diwakar Adhikari (AI / Marketing) — assisted by Claude Code
**Status:** Approved (brainstorming gate passed)

## Problem

Several Bajaj Life AI agents are deployed on a single RHEL9 VM (`10.3.5.99`) behind one
NGINX reverse proxy (`shared-nginx`, the `ai-infra` shared asset). NGINX routes by path:

| Path | Upstream | Status |
|------|----------|--------|
| `/compliance`, `/compliance/*` | `compliance-frontend:3000` (Next.js) | live |
| `/compliance/api/*` | `compliance-backend:8000` (FastAPI) | live |
| `/pgadmin/*` | `shared-pgadmin:5050` | live |
| `/seo/`, `/seo/api/` | `seo-frontend:3002` / `seo-backend:8001` | built, **commented out** |
| `/health` | nginx → 200 | live |
| **`/`** | — none — | **404 (the gap)** |

There is **no base landing page** and **no shared design system**. This project fills both.

## Goal

A **platform home** ("Live status hub") served at NGINX `location /` that sits above the
agents: presents them, links to them, and shows real-time health — plus a reusable Bajaj
design system that becomes the shared visual asset `ai-infra` lacks, synced to claude.ai/design.

## Decisions (locked)

- **Scope:** Live status hub (portal + real-time health, no SSO).
- **Visual:** Bajaj light / corporate — navy `#002c6e`, accent blue `#0072ce`, bg `#f4f7fb`,
  white surfaces, `Inter`. Trustworthy enterprise insurance feel.
- **Cloud design:** Build first → `/design-sync` the component library to a NEW
  claude.ai/design project "Bajaj AI Platform".
- **SEO agent:** shown as **Coming soon** (disabled card); nginx left unchanged.
- **Stack:** **Vite + React + TS + Tailwind**, built to a static `dist/`. Served directly by
  nginx at `location /` — no running container. Live status is done **client-side** with
  `fetch()` because the landing page and all agents share one origin (`10.3.5.99`).

## Architecture

```
src/
  lib/
    agents.ts        # agent registry: metadata, hrefs, status, health-check endpoints
    utils.ts         # cn() classnames helper
    useHealth.ts     # client-side health polling hook (same-origin fetch)
  components/
    ui/              # design-system primitives (Button, Badge, Card, StatusDot)
    platform/        # composed sections (TopBar, Hero, AgentCard, StatusStrip, InfraCard, Footer)
  styles/globals.css # Bajaj tokens (CSS vars) + Tailwind base
  App.tsx            # the landing page composition
  main.tsx           # entry
```

### Components (the reusable design system)

| Component | Purpose |
|-----------|---------|
| `Button` | primary / secondary / ghost actions |
| `Badge` | status + tag pills (live / coming-soon / category tags) |
| `StatusDot` | colored pulse dot (ok / warn / down / idle) |
| `Card` | base surface card |
| `TopBar` | brand lockup + global platform status pill |
| `Hero` | "Your AI agents, one place" headline + subcopy + primary CTA |
| `AgentCard` | one agent: icon, name, tagline, tags, live status + uptime, Open → / Coming soon |
| `StatusStrip` | aggregate "● All systems operational" bar |
| `InfraCard` | shared infrastructure (pgAdmin / Postgres / Redis) tile |
| `Footer` | environment, VM, version, links |

### Data flow — live status

`useHealth` polls each agent's declared `healthCheck.url` (same-origin) on an interval with a
short timeout. Result overlays the declared status: a `live` agent that fails its probe shows
`degraded`; `coming-soon` agents are never probed. In local dev (cross-origin) probes fail
silently and cards fall back to declared status.

Agents/registry (initial):
- **Regulatory Compliance** → `/compliance`, probe `/compliance/api/health`. Live.
- **SEO & GEO Intelligence** → coming soon (no link, no probe).
- **Data & Infrastructure (pgAdmin)** → `/pgadmin/`, probe `/pgadmin/`. Live.
- Platform self → probe `/health`.

## Error handling

- Probe failure / timeout → card shows `degraded` (amber) not an error screen.
- All probes optional; the page renders fully without any network (declared status only).
- No secrets, no auth, no PII. Purely presentational + same-origin GET health checks.

## Deployment (Phase 3 — no live changes without explicit approval)

- Static `dist/` placed on the VM; nginx gains a `location / { root ...; try_files ... }`
  (or a tiny `landing-frontend` static container) — exact diff delivered, not applied.
- SEO route left commented out until the SEO agent is enabled.

## Out of scope (YAGNI)

SSO/gateway auth, user management, usage analytics dashboards, the separate "Aether Flow"
multi-agent POC (`compliance-agent-poc`) — not deployed on this VM.

## Verification

`npm run build` clean (tsc + vite) · page renders all cards · responsive 360px–1440px ·
keyboard navigable · brand tokens only (no stray colors) · adversarial review pass.
