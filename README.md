# Tailor Desk

A mobile-first workspace for tailoring businesses: clients, body measurements, made-to-measure and bespoke orders, fittings, photos, fabrics, tasks and customer inquiries. Swedish and English, light and dark, built for GDPR compliance in Sweden.

The product name is neutral and configurable (`VITE_APP_NAME`); there is no logo or brand.

## Features

- **Shops and teams** – each shop is an isolated workspace. Owners invite staff by link; roles are owner and staff.
- **Orders** – MTM workflow (received → fitting → ready → collected) and bespoke workflow (two fittings). Automatic order numbers `PREFIX-YYMMDD-NNN`, due dates, price, deposit and balance, suit style (cut, lapel, buttons, vent), notes, status history.
- **Measurements** – one catalogue for jacket, trousers and body measurements, with left/right pairs and range warnings. Enter them in a table or in guided mode: one measurement per screen with a body figure and instructions. Copy the client's latest measurements into a new order.
- **Photos** – camera or library upload, resized in the browser with all EXIF/GPS data stripped, stored privately and shown through short-lived signed URLs.
- **Customer tracking link** – per order, shows only order number, garment, progress and shop contact details. Can be turned off or regenerated.
- **Clients, fabrics, tasks** – client history and latest measurements, fabric stock, tasks linked to clients/orders with bulk actions.
- **Inquiry inbox** – optional public contact page per shop (`/s/<slug>`) with privacy acknowledgement and spam throttling.
- **Overview and search** – active/fitting/ready counts, due and overdue orders, outstanding balance; global search (⌘K) including order numbers.

## GDPR (Sweden)

- Supabase project in the EU (Stockholm, `eu-north-1`). Fonts are bundled; no third-party requests, no analytics, no tracking cookies. Browser storage is limited to strictly necessary items, so no consent banner is needed under LEK (2022:482).
- Shop = controller, operator = processor. Terms include an Art. 28 processing agreement; each shop gets a generated Art. 13 privacy notice for its customers at `/s/<slug>/privacy`.
- Data subject rights built in: per-client JSON export and erasure, full shop export, personal data export and account deletion for staff.
- Storage limitation: inactive clients are deleted automatically after the shop's retention period (default 36 months, previewed 30 days ahead with a "keep" action); audit log 12 months; inquiries 12/24 months.
- Data minimisation: the audit log records who changed which fields, never the values; the tracking page shows no personal data.
- Security: per-shop row-level security on every table, composite foreign keys so no row can point into another shop, server-side order numbering, security-definer RPCs with explicit authorisation, CSP and security headers.

The legal texts in `src/features/legal/LegalPages.tsx` are a starting point. Have them reviewed and fill in `VITE_OPERATOR_NAME` / `VITE_OPERATOR_EMAIL` before launch.

## Setup

1. Create a Supabase project in an EU region.
2. Apply the migrations in `supabase/migrations/` (`supabase db push`, or run them in order in the SQL editor).
3. Auth settings: enable email confirmations, add `<your-domain>/auth/reset` to redirect URLs.
4. Deploy `supabase/functions/storage-gc` and schedule it (e.g. hourly) to remove orphaned photo files. Retention runs daily via `pg_cron` when the extension is available; otherwise schedule `select public.run_retention()`.
5. `cp .env.example .env` and fill in the values.

```bash
npm install
npm run dev
```

## Scripts

| Command | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck and production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:db` | Applies migrations to a local Postgres and runs RLS/RPC tests (needs `PGHOST`/`PGPORT`/`PGUSER`) |

Deploys as a static site; `public/_redirects` and `public/_headers` (Netlify) or `vercel.json` provide SPA routing and security headers.
