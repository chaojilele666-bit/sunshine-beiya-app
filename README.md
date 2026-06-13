# sunshine-beiya-app

Sunshine Beiya Home Service Platform

## Project documents

- `docs/PROJECT_LOG.md` — current product framework, priorities, product boundaries, and chronological update history
- `docs/database-design.md` — current database design
- `database/README.md` — local database setup

Before changing the project, read `docs/PROJECT_LOG.md`. After every meaningful change, append a dated entry describing the state before the change, the exact changes, validation, and the state after the change.

## Current product boundary

The first version focuses on customer service requests, manual administrator assignment, worker task execution, status tracking, reviews, complaints, and follow-up.

Online payment is not part of the current product scope. New development must not depend on the legacy `payments` table.

## Database

This repository includes a real local PostgreSQL database foundation for development and backend integration.

Database files are under:

```text
database/
```

Quick start:

```bash
cd database
cp .env.example .env
docker compose up -d
```

Connect to the database:

```bash
docker compose exec postgres psql -U sunshine_beiya -d sunshine_beiya
```
