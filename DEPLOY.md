# Continuous Deployment — Render (no Docker)

Push to `main` → full test suite runs → if green, both Render services redeploy → pipeline verifies the API is healthy in production.

## Architecture

| Piece | Runs on | Built by |
|---|---|---|
| `rentora-db` | Render Managed Postgres (free) | `render.yaml` |
| `rentora-api` (Express) | Render Web Service, native Node | `render.yaml` |
| `rentora-web` (React SPA) | Render Static Site (`frontend/dist`) | `render.yaml` |

The database URL, JWT secret, and CORS origins are injected as environment variables — nothing is baked into images because there are no images.

## One-time setup (~10 minutes)

1. **Create the GitHub repo** (this folder isn't a repo yet):
   ```bash
   git init && git add . && git commit -m "Initial commit"
   git remote add origin https://github.com/<you>/rental-platform.git
   git push -u origin main
   ```

2. **Provision Render**: Dashboard → **New → Blueprint** → select this repo.
   Render reads `render.yaml` and asks for two values:
   - `CORS_ORIGIN` for rentora-api → your static site URL (shown after creation), e.g. `https://rentora-web.onrender.com`
   - `VITE_API_URL` for rentora-web → your API URL, e.g. `https://rentora-api.onrender.com`

3. **Collect three secrets** from Render → each service → Settings:
   - rentora-api → **Deploy Hook** URL → GitHub secret `RENDER_DEPLOY_HOOK`
   - rentora-web → **Deploy Hook** URL → GitHub secret `RENDER_STATIC_DEPLOY_HOOK`
   - rentora-api public URL → GitHub secret `PROD_API_URL` (e.g. `https://rentora-api.onrender.com`)

4. Done. Every push to `main` now: backend 156 tests + frontend 14 tests + production build → deploy hooks fire → pipeline polls `$PROD_API_URL/health` for up to 10 min and fails loudly if the release is broken.

## What ships where

- Schema: `server.js` runs `sequelize.sync()` at boot — first deploy against the empty Render DB creates all tables automatically. Demo data does NOT auto-seed in prod (run `node seed.mjs` once from the Render Shell if you want it).
- Rate limits: code defaults apply in prod (300 req/15min global, 10 auth). The raised local dev values live only in `.env`, which is not deployed.

## Known trade-offs

- **Uploads are ephemeral** on free tier: files written to `uploads/` vanish on redeploy/restart. Fix later with a Render Disk (paid) or S3-compatible storage.
- Free tier spins down after ~15 min idle; first request after a pause takes ~30–50s (the health poll tolerates this).
- `sequelize.sync()` alters nothing destructive on schema changes; if you later need controlled migrations, switch to `umzug`/`sequelize-cli` before touching models in prod.

## Manual redeploy / rollback

- Redeploy: Render dashboard → service → **Manual Deploy**, or run this workflow via *Actions → Deploy → Run workflow*.
- Rollback: Render keeps previous deploys — service → **Rollback** (API reverts instantly; static sites keep old bundles).
