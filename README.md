# Bajaj Life · AI Platform

The **base landing page / platform home** that sits above Bajaj Life's marketing AI agents and
fills the empty `location /` on the shared NGINX gateway (`10.3.5.99`). It also serves as the
**shared Bajaj design system** that `ai-infra` previously lacked.

> Your AI agents, one place. — Regulatory Compliance, SEO Intelligence, and the shared data
> backbone, behind one secure door, with live health.

## What it is

- A static **Vite + React + TypeScript + Tailwind** app — builds to a self-contained `dist/`
  that NGINX serves directly (no running server, no extra port).
- **Live status** is done client-side: because the landing page and every agent share one
  origin behind the same NGINX, the browser health-checks each agent with same-origin `fetch`.
- A small, reusable **design system** (`src/components/ui`) on Bajaj brand tokens, ready to be
  synced to claude.ai/design via `/design-sync`.

## Stack & structure

```
src/
  lib/agents.ts      registry — the one place to add/track an agent (name, href, status, health)
  lib/useHealth.ts   client-side same-origin health polling
  lib/utils.ts       cn() + uptime formatting
  components/ui/      design system: Button, Badge, Card, StatusDot
  components/platform TopBar, Hero, AgentCard, StatusStrip, Footer
  icons/             inline brand mark + agent icons (no icon dependency)
  styles/globals.css Bajaj tokens + Tailwind base
  App.tsx / main.tsx the landing composition + entry
tailwind.config.ts   the design tokens (navy #002c6e · brand #0072ce · bg #f4f7fb · Inter)
deploy/              NGINX + container wiring to publish at location / (see deploy/DEPLOY.md)
docs/superpowers/    the approved design spec
```

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit && vite build -> dist/
npm run preview    # serve the production build locally
```

In local dev the agent health probes are cross-origin and fail silently — cards fall back to
their declared status. On the VM (same origin) they reflect real reachability.

## Adding an agent

Append to `AGENTS` in `src/lib/agents.ts` — set `href` (or `null` for coming-soon), `status`,
`icon`, `tags`, and an optional `healthCheck.url`. The card and aggregate status update
automatically.

## Deploy

See [`deploy/DEPLOY.md`](deploy/DEPLOY.md). Nothing here touches the live VM automatically —
it ships the `dist/` and the exact NGINX `location /` block / `landing-frontend` container for
the `ai-infra` team to apply.
