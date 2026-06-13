# 北京阳光北亚数据库说明

这个目录保存北京阳光北亚家政平台的本地 PostgreSQL 数据库基础文件，用于后续正式后端开发和本地联调。

注意：当前 MVP 演示后台仍然使用 `Backstage/data.json` 作为本地数据源。`database/` 目录是后续正式化开发准备，不代表当前小程序 demo 已经接入数据库。

## 包含内容

- PostgreSQL 16 Docker Compose 配置；
- 数据库表结构初始化 SQL；
- 本地演示种子数据；
- 环境变量示例文件。

## 主要数据表

当前数据库设计包含以下核心表：

- `users`：统一用户表；
- `customer_profiles`：客户资料；
- `worker_profiles`：阿姨/家政员资料；
- `addresses`：服务地址；
- `service_categories`：服务分类；
- `service_items`：服务项目；
- `worker_service_items`：阿姨可服务项目；
- `orders`：订单/服务需求；
- `payments`：旧支付相关表，当前不继续扩展；
- `reviews`：评价；
- `audit_logs`：后台操作审计日志。

## 本地启动方式

进入 `database/` 目录：

```bash
cd database
cp .env.example .env
docker compose up -d
```

查看数据库容器状态：

```bash
docker compose ps
```

连接数据库：

```bash
docker compose exec postgres psql -U sunshine_beiya -d sunshine_beiya
```

执行简单查询：

```sql
SELECT name, description FROM service_categories ORDER BY sort_order;
SELECT order_no, status, total_amount_cents FROM orders;
```

## 本地连接地址

默认本地连接字符串：

```text
postgresql://sunshine_beiya:change_me_to_a_strong_local_password@localhost:5432/sunshine_beiya
```

后续正式后端开发时，可以把这个值作为本地 `DATABASE_URL` 使用。

## 重置本地数据库

以下命令会删除本地数据库数据，并重新执行初始化脚本：

```bash
docker compose down -v
docker compose up -d
```

## 安全注意事项

- 不要提交 `.env` 文件；
- 不要在生产环境使用示例密码；
- 不要提交真实客户资料、手机号、身份证、健康证等敏感数据；
- 种子数据里的密码哈希只是占位数据，不能用于真实登录系统。

## 后续迁移说明

当前数据库目录使用原始 SQL 初始化文件，适合早期确认表结构。

等正式后端技术栈确定后，建议接入正式 migration 工具，例如：

- Prisma migrations；
- TypeORM migrations；
- Alembic migrations；
- Django migrations；
- Flyway / Liquibase。

第一阶段仍以跑通业务流程为主，不要提前把当前小程序 demo 强行改成生产数据库架构。