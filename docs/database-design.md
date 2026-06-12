# 数据库设计说明

## 目标

本数据库用于 Sunshine Beiya 家政服务平台的第一版可运行数据基础。

设计目标：

1. 能在本地通过 Docker 直接启动。
2. 支持前端和后端早期联调。
3. 覆盖家政服务平台的核心业务对象。
4. 不提交真实客户数据或生产密钥。
5. 后续可迁移到 Prisma、TypeORM、Alembic、Django migrations 等正式迁移系统。

## 数据库类型

当前使用：

```text
PostgreSQL 16
```

原因：

- 适合真实业务系统。
- 支持事务、约束、索引、JSONB、UUID。
- 后续可部署到云数据库或自建服务器。

## 核心业务模型

### 用户 users

统一保存客户、家政员、管理员和管理人员。

角色包括：

- `customer`
- `worker`
- `admin`
- `manager`

### 客户资料 customer_profiles

保存客户补充信息。

### 家政员资料 worker_profiles

保存家政员经验、认证状态、评分、服务城市等信息。

### 地址 addresses

保存客户服务地址。

### 服务分类 service_categories

例如：

- 日常保洁
- 深度清洁
- 长期家政

### 服务项目 service_items

例如：

- 两小时日常保洁
- 厨房深度清洁
- 长期家政面谈

### 家政员服务项目 worker_service_items

表示某个家政员能提供哪些服务，以及是否可接单。

### 订单 orders

保存客户预约服务的核心订单信息。

状态包括：

- `pending`
- `confirmed`
- `in_progress`
- `completed`
- `cancelled`
- `refunded`

### 支付 payments

保存订单支付信息。

支付方式包括：

- `wechat_pay`
- `alipay`
- `cash`
- `bank_transfer`
- `manual`

### 评价 reviews

保存客户对订单和家政员的评价。

### 审计日志 audit_logs

用于记录重要后台操作和系统事件。

## 启动方式

进入 `database/` 目录：

```bash
cp .env.example .env
docker compose up -d
```

连接数据库：

```bash
docker compose exec postgres psql -U sunshine_beiya -d sunshine_beiya
```

## 本地连接信息

默认连接字符串：

```text
postgresql://sunshine_beiya:change_me_to_a_strong_local_password@localhost:5432/sunshine_beiya
```

后端项目可以把它配置为：

```text
DATABASE_URL=postgresql://sunshine_beiya:change_me_to_a_strong_local_password@localhost:5432/sunshine_beiya
```

## 安全说明

- `.env` 不允许提交。
- `.env.example` 只放示例值。
- 种子数据只用于本地开发。
- 种子用户的密码哈希是占位符，不能用于生产认证。
- 不允许把真实客户姓名、电话、地址、支付信息提交到仓库。

## 后续建议

当后端技术栈确定后，应做以下升级：

1. 引入正式 migration 工具。
2. 将 SQL 初始化脚本迁移为版本化 migration。
3. 增加数据库访问层。
4. 增加 API 层测试。
5. 为生产环境配置独立云数据库。
6. 建立备份和恢复策略。
