# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Tailor Desk: a mobile-first, multi-shop tool for tailors (clients, measurements, orders, photos, fabrics, tasks, inquiries). React SPA talking directly to Supabase (Postgres + Auth + Storage) with the anon key; all authorisation lives in Postgres RLS and SECURITY DEFINER functions. UI in Swedish (default) and English. Must stay GDPR-compliant for Sweden (see README) and brand-neutral (name only via `VITE_APP_NAME`).

## Commands

```bash
npm run dev            # Vite dev server (needs .env, see .env.example; without it the app shows a setup notice)
npm run build          # tsc -b + vite build
npm run typecheck      # tsc -b
npm run lint           # eslint .
npm test               # vitest run (jsdom)
npx vitest run src/domain/__tests__/measurements.test.ts   # single file
npx vitest run -t "parses"                                  # by test name
PGHOST=... PGPORT=... PGUSER=postgres npm run test:db       # migrations + RLS tests on local Postgres 15+
```

`supabase/tests/run.sh` creates a throwaway DB, loads `supabase/tests/shim.sql` (stand-ins for Supabase's `auth`/`storage` schemas, roles `anon`/`authenticated`/`service_role`, `auth.uid()` from the `request.jwt.claim.sub` setting), applies every migration, then runs `rls_test.sql`. psql variables are not interpolated inside `$$` blocks, so assertions use `select pg_temp.ok(<bool>, 'msg')` and `pg_temp.expect_error(sql, pattern)`. Any schema/RLS/RPC change needs a test there.

## Architecture

### Layers
- `src/domain/` – pure logic, no React/Supabase: order workflows and suit style rules (`orders.ts`), the measurement catalogue (`measurements.ts`), money in minor units (`money.ts`), validation/slugs (`validation.ts`). Unit-tested.
- `src/features/<area>/` – `api.ts` (React Query `queryOptions` + mutation functions over Supabase) and pages/components. `src/lib/types.ts` holds hand-written row types kept in sync with the migrations (no codegen).
- `src/ui/` – design-system primitives (Button, Field/TextField/SelectField/Switch, Segmented/FilterChips, Card/Section, List/Row, Dialog on native `<dialog>`, Feedback provider with `toast()` and promise-based `confirm()`, Page frame). Styling only through semantic tokens defined in `src/styles.css` (`bg-surface`, `text-ink-2`, `bg-accent`…), which switch on `html[data-theme]`. Do not use raw Tailwind colours.
- `src/app/` – providers, router (`router.tsx`, lazy route components via `page(import, 'ExportName')`), guards, `AppShell` (desktop sidebar ≥lg, bottom tab bar below), theme.

### Multi-tenancy
Every business table has `shop_id`; RLS is `is_shop_member(shop_id)` (owner-only for shop settings, invites, audit log). Cross-table references use composite FKs `(id, shop_id)`. The active shop comes from `ShopProvider` (`useShop()` inside the shell; selection persisted in `localStorage['pref.shop']`). Query keys start with `['shop', shopId, …]`; invalidating `['shop', shopId]` refreshes everything for that shop. Shop creation, invites, member/role changes, deletions and exports go through RPCs in `*_rpc.sql`, which raise short error codes (`forbidden`, `last_owner`, …) mapped to messages in `src/lib/errors.ts` + `t.errors`.

### Orders
- `orders.number`, `created_by` and `status_token` are set by triggers and protected by `guard_order_columns`; trusted RPCs bypass via `set_config('app.trusted_order_write','on',true)`. Never set them from the client.
- Status values and per-service workflows must match the `orders_status_matches_service` check constraint. Changing `service` must go through `coerceStatus` (done in `features/orders/form.ts#updateForm`).
- Status changes are recorded in `order_status_events` by trigger; the public `/track/:token` page reads them through `get_order_status` (minimal fields only — keep it free of names, measurements and prices).
- `features/orders/form.ts` is the single conversion point between editor state and the insert/update payload (validation, money parsing, dropping fields irrelevant to the garment).

### Measurements
`MEASUREMENTS` in `src/domain/measurements.ts` drives the table, guided mode, the SVG body figure (`mark` coordinates in a 200×460 viewBox) and validation. Values are stored as `orders.measurements` jsonb keyed by the catalogue key (`'jacket.sleeve_length'`), numbers or `{l, r}` for paired. Keys are persisted: renaming one needs a data migration. Adding one requires names and how-to text in both dictionaries (enforced by a test). Always pass DB values through `sanitizeValues`.

### Photos
Private bucket `order-photos`, object path `<shop_id>/<order_id>/<uuid>.jpg` (+ `_thumb`), enforced by storage policies on the first folder and a check constraint on `order_photos`. `lib/image.ts` re-encodes through canvas (strips EXIF/GPS). SQL cannot delete storage files: deleting `order_photos` rows (directly or via cascade) queues paths in `storage_gc`; the client drains it after deletions (`drainStorageGc`) and the `storage-gc` edge function is the backstop. Shop/account deletion removes files first, then calls the RPC.

### i18n
`src/i18n/sv.ts` defines the `Messages` type; `en.ts` must match it (test checks key parity). Strings with parameters are functions. Use `useI18n()` for `t`, `locale` and `fmt` (Intl-based date/number helpers; plain `YYYY-MM-DD` dates are treated as calendar days).

### GDPR constraints to preserve
- No third-party network requests from the browser (fonts are bundled via `@fontsource-variable`; CSP in `public/_headers` / `vercel.json` only allows self + `*.supabase.co`). No analytics or non-essential storage — otherwise a consent mechanism becomes necessary.
- Audit log triggers store column names only, never values.
- Retention (`run_retention`, `retention_preview`, `keep_client`) is driven by `clients.last_activity_at`, refreshed by order triggers.
- Legal texts live in `src/features/legal/LegalPages.tsx`; update them when data categories, processors or retention change.
