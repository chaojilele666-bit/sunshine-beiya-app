# Database 数据库目录

本目录包含 Docker Compose PostgreSQL 配置和数据库初始化/迁移 SQL。

## 当前文档

- 数据库和迁移说明：`docs/07_DATABASE_AND_MIGRATIONS.md`
- 本地启动和排错：`docs/03_LOCAL_DEVELOPMENT_GUIDE.md`

## 常用命令

```powershell
docker compose up -d
docker compose ps
docker inspect sunshine-beiya-postgres --format "{{.State.Health.Status}}"
```

## 注意事项

- V001 中存在标准化规划表，但当前 V2/V3 实际业务流程主要使用 V002 资源表和后续迁移表。
- 不要在没有明确迁移方案时混用 `customers`、`housekeepers`、`service_orders`、`manual_dispatches` 等 V001 规划表。
- V004 的门店详情演示数据不得依赖固定自增 ID；阿姨关联门店应通过稳定门店信息查找实际 ID，找不到时允许 `store_id` 为空。
- V005 到 V008 均要求可重复执行。中文 SQL 文件必须保存为 UTF-8 without BOM，并通过 `docker cp` 加 `psql -f` 执行，避免 PowerShell 管道破坏中文。
