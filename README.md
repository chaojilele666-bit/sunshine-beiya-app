# sunshine-beiya-app

北京阳光北亚家政 MVP 本地演示项目。

## 目录

- `frontend/`：微信小程序 demo，页面结构暂不重设计。
- `Backstage/`：本地后台管理服务，原生 Node.js。
- `database/`：本地 PostgreSQL 16 Docker Compose 和初始化 SQL。
- `docs/`：项目日志、迁移说明和接口说明。

## 当前数据源

后台主要业务接口已逐步迁移到 PostgreSQL：

- 账号权限
- 阿姨资料
- 客户需求
- 预约面试
- 接单申请
- 订单
- 人工派单
- 门店
- 公司服务
- 首页轮播
- 经营看板
- 小程序读取接口 `/api/miniprogram`

`Backstage/data.json` 不删除，保留为历史演示数据备份和小程序临时只读兜底参考。正常情况下后台优先使用 PostgreSQL，不再把写入回落到 `data.json`。

## 本地启动

```powershell
docker compose up -d
docker inspect sunshine-beiya-postgres --format "{{.State.Health.Status}}"
```

安装后台依赖并启动：

```powershell
cd Backstage
npm install
node server.js
```

如果本机没有全局 `npm`，可以用 Docker 安装依赖：

```powershell
docker run --rm -v "${PWD}\Backstage:/app" -w /app node:22-alpine npm install
```

后台地址：

```text
http://localhost:5177
```

数据库健康检查：

```text
http://localhost:5177/api/health/database
```

## 安全范围

当前不开发线上支付，不新增微信支付、支付宝、支付回调、退款、分账或对账功能。旧字段 `payStatus` 只作为历史展示字段，不作为新支付能力依赖。
