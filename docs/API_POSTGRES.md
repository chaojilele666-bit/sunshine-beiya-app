# PostgreSQL Backstage API

Base URL:

```text
http://localhost:5177/api
```

## Health

- `GET /health/database`

Returns `ok: true` and `source: "postgres"` when PostgreSQL is reachable.

## PostgreSQL CRUD Resources

These resources support `GET`, `POST`, `PUT /:id`, and `DELETE /:id`:

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

For browser-originated writes, Backstage can pass the simulated current operator through headers:

- `x-actor-name`
- `x-actor-role`

Because HTTP header values must stay ASCII-safe in browsers, the frontend URL-encodes these values and the backend decodes them before writing `audit_logs`. This is audit context only. It is not a formal authentication or authorization mechanism.

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
