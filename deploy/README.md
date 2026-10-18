# Deploy (Docker + nginx)

The production SPA is a static Vite build served by **nginx**. Cloudflare Tunnel (`cloudflared`) is a Compose service only in PRO.

Daily UI work stays on `npm run dev` (Vite proxy). This stack is for Docker smoke tests and production.

## Files

```
deploy/
  compose.yaml           # web (nginx static); no host ports
  compose.override.yaml  # LOCAL: publish FRONTEND_HTTP_PORT (default 8081)
  compose.prod.yaml      # PRO: cloudflared; no host ports
  .env.example
  docker/
    Dockerfile           # node build → nginx
    nginx.conf           # SPA try_files + /oauth/callback → callback.html
```

`make deploy-prod` uses `-f compose.yaml -f compose.prod.yaml` so **override is not loaded**.

## Local smoke

From the repository root:

```sh
cp deploy/.env.example deploy/.env
make deploy
# http://127.0.0.1:8081
```

Relative `VITE_*` values only work behind Vite’s proxy. For a useful local Docker image, keep the PRO HTTPS URLs in `deploy/.env` or point them at a reachable API.

## Production

Cloudflare Zero Trust public hostname `socious.iramluism.com` must use Service URL **`http://web:80`** (Compose network `socious_frontend_internal`).

On the server, after `git pull` from GitHub (never copy source over SSH):

```sh
cd deploy
cp -n .env.example .env
# set CLOUDFLARE_TUNNEL_TOKEN and absolute VITE_* URLs
docker compose -f compose.yaml -f compose.prod.yaml --env-file .env up -d --build
```

Or from the repo root: `make deploy-prod`.

`VITE_*` are baked at **image build**. Changing API URLs requires `--build`. Never commit `deploy/.env` or a real tunnel token.

## Makefile

| Target | Action |
| --- | --- |
| `make deploy` | Local: `compose.yaml` + override, host port 8081 |
| `make deploy-prod` | PRO: `compose.yaml` + `compose.prod.yaml`, cloudflared |
| `make deploy-down` / `deploy-prod-down` | Stop that stack |
| `make deploy-logs` / `deploy-prod-logs` | Follow logs |
