# PostgreSQL Backstage API

Base URL:

```text
http://localhost:5177/api
```

## Health

- `GET /health/database`

Returns `ok: true` and `source: "postgres"` when PostgreSQL is reachable.

## Auth

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/change-password`

Login accepts `identifier` plus `password`. `identifier` may be a username or phone number.

Protected requests must include:

```text
Authorization: Bearer <token>
```

Tokens expire according to `AUTH_SESSION_TTL_HOURS`. PostgreSQL stores only token hashes in `auth_sessions`.

## PostgreSQL CRUD Resources

These resources support `GET`, `POST`, `PUT /:id`, and `DELETE /:id` when the authenticated role has permission:

- `accounts`
- `ayis`
- `demands`
- `appointments`
- `applications`
- `orders`
- `orderDispatches`
- `stores`
- `serviceModules`
- `banners`

All write operations use parameterized SQL through the repository layer and write to `audit_logs`.

Actor identity now comes from the session token. The old frontend-supplied actor headers are no longer trusted for normal authenticated writes.

## Permissions

- `boss`: all backstage data, dashboard, accounts, and audit logs.
- `operator`: business resources except accounts and boss-only dashboard/audit logs.
- `customer`: own demands, appointments, and orders only.
- `ayi`: own profile, applications, appointments, dispatches, orders, and open demands.

`GET /miniprogram` remains a public display endpoint.

`GET /auditLogs` is boss-only.

## Dashboard

- `GET /dashboard`

Returns live PostgreSQL statistics:

- customer count by distinct demand phone
- ayi totals and review status counts
- demand counts
- today changes from `audit_logs`
- today dispatches
- appointment/application/order counts
- status distributions
- recent audit records

## Mini Program

- `GET /miniprogram`

Returns a shape compatible with the existing mini program:

- `ayis`
- `demands`
- `stores`
- `serviceModules`
- `banners`

When PostgreSQL is available, the response includes `source: "postgres"`.
