# Local PostgreSQL

This directory contains the local PostgreSQL 16 setup for Sunshine Beiya.

The database runs through Docker Compose and stores data in the named Docker volume `sunshine-beiya-app_sunshine_beiya_postgres_data`. Restarting or deleting the container does not delete the database data. Only removing the named volume resets the database.

## Windows PowerShell Commands

Run all commands from the repository root.

### Start

```powershell
docker compose up -d
```

### Check Container And Health

```powershell
docker compose ps
docker inspect sunshine-beiya-postgres --format "{{.State.Health.Status}}"
```

### Connect

```powershell
docker compose exec postgres psql -U sunshine_app -d sunshine_beiya
```

### List Tables

```powershell
docker compose exec postgres psql -U sunshine_app -d sunshine_beiya -c "\dt public.*"
```

### Query Test Data

```powershell
docker compose exec postgres psql -U sunshine_app -d sunshine_beiya -c "select order_no, status from service_orders order by created_at;"
```

### Stop Container

```powershell
docker compose stop
```

### Restart Container

```powershell
docker compose restart postgres
```

### Reset Database

This deletes the named database volume and all local PostgreSQL data.

```powershell
docker compose down -v
docker compose up -d
```

## Environment

Do not commit a real `.env` file. Use `.env.example` as the template for local-only values.

## Payment Scope

The current project does not implement online payment. Do not add WeChat Pay, Alipay, payment callbacks, refunds, revenue sharing, or reconciliation tables in this phase.

## Backstage API Smoke Test

The Backstage MVP now uses PostgreSQL for the main local management resources while keeping `Backstage/data.json` as a legacy backup and read-only fallback reference.

Run from the repository root:

```powershell
cd Backstage
npm install
node server.js
```

If global `npm` is unavailable, install dependencies with Docker:

```powershell
docker run --rm -v "${PWD}\Backstage:/app" -w /app node:22-alpine npm install
```

Smoke test endpoints:

```powershell
Invoke-RestMethod http://localhost:5177/api/health/database
Invoke-RestMethod http://localhost:5177/api/accounts
Invoke-RestMethod http://localhost:5177/api/ayis
Invoke-RestMethod http://localhost:5177/api/demands
Invoke-RestMethod http://localhost:5177/api/appointments
Invoke-RestMethod http://localhost:5177/api/applications
Invoke-RestMethod http://localhost:5177/api/orders
Invoke-RestMethod http://localhost:5177/api/orderDispatches
Invoke-RestMethod http://localhost:5177/api/stores
Invoke-RestMethod http://localhost:5177/api/serviceModules
Invoke-RestMethod http://localhost:5177/api/banners
Invoke-RestMethod http://localhost:5177/api/dashboard
Invoke-RestMethod http://localhost:5177/api/miniprogram
```

`/api/dashboard` and `/api/miniprogram` must return `source: "postgres"` when PostgreSQL is available.

## Import data.json

Run after PostgreSQL is healthy:

```powershell
cd Backstage
npm run migrate:data-json
```

The import is idempotent and upserts the existing local demo data into PostgreSQL. It does not delete `Backstage/data.json`.
