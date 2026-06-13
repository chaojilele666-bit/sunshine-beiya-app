# data.json Migration

`Backstage/data.json` is retained as a local backup and temporary read-only fallback reference. It must not be deleted during the MVP migration.

## Import Command

From the repository root:

```powershell
cd Backstage
npm run migrate:data-json
```

The script reads:

```text
Backstage/data.json
```

and imports these resources into PostgreSQL:

- `accounts` -> `backstage_accounts`
- `ayis` -> `ayis`
- `demands` -> `demands`
- `appointments` -> `appointments`
- `applications` -> `applications`
- `orders` -> `orders`
- `stores` -> `stores`
- `serviceModules` -> `service_modules`
- `banners` -> `banners`

The import preserves the existing numeric JSON `id` values and uses `ON CONFLICT (id) DO UPDATE`, so it can be run repeatedly without duplicating rows.

## Current Policy

- Normal backstage reads and writes use PostgreSQL.
- `data.json` is not written when PostgreSQL is unavailable.
- `/api/miniprogram` may return a clearly marked read-only fallback only when PostgreSQL cannot be reached.
- Online payment is out of scope.
