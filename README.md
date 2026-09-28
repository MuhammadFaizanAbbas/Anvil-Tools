# Anvil Tools

Static frontend on **Vercel or cPanel**, Express API on **Vercel**, and database + admin authentication on **Supabase**.

```text
frontend/                   Upload contents to cPanel public_html
  assets/css/               Shared styles
  assets/js/config.js       Public API URL configuration
  assets/js/api.js          Shared API and session helper
  assets/js/tools/          Browser tool implementations
  admin-panel/              Static admin dashboard and login
  tools/ categories/ blog/  Public pages
backend/src/
  app.js                    Express middleware and route assembly
  config/                   Server environment configuration
  middleware/               CORS and admin authorization
  routes/                   Admin, content, and temporary mail endpoints
  lib/                      Supabase clients and async error wrapper
supabase/
  migrations/               Database schema and permissions
  seed.sql                  Initial tool and post catalog
scripts/
  serve-frontend.js          Local static server
  site-generator/           Optional Python HTML generator
tests/                      Offline API and frontend integration checks
docs/DEPLOYMENT.md           Deployment steps for all three hosts
docs/archive/               Historical implementation notes
server.js                   Vercel Express export / local API entry point
vercel.json                 Vercel framework configuration
.env.example                Server environment template
```

## Local development

Use Node.js 22. Run `npm ci`, copy `.env.example` to `.env`, and fill in your Supabase project keys and admin email. Apply the SQL described in [the deployment guide](docs/DEPLOYMENT.md).

Run in separate terminals:

```sh
npm run dev:api
npm run dev:frontend
```

Open `http://localhost:8080`. The API runs at `http://localhost:3000`; its health endpoint is `/api/health`. Admin login is `/admin-panel/login.html`. Frontend pages can be previewed without Supabase; database endpoints return 503 until configured. No demo password or in-memory database fallback is enabled.

```sh
npm test
npm run verify
```

## Deployment

Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). For separate Vercel projects, deploy the repository root as the Express backend and set the frontend project Root Directory to `frontend` (Framework: Other, Output Directory: `.`). Alternatively, upload **only the contents of `frontend/`** to cPanel. Configure the API URL in `frontend/assets/js/config.js` and allow the frontend origin in Vercel's `FRONTEND_ORIGINS`.

The API stores catalog changes in Supabase. Public HTML remains static: creating a post in the dashboard does not generate or publish an HTML page. Rendering database content into the public frontend is future application work. Analytics currently reports tracked tool views, not unique visitors; session duration and traffic sources are not collected. The browser tools' existing design and behavior are preserved.

The optional generator now writes to `frontend/`. It overwrites generated pages, so update its templates before regenerating manually edited pages. Existing domain, contact email and ad publisher placeholders still need your real values before launch.

The admin workspace includes KPI cards, tool-view ranking, a category donut chart, catalog search, content management, and retryable connection errors. Charts use real stored counts. No daily history, unique-visitor metrics, or traffic-source estimates are fabricated. Public pages currently do not automatically send tool-view events; the usage chart stays empty until `/api/analytics/event` receives events.
