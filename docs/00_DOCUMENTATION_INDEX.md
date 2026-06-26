# 文档总目录

本目录是当前 V3 分支的文档入口。优先阅读编号文档；旧文档只保留为兼容入口。

## 核心文档

- `DOCUMENT_INTRODUCTION.md`：快速了解项目主要目录和文件职责。
- `01_CURRENT_PROJECT_STATUS.md`：当前分支、已实现功能、未提交修改、stash、风险和待验证内容。
- `02_SYSTEM_ARCHITECTURE.md`：小程序、后台、Node.js、PostgreSQL、图片和数据流关系。
- `03_LOCAL_DEVELOPMENT_GUIDE.md`：本地启动、Docker、数据库、微信开发者工具、端口和常见问题。
- `04_ADMIN_BACKEND_GUIDE.md`：后台首页、hash 路由、各管理模块和日常操作。
- `05_MINIPROGRAM_GUIDE.md`：小程序客户端和阿姨端功能，分开说明。
- `06_API_REFERENCE.md`：当前后台和小程序 API。
- `07_DATABASE_AND_MIGRATIONS.md`：当前数据库表，以及 V001 到 V006 做了什么。
- `08_AUTH_AND_PERMISSIONS.md`：管理端、运营端、内部角色 `boss`/`operator` 和权限范围。
- `09_CHANGELOG.md`：V2、V3、V3.1、需求匹配、后台路由、首页和服务中心开发历史。
- `10_ROADMAP.md`：正式微信登录、订单闭环、服务器、大模型、一键识别、OCR 等计划。
- `11_TESTING_CHECKLIST.md`：自动测试和人工验收清单。

## 兼容入口

- `API_POSTGRES.md` -> `06_API_REFERENCE.md`
- `AUTH_AND_PERMISSIONS.md` -> `08_AUTH_AND_PERMISSIONS.md`
- `DATA_JSON_MIGRATION.md` -> `07_DATABASE_AND_MIGRATIONS.md`
- `PROJECT_LOG.md` -> `09_CHANGELOG.md`
