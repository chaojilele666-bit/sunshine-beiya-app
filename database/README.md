# Sunshine Beiya Database

This directory contains a real local PostgreSQL database setup for the Sunshine Beiya Home Service Platform.

It is designed for local development and early backend integration.

## What is included

- PostgreSQL 16 Docker Compose setup
- Schema initialization SQL
- Local seed data
- Safe environment variable template

## Tables

Core tables:

- `users`
- `customer_profiles`
- `worker_profiles`
- `addresses`
- `service_categories`
- `service_items`
- `worker_service_items`
- `orders`
- `payments`
- `reviews`
- `audit_logs`

## Quick start

From this `database/` directory:

```bash
cp .env.example .env
docker compose up -d
```

Check database health:

```bash
docker compose ps
```

Connect with psql:

```bash
docker compose exec postgres psql -U sunshine_beiya -d sunshine_beiya
```

Run a simple query:

```sql
SELECT name, description FROM service_categories ORDER BY sort_order;
SELECT order_no, status, total_amount_cents FROM orders;
```

## Connection string

Local default:

```text
postgresql://sunshine_beiya:change_me_to_a_strong_local_password@localhost:5432/sunshine_beiya
```

Use this value as `DATABASE_URL` for the backend application.

## Reset local database

This removes local database data and re-runs the init scripts:

```bash
docker compose down -v
docker compose up -d
```

## Security notes

- Do not commit `.env`.
- Do not use the example password in production.
- Do not commit real customer data.
- The seed password hashes are placeholders and must not be used for real authentication.

## Migration note

The current setup uses raw SQL initialization files for the first usable database foundation.

When the backend stack is confirmed, replace or integrate this with the project's migration tool, such as:

- Prisma migrations
- TypeORM migrations
- Alembic migrations
- Django migrations
- Flyway / Liquibase
