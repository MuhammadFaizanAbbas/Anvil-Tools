# Vercel + cPanel + Supabase

## 1. Supabase

Create a Supabase project, then run these files in its SQL Editor in order:

1. `supabase/migrations/001_create_temp_mail_sessions.sql`
2. `supabase/migrations/002_app_schema.sql`
3. `supabase/seed.sql`

The seed adds the existing tool catalog and two existing dashboard post records without replacing existing rows. Demo traffic counts are not imported. All app tables have Row Level Security enabled and access revoked from browser roles; the API uses its server-only service-role key. Rate limiting uses an atomic database function shared across Vercel instances. Expired temporary sessions and rate-limit rows are removed during new inbox requests; there is no persistent worker. Provider mailbox retention remains controlled by mail.tm.

Create an admin user under Authentication > Users and set its password. Add its email to `ADMIN_EMAILS`. A valid Supabase account alone does not grant admin access. Disable public signups if your project only needs invited administrators.

## 2. Vercel backend

Import this repository into Vercel with the **repository root** as Root Directory. Framework is Express (`vercel.json`); use Node.js 22.x. There is no frontend build or output directory to configure. The root `server.js` exports the Express app and opens a listener only when run directly for local development. `.vercelignore` excludes the static frontend, SQL and development scripts from the deployment.

Set these environment variables for the environments you deploy:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Your project's Supabase URL |
| `SUPABASE_ANON_KEY` | Supabase anon/publishable key for password login |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role/secret key; backend only |
| `ADMIN_EMAILS` | Comma-separated permitted admin emails |
| `FRONTEND_ORIGINS` | `https://example.com,https://www.example.com` using your exact cPanel origins |
| `NODE_ENV` | `production` |

Do not include trailing slashes or paths in origins. Add local origins only if deliberately using this API for local development. Redeploy after configuration changes.

Check `https://YOUR-PROJECT.vercel.app/api/health`. It must return `ok: true` and `databaseConfigured: true`. This confirms process/configuration availability, not live database connectivity. Check `/api/tools` to verify the database schema, key and seed. `/` on the API intentionally returns JSON 404.

The deployment must allow public requests to its API domain. If Vercel Deployment Protection is enabled for a preview, use the public production deployment for cPanel rather than putting a protection bypass secret in the browser.

## 3. cPanel frontend

Edit `frontend/assets/js/config.js` and replace `https://YOUR-PROJECT.vercel.app` with the deployed API origin (or your custom API domain). It must use HTTPS. This is public configuration; no Supabase secret belongs here.

Upload the **contents** of `frontend/` to the domain's `public_html` document root, including `.htaccess`. Keep `assets/`, `tools/`, `categories/`, `blog/` and `admin-panel/` in place. Do not upload the repository root, backend, `.env`, `node_modules`, or SQL files. Enable HTTPS for the cPanel domain. No Node.js process or PHP database connection is required on cPanel.

Open `/admin-panel/login.html` to sign in. `/admin` and `/admin/login` redirect there on Apache with mod_rewrite. Auth uses a short-lived bearer token stored in the current browser tab's sessionStorage, so login works across different cPanel and Vercel domains without third-party cookies. On expiration, sign in again; automatic refresh is not implemented. Logout clears the local session and asks Supabase to revoke its refresh session; an already issued access token remains valid until its expiry.

## 4. Verify the deployment

- Open the homepage, a tool page and blog pages on the cPanel domain.
- Sign in with the allowed Supabase admin and edit a tool name. Reload to confirm persistence.
- Confirm an ordinary Supabase user cannot use admin endpoints.
- Create a temporary inbox, list messages, and delete it. The mail.tm provider must be reachable; five create attempts per client IP per hour are allowed.
- Confirm browser requests target Vercel and have no CORS errors.
- Replace `www.example.com`, contact email and publisher placeholders in static files before launch.

Local automated tests use mocked database responses; real Supabase SQL execution, mail delivery and hosted behavior require the configured services. No live deployment is performed by the repository setup.

## References

- [Vercel Express deployment](https://vercel.com/docs/frameworks/backend/express)
- [Supabase server authentication clients](https://supabase.com/docs/reference/javascript/auth)
- [Supabase database security](https://supabase.com/docs/guides/database/secure-data)

Older Railway/demo notes are retained under `docs/archive/` for historical reference only.
