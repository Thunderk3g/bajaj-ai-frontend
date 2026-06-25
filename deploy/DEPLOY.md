# Deploying the platform home to the VM

This publishes the Bajaj AI Platform landing page at **`http://10.3.5.99/`**, closing the
`location /` 404 gap on the shared NGINX gateway. It matches the existing `ai-infra` pattern:
one `nginx:alpine` container per frontend (`landing-frontend`) on `shared-network`, fronted by
`shared-nginx`.

> **Nothing here runs automatically against the VM.** These are the artifacts and exact steps
> for the infra team (the five named owners) to apply during a change window. No live config is
> modified by this repo.

## What gets added

| Artifact | Purpose |
|----------|---------|
| `deploy/Containerfile` | builds `dist/` and serves it from `nginx:alpine` |
| `deploy/landing.nginx.conf` | the landing-frontend container's internal nginx (SPA fallback + asset caching) |
| `deploy/docker-compose.landing.yml` | the `landing-frontend` service on `shared-network` |
| `deploy/shared-nginx.location.conf` | the `location /` block to add to **shared-nginx** |

## Steps (on the VM)

1. **Place the repo** under the ai-infra tree, e.g. `/opt/shared/landing-agent/` (alongside
   `compliance-agent/`, `seo-agent/`).

2. **Build & start the container** on the existing shared network:
   ```bash
   cd /opt/shared/landing-agent
   podman-compose -f deploy/docker-compose.landing.yml up -d --build
   # verify it's healthy and on the network
   podman ps --filter name=landing-frontend
   ```

3. **Add the root route to shared-nginx.** Insert the contents of
   `deploy/shared-nginx.location.conf` into the shared `nginx.conf` `server {}` block, **after**
   the existing `/compliance`, `/compliance/api/`, `/pgadmin/` (and commented `/seo/`) locations
   and the `/health` block. The block uses the lazy `set $landing ...; proxy_pass $landing;`
   form on purpose — it matches the resilient routing of the other agents, so a down landing
   container 502s only `/` instead of failing the whole `nginx -t`/reload. Then reload:
   ```bash
   podman exec shared-nginx nginx -t      # validate config
   podman exec shared-nginx nginx -s reload
   ```

4. **Verify:**
   ```bash
   curl -I http://10.3.5.99/              # 200 + text/html (was 404)
   curl -I http://10.3.5.99/compliance    # still routes to compliance (unchanged)
   curl -I http://10.3.5.99/pgadmin/      # still routes to pgAdmin (unchanged)
   ```
   Open `http://10.3.5.99/` — the Compliance and Data/Infra cards should show **● Live** with
   the green dot; SEO shows **Coming soon**.

## Routing safety

The new block is a catch-all `location /`. NGINX always prefers the **longest matching prefix**,
so every existing agent route still wins; only previously-unmatched paths (the home page and its
`/assets/*`) now resolve — to `landing-frontend`. No existing route changes.

## When the SEO agent goes live

1. Uncomment the `/seo/` and `/seo/api/` blocks in shared-nginx (already present in `ai-infra`).
2. In this repo, set the SEO agent's `href` to `/seo/`, `status` to `"live"`, and add
   `healthCheck: { url: "/seo/api/v1/health/" }` in `src/lib/agents.ts`, then rebuild & redeploy
   the `landing-frontend` container. The card flips from "Coming soon" to live automatically.

## Rollback

```bash
# remove the root route block from shared-nginx.conf, then:
podman exec shared-nginx nginx -s reload
podman-compose -f deploy/docker-compose.landing.yml down
```
The root returns to its prior 404 state; all agents unaffected.
