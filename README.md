# 北京阳光北亚家政平台

Sunshine Beiya App 是北京阳光北亚家政的本地工程项目，包含微信小程序、原生 Node.js 后台、PostgreSQL 数据库迁移和项目文档。

当前分支：`V3`

## 项目简介

当前项目是面向生产化演进的本地 MVP，不是正式上线部署版本。

已实现：

- 微信小程序客户端和阿姨端页面。
- 后台运营端和管理端登录、权限和管理页面。
- PostgreSQL 本地数据库和 V001-V006 迁移。
- 门店列表、门店详情、门店图片文件 URL、本地 HTTP 图片兼容。
- V3.1 客户需求推荐匹配闭环。
- 客户端首页公司展示轮播和服务中心。

未实现：

- 正式微信登录。
- 线上 HTTPS 部署。
- 云存储或正式文件服务。
- 订单完整闭环和线上支付。
- 一键识别、OCR、大模型能力。

## 技术栈

- 微信小程序：原生小程序页面。
- 后台：原生 Node.js HTTP 服务。
- 数据库：PostgreSQL 16，通过 Docker Compose 本地运行。
- 图片：本地 MVP 使用 `Backstage/public/uploads/` 文件 URL；正式上线前需要迁移到 HTTPS 文件服务或云存储。

## 目录结构

- `frontend/`：微信小程序。
- `Backstage/`：后台 Node.js 服务和后台网页。
- `database/`：Docker Compose PostgreSQL 和 V001-V006 初始化/迁移 SQL。
- `docs/`：项目状态、架构、API、数据库、权限、测试和路线图。

## 本地启动

从仓库根目录启动 PostgreSQL：

```powershell
docker compose up -d
docker inspect sunshine-beiya-postgres --format "{{.State.Health.Status}}"
```

启动后台：

```powershell
cd Backstage
node server.js
```

后台地址：

```text
http://localhost:5177
```

微信开发者工具导入目录：

```text
frontend/
```

本地调试 `localhost` 请求时，需要在微信开发者工具本地配置中关闭合法域名检查。详见：

```text
docs/03_LOCAL_DEVELOPMENT_GUIDE.md
```

## 当前版本状态

- 当前 V3/V3.1 仍有未提交开发修改。
- 当前后台对外只使用“运营端”和“管理端”两个后台身份名称。
- 内部角色代码仍为 `operator` 和 `boss`。
- 当前没有线上支付能力；`payStatus` 只是历史展示字段，不代表支付功能。

## 文档入口

推荐阅读：

1. [docs/00_DOCUMENTATION_INDEX.md](docs/00_DOCUMENTATION_INDEX.md)
2. [docs/01_CURRENT_PROJECT_STATUS.md](docs/01_CURRENT_PROJECT_STATUS.md)
3. [docs/03_LOCAL_DEVELOPMENT_GUIDE.md](docs/03_LOCAL_DEVELOPMENT_GUIDE.md)
4. [docs/11_TESTING_CHECKLIST.md](docs/11_TESTING_CHECKLIST.md)

## 安全范围

- 不提交 `.env`、真实密码、token、session、私钥或 API Key。
- 不把计划功能写成已完成。
- 不直接修改或推送 `main`。
