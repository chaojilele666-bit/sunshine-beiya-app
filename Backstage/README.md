# 北京阳光北亚家政后台 MVP

这个目录是后台管理服务，使用原生 Node.js。当前后台已接入本地 PostgreSQL，`Backstage/data.json` 只保留为历史演示数据备份和临时只读兜底参考。

## 启动前准备

从项目根目录启动 PostgreSQL：

```powershell
docker compose up -d
docker inspect sunshine-beiya-postgres --format "{{.State.Health.Status}}"
```

安装后台依赖：

```powershell
cd Backstage
npm install
```

如果没有全局 `npm`：

```powershell
docker run --rm -v "${PWD}\Backstage:/app" -w /app node:22-alpine npm install
```

## 启动后台

```powershell
cd Backstage
node server.js
```

如果系统没有全局 `node`，可以使用 Codex runtime：

```powershell
cd Backstage
& "C:\Users\24225\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.js
```

后台地址：

```text
http://localhost:5177
```

## 关键接口

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `GET /api/health/database`
- `GET /api/dashboard`
- `GET /api/miniprogram`
- `GET/POST/PUT/DELETE /api/accounts`
- `GET/POST/PUT/DELETE /api/ayis`
- `GET/POST/PUT/DELETE /api/demands`
- `GET/POST/PUT/DELETE /api/appointments`
- `GET/POST/PUT/DELETE /api/applications`
- `GET/POST/PUT/DELETE /api/orders`
- `GET/POST/PUT/DELETE /api/orderDispatches`
- `GET/POST/PUT/DELETE /api/stores`
- `GET/POST/PUT/DELETE /api/serviceModules`
- `GET/POST/PUT/DELETE /api/banners`

后台管理接口需要登录，并由后端根据 token 判断权限：

- `boss`：可访问全部后台模块、账号管理、经营看板和审计日志。
- `operator`：可管理业务模块，不能管理 boss 账号，不能访问老板看板。
- `customer`、`ayi`：不能进入后台管理页面，只保留接口层的个人数据权限。

当前权限不是前端模拟；前端隐藏菜单只是体验层，后端仍会校验。

## 本地测试账号

先设置本地密码环境变量，再创建测试账号：

```powershell
$env:AUTH_TEST_PASSWORD="<local-only-password-at-least-8-chars>"
cd Backstage
npm run auth:create-test-accounts
Remove-Item Env:\AUTH_TEST_PASSWORD
```

默认用户名：

- `boss.local`
- `operator.local`
- `customer.local`
- `ayi.local`

不要提交真实密码。

## data.json

位置：

```text
Backstage/data.json
```

不要删除。它现在用于迁移来源、历史备份和临时只读兜底，不再作为后台正常写入数据源。

导入命令：

```powershell
cd Backstage
npm run migrate:data-json
```

迁移脚本可重复执行，会按原 JSON `id` 幂等 upsert。
