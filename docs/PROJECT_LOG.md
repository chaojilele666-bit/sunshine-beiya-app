# Project Log

## 2026-06-13 真实登录与后端权限系统

### 修改前状态

- 后台已经迁移到 PostgreSQL，主要资源 CRUD、人工派单、老板看板和 `audit_logs` 已可用。
- 后台页面仍依赖前端角色选择进入系统，权限边界主要靠隐藏菜单，不是真实安全权限。
- PostgreSQL 中已有 `customers`、`ayis`、`backstage_accounts`，但没有统一登录账号和 session 表。

### 本次目标

- 增加真实登录、session token、密码哈希和后端权限判断。
- 支持 `customer`、`ayi`、`operator`、`boss` 四类角色。
- 保持微信小程序页面不重写，保留 `/api/miniprogram` 匿名公开展示数据。
- 不新增线上支付能力，不删除现有 PostgreSQL 数据，不提交真实测试密码。

### 修改内容

- 新增 `database/init/V003__auth_and_permissions.sql`：
  - `user_accounts`
  - `auth_sessions`
  - 微信登录预留字段 `wechat_openid`、`wechat_unionid`
- 新增 `Backstage/repositories/authRepository.js`：
  - bcryptjs 密码校验和哈希
  - 随机 token 生成
  - token hash 入库
  - session 过期
  - 账号禁用检查
  - 失败次数锁定
  - 登录、登出、改密审计
- 新增 `Backstage/accessControl.js`：
  - 后端统一角色权限判断
  - customer/ayi 个人数据范围过滤
  - operator 禁止账号和老板看板权限
  - boss 全量后台权限
- 修改 `Backstage/server.js`：
  - 新增 `/api/auth/login`
  - 新增 `/api/auth/logout`
  - 新增 `/api/auth/me`
  - 新增 `/api/auth/change-password`
  - 新增 boss-only `/api/auditLogs`
  - 保护后台资源 CRUD，操作者身份从 token 解析
- 修改 `Backstage/public/index.html` 和 `Backstage/public/app.js`：
  - 停用前端模拟角色切换
  - 增加真实账号密码登录
  - token 失效后自动退出
  - boss/operator 根据后端返回资源显示菜单
- 新增 `Backstage/scripts/createTestAccounts.js`：
  - 从环境变量创建本地测试账号
  - 不在仓库写入真实密码
- 更新 README、Backstage README、API 文档，并新增 `docs/AUTH_AND_PERMISSIONS.md`。

### 实际执行

```powershell
docker run --rm -v "${PWD}\Backstage:/app" -w /app node:22-alpine npm install bcryptjs --save
docker compose exec -T postgres psql -U sunshine_app -d sunshine_beiya -f /docker-entrypoint-initdb.d/V003__auth_and_permissions.sql
$env:AUTH_TEST_PASSWORD='<local-only-password-at-least-8-chars>'
node Backstage\scripts\createTestAccounts.js
Remove-Item Env:\AUTH_TEST_PASSWORD
node --check Backstage\server.js
node --check Backstage\accessControl.js
node --check Backstage\repositories\authRepository.js
node --check Backstage\scripts\createTestAccounts.js
node --check Backstage\public\app.js
```

### 测试结果

- boss 登录成功。
- operator 登录成功。
- customer 登录成功。
- ayi 登录成功。
- 错误密码登录失败，返回 `401`。
- 禁用账号登录失败，返回 `403`。
- 未登录访问 `/api/accounts` 失败，返回 `401`。
- customer 访问后台账号接口失败，返回 `403`。
- customer 修改其他客户需求失败，返回 `403`。
- ayi 修改其他阿姨资料失败，返回 `403`。
- operator 创建/管理 boss 账号失败，返回 `403`。
- boss 可访问经营看板和账号模块。
- session 过期后 `/api/auth/me` 返回 `401`。
- 登录、登出和关键资源操作写入 `audit_logs`。
- Playwright UI 回归通过：
  - 未登录只显示登录页。
  - boss 显示经营看板、账号、业务模块、人工派单等全部菜单。
  - operator 不显示经营看板和账号管理，显示业务模块。

### 修改后状态

- 当前开发分支为 `v1`，跟踪 `origin/v1`。
- 本地和远程 `aaa` 分支已删除，删除前已确认 `aaa` 与 `origin/v1` 指向同一正式版本提交。
- `.env` 和 `Backstage/node_modules/` 仍为 ignored。
- 本次未执行 `git commit`、`git push` 或 GitHub 写操作。

### 尚未完成

- 未接微信正式登录，`wechat_openid` 和 `wechat_unionid` 仅预留。
- 客户和阿姨小程序页面未改造为登录态页面。
- 当前后台 token 存在 localStorage，生产上线前应评估 HTTPS、Cookie/CSRF 策略和更完整限流。
- 仍未新增任何线上支付能力。

## 2026-06-13 提交前验收与清理

### 验收范围

- 验收对象：本地 PostgreSQL、Backstage API、Backstage 浏览器页面、data.json 迁移脚本和提交候选文件。
- Browser 插件当前不可用，浏览器回归使用临时目录中的 Playwright 脚本执行；脚本和截图未写入仓库。
- 本次未执行 `git commit`、`git push` 或任何 GitHub 操作。

### 实际执行命令

```powershell
git status --short --ignored
git diff --stat
git diff --name-only
docker compose config --quiet
docker compose ps
docker inspect sunshine-beiya-postgres --format "{{.State.Health.Status}}"
docker compose exec -T postgres psql -U sunshine_app -d postgres -c "CREATE DATABASE sunshine_beiya_validation;"
docker compose exec -T postgres psql -U sunshine_app -d sunshine_beiya_validation -f /docker-entrypoint-initdb.d/V001__init_core_business_schema.sql
docker compose exec -T postgres psql -U sunshine_app -d sunshine_beiya_validation -f /docker-entrypoint-initdb.d/V002__backstage_resource_tables.sql
node Backstage\scripts\migrateDataJsonToPostgres.js
docker run --rm -v "$env:TEMP\sunshine-pw:/work" -w /work mcr.microsoft.com/playwright:v1.56.1-noble node acceptance.js
docker compose restart postgres
```

### 验收结果

- PostgreSQL 容器：`sunshine-beiya-postgres`，healthcheck 最终为 `healthy`。
- 数据库：`sunshine_beiya`，端口 `5432`，命名 Volume 重启后数据仍存在。
- 空库迁移验证：`V001__init_core_business_schema.sql` 后接 `V002__backstage_resource_tables.sql` 执行成功，公共 schema 基础表数量为 `24`。
- data.json 迁移脚本连续执行两次，导入数量一致，未产生重复业务数据。
- `/api/health/database` 返回 `ok=true`、`source=postgres`。
- `/api/miniprogram` 返回 `source=postgres`，并包含 `ayis`、`demands`、`stores`、`serviceModules`、`banners` 数组。
- 浏览器 UI 回归通过：老板端经营看板、账号管理、阿姨管理、客户需求、预约面试、接单申请、订单管理、人工派单、门店管理、公司服务、首页轮播均完成打开、读取 PostgreSQL、新增、修改、删除和中文保存验证。
- 运营端页面权限验证通过：运营端导航不显示 `accounts` 和 `dashboard`。当前权限仍是前端模拟，不是正式安全权限。
- Playwright 运行中没有控制台 error、warning 或 pageerror。

### 验收中修复的问题

- 修复 Backstage 页面写入审计操作者时中文请求头导致浏览器 `fetch` 抛错的问题：
  - 前端将 `x-actor-name`、`x-actor-role` 使用 `encodeURIComponent` 编码。
  - 后端 `getActor()` 使用 `decodeURIComponent` 解码后写入 `audit_logs`。
- `.env.example` 只保留环境变量名称，不提交数据库密码、测试账号密码或完整连接串。

### 清理结果

- 已删除明确标记为 `CodexTest...`、`UI测试...`、`UITEST...`、`YGTEST...`、`DELETE_TEST...` 的临时业务数据。
- 已清理上述测试标记相关 `audit_logs`，避免本地库保留测试噪声。
- 清理后主要后台演示表数量：
  - `backstage_accounts=4`
  - `ayis=2`
  - `demands=2`
  - `appointments=1`
  - `applications=1`
  - `orders=1`
  - `order_dispatches=0`
  - `stores=1`
  - `service_modules=3`
  - `banners=1`
- 清理后 `audit_logs=0`，所以老板端“最近后台操作记录”为空；验收阶段已确认实际操作会写入审计日志并驱动看板“今日修改记录”变化。

### 安全与提交前检查

- `.env` 被 `.gitignore` 忽略，不应提交。
- `Backstage/node_modules/` 被 `.gitignore` 忽略，不应提交。
- 未发现日志文件、临时测试脚本或 Playwright 截图写入仓库。
- 未新增微信支付、支付宝、支付回调、退款、分账、对账等线上支付功能。
- `Backstage/data.json` 未删除，继续作为备份和受控只读兜底参考。

## 2026-06-13 Backstage PostgreSQL 主流程迁移

### 修改前状态

- PostgreSQL 已启动并通过 healthcheck。
- `Backstage/server.js` 已有最小 PostgreSQL 连接池和服务分类只读接口，但主要后台资源仍未全部迁移。
- `Backstage/data.json` 包含 MVP 演示数据：`accounts`、`ayis`、`demands`、`appointments`、`applications`、`orders`、`stores`、`serviceModules`、`banners`。
- 后台页面 `Backstage/public/` 依赖上述资源名和字段名。
- 微信小程序 `frontend/app.js` 通过 `/api/miniprogram` 获取阿姨、需求、门店、公司服务和轮播图，并通过 `appointments`、`demands`、`ayis`、`applications` POST 提交。

### 本次目标

- 后台正常读写优先使用 PostgreSQL。
- 保留 `Backstage/data.json`，只作为历史备份和临时只读兜底参考。
- 不修改微信小程序页面。
- 不新增线上支付能力；旧 `payStatus` 只作为历史字段保留。

### 新增表和字段

新增 `database/init/V002__backstage_resource_tables.sql`：

- `company_info`
- `backstage_accounts`
- `ayis`
- `demands`
- `appointments`
- `applications`
- `orders`
- `order_dispatches`
- `stores`
- `service_modules`
- `banners`

扩展 `audit_logs`：`actor_role`、`resource_type`、`resource_id_text`、`before_summary`、`after_summary`。

### 资源映射

| JSON/API 资源 | PostgreSQL 表 |
| --- | --- |
| `accounts` | `backstage_accounts` |
| `ayis` | `ayis` |
| `demands` | `demands` |
| `appointments` | `appointments` |
| `applications` | `applications` |
| `orders` | `orders` |
| `orderDispatches` | `order_dispatches` |
| `stores` | `stores` |
| `serviceModules` | `service_modules` |
| `banners` | `banners` |

### 修改文件

- `.gitignore`
- `.env.example`
- `README.md`
- `Backstage/README.md`
- `Backstage/package.json`
- `Backstage/package-lock.json`
- `Backstage/db.js`
- `Backstage/server.js`
- `Backstage/repositories/resourceRepository.js`
- `Backstage/repositories/backstageRepository.js`
- `Backstage/repositories/serviceCatalogRepository.js`
- `Backstage/scripts/migrateDataJsonToPostgres.js`
- `Backstage/public/index.html`
- `Backstage/public/app.js`
- `database/README.md`
- `database/init/V002__backstage_resource_tables.sql`
- `docs/API_POSTGRES.md`
- `docs/DATA_JSON_MIGRATION.md`
- `docs/PROJECT_LOG.md`

### 实际执行命令和结果

```powershell
docker compose exec -T postgres psql -U sunshine_app -d sunshine_beiya -f /docker-entrypoint-initdb.d/V002__backstage_resource_tables.sql
node Backstage\scripts\migrateDataJsonToPostgres.js
docker compose restart postgres
```

`data.json` 导入结果：

```json
{
  "accounts": 4,
  "ayis": 2,
  "demands": 2,
  "appointments": 1,
  "applications": 1,
  "orders": 1,
  "stores": 1,
  "serviceModules": 3,
  "banners": 1
}
```

### API 迁移结果

以下接口已改为 PostgreSQL：

- `/api/accounts`
- `/api/ayis`
- `/api/demands`
- `/api/appointments`
- `/api/applications`
- `/api/orders`
- `/api/orderDispatches`
- `/api/stores`
- `/api/serviceModules`
- `/api/banners`
- `/api/dashboard`
- `/api/miniprogram`

主要资源支持 `GET`、`POST`、`PUT`、`DELETE`。写入使用参数化 SQL，并自动写入 `audit_logs`。

### 实际测试结果

PostgreSQL healthcheck：

```text
healthy
```

后台启动：

```text
backstage_pid=23124
```

GET 接口：

| 接口 | 结果 |
| --- | --- |
| `/api/health/database` | `ok=True source=postgres` |
| `/api/accounts` | `count=4` |
| `/api/ayis` | `count=3` |
| `/api/demands` | `count=3` |
| `/api/appointments` | `count=2` |
| `/api/applications` | `count=2` |
| `/api/orders` | `count=2` |
| `/api/orderDispatches` | `count=1` |
| `/api/stores` | `count=2` |
| `/api/serviceModules` | `count=3` |
| `/api/banners` | `count=1` |
| `/api/dashboard` | `source=postgres cards=12 tables=5` |
| `/api/miniprogram` | `source=postgres ayis=2 demands=3 stores=2 modules=3 banners=1` |

写入测试：

- 新增阿姨：成功，ID `3`
- 修改阿姨：成功，状态更新为 `已认证`
- 新增客户需求：成功，ID `103`
- 修改客户需求状态：成功，状态更新为 `已匹配`
- 新增门店：成功，ID `2`
- 修改公司服务：成功，ID `1`
- 创建预约：成功，ID `202`
- 创建接单申请：成功，ID `302`
- 创建订单：成功，ID `402`
- 创建人工派单：成功，ID `1`
- 创建后删除临时派单：成功，临时 `DELETE_TEST` 派单剩余 `0`

审计日志已记录 `create`、`update`、`dispatch`、`delete`。

经营看板验证：

- `客户总数=3`
- `阿姨总数=3`
- `已认证阿姨=2`
- `待审核阿姨=1`
- `客户需求总数=3`
- `今日新增客户需求=3`
- `今日新增阿姨=3`
- `今日修改记录=13`
- `今日派单=1`
- `预约面试=2`
- `接单申请=2`
- `订单数量=2`

重启验证：

- 重启 PostgreSQL 后 healthcheck 回到 `healthy`。
- 重启 Backstage 后 `/api/orders=2`、`/api/orderDispatches=1`、`/api/miniprogram source=postgres`。

### 发现的问题

- PowerShell 通过管道传入 Node 的中文测试值曾被终端编码转换成 `???`，后续用 Unicode 转义重新验证，接口和数据库可正确保存中文状态。
- `payStatus` 仍存在于 `orders` 表和后台字段中，仅作为历史字段保留，未扩展支付逻辑。
- 当前后台登录仍是前端模拟角色，不是真实登录系统。

### 修改后状态

- 后台主要 MVP 资源已使用 PostgreSQL 读写。
- `Backstage/data.json` 未删除，正常写入不再回落到它。
- 小程序页面未重设计，现有 `/api/miniprogram` 返回结构保持兼容。
- 老板端经营看板从 PostgreSQL 实时统计，并能看到今日修改记录和最近操作。
- 运营端页面不包含 `accounts`，不能从导航进入账号权限管理。
- 未执行 `git commit`、`git push` 或 GitHub 操作。

### 尚未完成内容

- 未实现真实账号登录和后端权限校验，当前仍是 MVP 前端角色选择。
- 未把 `orders.payStatus` 清理为非支付含义字段。
- 未迁移微信小程序本地 fallback 数据文件。
- 当时未做完整浏览器端 UI 回归；已在本文件顶部“提交前验收与清理”阶段补做。

### 下一步建议

1. 增加真实后台登录和服务端权限判断。
2. 将 `audit_logs` 展示成老板端独立“操作日志”页面或 dashboard 明细。
3. 梳理 `payStatus`，改名或移除，避免未来误认为已接支付。
4. 将图片 base64 迁移到对象存储或云存储字段。
5. 为客户、阿姨、订单等核心流程补自动化 API 测试。

## 2026-06-13 Backstage PostgreSQL 只读接入

### 修改前状态

- PostgreSQL 容器 `sunshine-beiya-postgres` 已真实运行，healthcheck 为 `healthy`。
- 数据库 `sunshine_beiya` 已创建 13 张业务表，并已有服务分类、服务项目、订单/服务需求、人工派单、状态历史、沟通、评价、投诉、回访和审计日志种子数据。
- `Backstage/server.js` 修改前通过 `DATA_FILE = path.join(ROOT, 'data.json')` 指向 `Backstage/data.json`。
- `readData()` 使用 `fs.readFileSync(DATA_FILE, 'utf8')` 读取 JSON。
- `writeData(data)` 使用 `fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')` 写回 JSON。
- `/api/dashboard`、`/api/miniprogram`、`/api/:resource` 仍以 `Backstage/data.json` 为数据源。

### 第一阶段整理结果

- 已检查 `git status` 和 `git diff`。
- 数据库相关变更包括 `.gitignore`、`.env.example`、`docker-compose.yml`、`database/`、`docs/PROJECT_LOG.md`，以及本阶段新增的 `Backstage/package.json`、`Backstage/package-lock.json`、`Backstage/db.js`、`Backstage/repositories/serviceCatalogRepository.js`、`Backstage/server.js`。
- `Backstage/public/app.js` 和 `Backstage/public/styles.css` 是之前账号分组 UI 调整，不属于数据库任务，不建议加入数据库基础版本提交。
- 本地 `.env` 已确认被 `.gitignore` 忽略，不得提交。
- 已删除本地数据库中的持久化测试客户：
  - `name='PERSISTENCE_TEST_LOCAL_VOLUME_20260613'`
  - `phone='19999991313'`
- 删除后查询结果：
  - `persistence_test_remaining = 0`
  - 正常种子客户 `13800000001`、`13800000002` 仍为 2 条。
- PostgreSQL 最终 healthcheck：`healthy`。

### 修改内容

- 修改 `.gitignore`：
  - 增加 `node_modules/` 忽略规则。
  - 保留 `.env`、`.env.*` 忽略规则，并允许 `.env.example`。
- 修改 `.env.example`：
  - 增加 `DATABASE_URL`、认证 session 和本地测试账号创建所需环境变量名称，具体密码和连接串只写入本地 `.env`。
- 新增 `Backstage/package.json` 和 `Backstage/package-lock.json`：
  - 引入 `pg`，用于 PostgreSQL 连接池。
- 新增 `Backstage/db.js`：
  - 加载项目根目录 `.env` 和 `Backstage/.env`。
  - 优先使用 `DATABASE_URL`。
  - 未提供 `DATABASE_URL` 时使用 `POSTGRES_HOST`、`POSTGRES_PORT`、`POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`。
  - 不在代码中写入真实密码。
  - 使用 `pg.Pool` 创建连接池。
- 新增 `Backstage/repositories/serviceCatalogRepository.js`：
  - `listServiceCategories()`
  - `listServiceItems()`
  - `getServiceCatalog()`
- 修改 `Backstage/server.js`：
  - 新增 `GET /api/health/database`，执行 `SELECT 1 AS ok`。
  - 新增 `GET /api/service-categories`，从 PostgreSQL 读取 `service_categories`。
  - 新增 `GET /api/service-items`，从 PostgreSQL 读取 `service_items`。
  - 新增 `GET /api/service-catalog`，组合返回服务分类和服务项目。
  - PostgreSQL 不可用时返回 `503` 和明确错误信息，不静默伪造成功。
  - 其他旧接口继续使用 `Backstage/data.json`。
- 修改 `database/README.md`：
  - 增加 Backstage PostgreSQL 只读接口 smoke test 说明。

### 实际验证

语法检查：

```powershell
node --check Backstage/server.js
node --check Backstage/db.js
node --check Backstage/repositories/serviceCatalogRepository.js
```

结果：全部通过。

PostgreSQL healthcheck：

```text
healthy
```

启动 Backstage：

```text
backstage_pid=584
```

接口验证：

| 接口 | 结果 |
| --- | --- |
| `GET /api/health/database` | `ok=True`, `source=postgres`, `db=sunshine_beiya`, `usesDatabaseUrl=True` |
| `GET /api/service-categories` | `source=postgres`, `categories_count=4`, `category_codes=maternal_childcare,home_care,elderly_care,cleaning` |
| `GET /api/service-items` | `source=postgres`, `items_count=4`, `item_codes=yuesao,yuer_sao,live_in_nanny,hourly_cleaning` |
| `GET /api/service-catalog` | `source=postgres`, `categories=4`, `items=4` |

这些返回值来自 PostgreSQL，因为响应明确包含 `source=postgres`，且读取的是 `service_categories`、`service_items` 表中的 code 字段，不来自 `Backstage/data.json`。

### 修改后状态

- PostgreSQL 容器仍为 `healthy`。
- Backstage 已具备最小 PostgreSQL 只读链路。
- 第一批迁移范围仅包含：
  - `service_categories`
  - `service_items`
- 客户写入、订单写入、人工派单等复杂流程未迁移。
- `Backstage/data.json` 仍保留，并继续作为旧演示数据和未迁移接口的数据源。
- 未修改微信小程序页面。
- 未新增任何线上支付能力。
- 未执行 `git commit`、`git push` 或 GitHub 操作。

### 下一步建议

1. 先审核本次数据库基础设施和 Backstage 只读接口变更。
2. 确认接口命名后，再让后台页面逐步读取 `/api/service-categories` 和 `/api/service-items`。
3. 后续迁移写入流程前，应先设计 repository 层的事务边界和字段映射，不要直接把 JSON 结构硬塞进 SQL。
4. 复杂流程迁移顺序建议为：只读列表 -> 客户需求只读 -> 客户需求写入 -> 订单状态历史 -> 人工派单。
5. 继续禁止把旧 `payStatus` 或任何旧 `payments` 设计作为新支付功能依赖。

## 2026-06-13 PostgreSQL 本地真实启动与验证

### 修改前状态

- 项目根目录已定位为当前 VS Code 工作区：`c:\Users\24225\Desktop\yangguang\sunshine-beiya-app`。
- 根目录包含 `docker-compose.yml`、`.env.example`、`database/`、`docs/`、`Backstage/`、`frontend/`。
- 之前记录中 Docker Desktop Linux Engine 不可用，`docker compose up -d` 未能真正启动 PostgreSQL，表创建、种子数据和持久化测试未完成。
- 当前任务开始时 Docker 已恢复，`docker version` 同时显示 Client 和 Server。
- 当前后台仍使用 `Backstage/data.json`，本次未删除该文件，也未把 `Backstage/server.js` 切换到 PostgreSQL。
- 本次未修改微信小程序页面，未新增微信支付、支付宝、支付回调、退款、分账、对账等线上支付能力。

### 环境变量与安全检查

- 本地 `.env` 起初不存在。
- 已根据 `.env.example` 创建本地 `.env`。
- 已执行 `git check-ignore -v .env`，确认 `.env` 被 `.gitignore:151:.env` 忽略。
- `.env` 仅保留在本地工作区，不应提交真实密码。

### 实际执行的命令

```powershell
Get-Location
rg --files -g "docker-compose.yml" -g ".env.example" -g "PROJECT_LOG.md" -g ".gitignore"
Get-ChildItem -Force
Get-Content -Raw docker-compose.yml
Get-Content -Raw .env.example
Get-Content -Raw .gitignore
rg --files database docs
Test-Path .env
Copy-Item -LiteralPath .env.example -Destination .env -Force
git check-ignore -v .env
docker version
docker compose config
docker compose up -d
docker compose ps
docker inspect sunshine-beiya-postgres --format "{{.State.Health.Status}}"
docker logs --tail 120 sunshine-beiya-postgres
docker compose exec -T postgres psql -U sunshine_app -d sunshine_beiya -c "\dt public.*"
docker compose exec -T postgres psql -U sunshine_app -d sunshine_beiya -At -c "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE';"
docker compose exec -T postgres psql -U sunshine_app -d sunshine_beiya -f /docker-entrypoint-initdb.d/V001__init_core_business_schema.sql
docker compose exec -T postgres psql -U sunshine_app -d sunshine_beiya -c "delete from service_addresses ..."
docker compose exec -T postgres psql -U sunshine_app -d sunshine_beiya -c "insert into customers ... PERSISTENCE_TEST_LOCAL_VOLUME_20260613 ..."
docker compose restart postgres
docker compose ps
docker volume ls --filter name=sunshine-beiya-app_sunshine_beiya_postgres_data
```

### Docker 与 PostgreSQL 运行结果

- Docker Client：`29.5.3`
- Docker Server：Docker Desktop `4.77.0 (228796)`，Engine `29.5.3`
- Compose 项目名：`sunshine-beiya-app`
- 容器名称：`sunshine-beiya-postgres`
- 镜像：`postgres:16`
- 数据库名称：`sunshine_beiya`
- 数据库用户：`sunshine_app`
- 本地端口：`5432 -> 5432`
- 命名 Volume：`sunshine-beiya-app_sunshine_beiya_postgres_data`
- 最终 `docker compose ps` 状态：`Up ... (healthy)`
- PostgreSQL 日志确认：
  - `database system is ready to accept connections`
  - 重启后日志显示 `PostgreSQL Database directory appears to contain a database; Skipping initialization`，说明使用的是已存在的数据目录。

### 初始化问题与修复

- 首次启动后，13 张表已创建，但种子数据不完整。
- 具体表现：
  - `customers`、`housekeepers`、`service_categories`、`service_addresses` 有数据。
  - `service_items` 为空，导致 `service_orders`、`manual_dispatches`、`order_status_history`、`customer_communications`、`reviews`、`complaints`、`follow_ups`、`audit_logs` 等依赖链路为空。
- 原因：`database/init/V001__init_core_business_schema.sql` 中服务分类插入使用了未被后续主查询可靠引用的 DML CTE，服务项目插入没有读到分类结果。
- 已修复：
  - 将 `service_categories` upsert 和 `service_items` upsert 拆成两个独立语句。
  - 为 `service_addresses`、`customer_communications`、`complaints`、`follow_ups` 的 seed 插入补充 `NOT EXISTS` 防重复条件。
  - 对当前已运行数据库补跑修复后的初始化脚本。
  - 清理补跑期间产生的一条重复 `service_addresses`，保留 1 条测试地址。

### 真实业务表核对

执行 `\dt public.*` 后确认共有 13 张业务表：

| 表名 | 用途 |
| --- | --- |
| `customers` | 客户 |
| `housekeepers` | 家政员/阿姨 |
| `service_categories` | 服务分类 |
| `service_items` | 服务项目 |
| `service_addresses` | 服务地址 |
| `service_orders` | 订单/服务需求 |
| `manual_dispatches` | 人工派单 |
| `order_status_history` | 状态历史 |
| `customer_communications` | 客户沟通 |
| `reviews` | 评价 |
| `complaints` | 投诉 |
| `follow_ups` | 回访 |
| `audit_logs` | 审计日志 |

最终表数量统计：

| 表名 | 行数 |
| --- | ---: |
| `audit_logs` | 1 |
| `complaints` | 1 |
| `customer_communications` | 1 |
| `customers` | 3 |
| `follow_ups` | 1 |
| `housekeepers` | 2 |
| `manual_dispatches` | 1 |
| `order_status_history` | 1 |
| `reviews` | 1 |
| `service_addresses` | 1 |
| `service_categories` | 4 |
| `service_items` | 4 |
| `service_orders` | 1 |

说明：`customers` 为 3 行，其中 2 行是初始化种子客户，1 行是持久化测试客户。

### 种子数据查询结果

服务分类：

| code | name | sort_order |
| --- | --- | ---: |
| `maternal_childcare` | 母婴护理 | 10 |
| `home_care` | 家庭保姆 | 20 |
| `elderly_care` | 养老护理 | 30 |
| `cleaning` | 保洁小时工 | 40 |

服务项目：

| code | name | category_code | unit | base_price_min | base_price_max |
| --- | --- | --- | --- | ---: | ---: |
| `hourly_cleaning` | 小时工保洁 | `cleaning` | `hour` | 60.00 | 120.00 |
| `live_in_nanny` | 住家保姆 | `home_care` | `month` | 7500.00 | 12000.00 |
| `yuer_sao` | 育儿嫂 | `maternal_childcare` | `month` | 9000.00 | 16000.00 |
| `yuesao` | 月嫂 | `maternal_childcare` | `month` | 12000.00 | 22000.00 |

订单/服务需求链路：

| customer | phone | order_no | service_item | status | budget_min | budget_max |
| --- | --- | --- | --- | --- | ---: | ---: |
| 测试客户赵女士 | `13800000001` | `YGTEST20260613001` | 育儿嫂 | `matching` | 9000.00 | 12000.00 |

人工派单：

| housekeeper | dispatch_status | assigned_by |
| --- | --- | --- |
| 测试阿姨王女士 | `proposed` | 测试顾问 |

其他链路：

| 表 | 核对结果 |
| --- | --- |
| `customer_communications` | `phone / outbound / 测试顾问` |
| `reviews` | `rating=5 / visible` |
| `complaints` | `service_feedback / resolved` |
| `follow_ups` | `pre_service / completed` |
| `audit_logs` | `system / seed / service_orders` |

### 持久化测试结果

插入测试数据：

```sql
insert into customers (name, phone, source, status, notes)
values (
  'PERSISTENCE_TEST_LOCAL_VOLUME_20260613',
  '19999991313',
  'persistence_test',
  'inactive',
  '持久化测试临时数据：用于确认 Docker 命名 Volume 重启后仍保留'
);
```

插入后查询结果：

| name | phone | source | status |
| --- | --- | --- | --- |
| `PERSISTENCE_TEST_LOCAL_VOLUME_20260613` | `19999991313` | `persistence_test` | `inactive` |

执行 `docker compose restart postgres` 后：

- healthcheck 从 `starting` 回到 `healthy`。
- 再次查询 `phone='19999991313'`，记录仍存在。
- 结论：Docker 命名 Volume `sunshine-beiya-app_sunshine_beiya_postgres_data` 可以保存 PostgreSQL 数据。

### 修改的文件

- 新增本地 `.env`：由 `.env.example` 复制，已被 `.gitignore` 忽略，不应提交。
- 修改 `database/init/V001__init_core_business_schema.sql`：
  - 修复服务分类/服务项目种子插入顺序问题。
  - 增加部分 seed 数据防重复条件。
- 更新 `docs/PROJECT_LOG.md`：记录本次真实启动、验证、修复和后续迁移建议。

未修改：

- 未修改微信小程序页面。
- 未删除 `Backstage/data.json`。
- 未把后台接口切换到 PostgreSQL。
- 未执行 `git commit`、`git push` 或任何 GitHub 操作。

### 尚未完成事项

- 后台仍然通过 `Backstage/data.json` 读写本地演示数据。
- 微信小程序仍然通过当前后台接口读取演示数据。
- PostgreSQL 已经可用，但还没有接入 `Backstage/server.js`。
- 持久化测试客户仍保留在本地数据库中，后续如需清理可删除 `phone='19999991313'` 的记录。

### 后续迁移建议

1. 保持当前 MVP 后台和小程序流程不变，先把 PostgreSQL 作为可验证的数据底座。
2. 在 `Backstage/` 增加独立数据库访问层，例如 `db.js` 或 `repositories/`，不要直接在路由里散落 SQL。
3. 先迁移只读查询，再迁移写入接口，保持 `/api/miniprogram` 和现有后台 API 响应结构兼容。
4. 将 `Backstage/data.json` 保留为迁移前演示数据备份，迁移完成后再决定是否只读归档。
5. 不把旧 `payStatus` 或任何旧 `payments` 设计作为新功能依赖；当前阶段继续禁止新增线上支付能力。
## 2026-06-14 小程序页面排版集中修复验收记录

### 修改前状态

- 微信小程序部分页面存在排版拥挤、按钮文字垂直不居中、卡片文字被挤压、底部内容靠近 tabBar 等问题。
- 本轮仅处理小程序前端页面排版和交互可用性，不修改后台、PostgreSQL、接口和支付相关逻辑。

### 本轮修改页面

- `frontend/pages/home/`
  - 调整首页客户态 hero 区主按钮布局。
  - 优化身份选择入口为更完整的客户/阿姨身份卡片。
  - 修复“发布需求”“找阿姨”按钮等宽和文字居中问题。
- `frontend/pages/stores/`
  - 将门店卡片从三列挤压布局改为头部、信息、操作按钮的上下结构。
  - 保留搜索、区域筛选、可住宿筛选、导航和电话能力。
- `frontend/pages/service/`
  - 优化客户态阿姨列表卡片，避免头像、姓名、标签、简介和详情按钮互相挤压。
  - 优化阿姨态工作卡片层级，保留申请接单事件。
  - 为页面根内容容器保留底部安全距离，降低 tabBar 遮挡风险。
- `frontend/pages/ayi-detail/`
  - 整理阿姨详情页顶部资料、技能标签、详细信息和底部预约按钮层级。
  - 保留原有阿姨资料字段和预约跳转事件。
- `frontend/pages/mine/`
  - 将“我的”页面整理为身份卡、资料状态、常用功能、接单/预约记录和辅助入口。
  - 修复客户态“发布需求”和阿姨态“去找工作”按钮文字居中问题。

### 保留的业务功能

- 未修改小程序数据字段、接口地址、页面路径和 JS 数据加载逻辑。
- 保留客户/阿姨身份切换。
- 保留门店导航、拨打电话、区域筛选和可住宿筛选。
- 保留服务页搜索、服务类型筛选、阿姨详情跳转和阿姨接单申请。
- 保留阿姨详情页预约面试跳转。
- 保留“我的”页面需求、预约、资料、证件、找工作、接单、联系客服和切换身份入口。

### 静态检查结果

- `git diff --check` 已执行，通过；仅有 Git 在 Windows 下提示 LF/CRLF 换行转换。
- 已静态核对本轮修改页面的 `bindtap` / `catchtap`，对应 JS 处理函数均存在。
- 已静态核对本轮修改页面 WXML 标签配对，检查结果为通过。
- 未发现本轮修改混入后台、数据库、接口、支付逻辑或临时文件。

### 尚需人工确认

- 当前环境未找到可用的微信开发者工具 CLI，无法在本机自动完成小程序编译和真机/模拟器点击验收。
- 仍需在微信开发者工具中人工确认：
  - 首页身份切换、hero 按钮文字居中和页面无横向溢出。
  - 门店页列表、筛选、导航和电话。
  - 服务页客户态/阿姨态列表、详情跳转和接单申请。
  - 阿姨详情页资料展示和预约跳转。
  - “我的”页面客户态/阿姨态入口、记录模块和绿色按钮文字居中。
