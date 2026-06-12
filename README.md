# sunshine-beiya-app

Sunshine Beiya Home Service Platform

## Database

This repository now includes a real local PostgreSQL database foundation for development and backend integration.

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

Documentation:

- `database/README.md`
- `docs/database-design.md`
