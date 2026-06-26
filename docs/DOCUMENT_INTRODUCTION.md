# Document Introduction

本文用于快速了解项目主要目录和文件职责。它不是启动教程，也不替代 API、数据库或测试文档。

## 根目录主要文件

- `README.md`：项目总入口，说明当前定位、启动方式和文档入口。修改它只影响项目说明，属于文档。
- `AGENTS.md`：约束协作、提交、安全和工程规则。修改它会影响后续 agent 工作方式，属于文档和工程规范。
- `.gitignore`：定义不进入 Git 的本地文件、依赖、上传文件和临时文件。修改它会影响提交范围和敏感文件保护，属于工程配置。
- `.env.example`：列出本地运行需要的环境变量示例，不应包含真实密码。修改它会影响新环境配置说明，属于工程配置。
- `docker-compose.yml`：定义本地 PostgreSQL 等容器服务。修改它会影响数据库启动、端口、Volume 和 healthcheck，属于数据库与本地环境。
- `Backstage/`：后台 Node.js 服务和后台网页。修改它通常影响后台管理、API、权限和本地演示数据，属于后台。
- `frontend/`：微信小程序源码。修改它会影响客户端和阿姨端页面、请求逻辑和本地调试配置，属于小程序。
- `database/`：PostgreSQL 初始化和迁移 SQL。修改它会影响数据库结构、种子数据和部署初始化，属于数据库。
- `docs/`：项目文档。修改它只应影响说明、验收记录和路线图，属于文档。

## Backstage 后台与服务端

- `Backstage/README.md`：后台启动、结构和注意事项说明。修改它只影响后台文档，属于文档。
- `Backstage/server.js`：后台 HTTP 服务入口，注册 API、静态文件和主要业务路由。修改它会影响后台接口、小程序接口和图片访问，属于后台。
- `Backstage/db.js`：PostgreSQL 连接池和数据库基础访问配置。修改它会影响所有数据库读写，属于后台和数据库连接层。
- `Backstage/accessControl.js`：后端权限判断和角色访问规则。修改它会影响管理端、运营端、客户和阿姨的接口权限，属于后台安全。
- `Backstage/repositories/`：后台数据访问层，封装资源表、需求匹配和业务查询。修改它会影响数据库读写和 API 返回结果，属于后台。
- `Backstage/scripts/`：本地脚本，例如创建测试账号或迁移辅助。修改它会影响本地初始化和开发运维流程，属于后台工具。
- `Backstage/public/`：后台管理网页的 HTML、CSS 和前端 JS。修改它会影响后台页面、hash 路由、表单和操作交互，属于后台前端。
- `Backstage/public/uploads/`：后台上传图片的运行时目录。只应保留占位文件，实际上传图片不应提交，属于后台运行数据。
- `Backstage/data.json`：旧 MVP 本地演示数据和兜底数据。修改它会影响本地兜底展示，不应替代 PostgreSQL 主数据，属于后台兼容数据。
- `Backstage/package.json` 和 `Backstage/package-lock.json`：后台依赖和脚本定义。修改它们会影响安装、运行和安全审计，属于后台工程配置。

## frontend 微信小程序

- `frontend/README.md`：小程序结构、客户端和阿姨端说明。修改它只影响小程序文档，属于文档。
- `frontend/app.js`：小程序全局数据、后台数据拉取、图片本地转换和公共方法。修改它会影响客户端、阿姨端和所有页面的数据来源，属于小程序公共逻辑。
- `frontend/app.json`：小程序页面注册、tabBar 和全局窗口配置。修改它会影响页面是否可访问和底部导航，属于小程序配置。
- `frontend/app.wxss`：小程序全局样式。修改它可能影响所有页面，属于小程序全局 UI。
- `frontend/project.config.json`：微信开发者工具项目配置。修改它会影响本地调试和工具行为，属于小程序开发配置。
- `frontend/project.private.config.json`：个人本地调试配置，不建议提交。修改它只影响本机微信开发者工具，属于本地配置。
- `frontend/pages/home/`：首页，包含客户端公司展示、快捷入口和服务中心，也包含阿姨端首页结构。修改它会影响首页展示和入口交互，属于客户端和阿姨端。
- `frontend/pages/service/`：服务页，客户态展示阿姨列表，阿姨态展示工作机会。修改它会影响找阿姨、找工作和申请接单入口，属于客户端和阿姨端。
- `frontend/pages/stores/`：门店列表页。修改它会影响门店搜索、筛选、电话、导航和进入详情，属于客户端和阿姨端共用页面。
- `frontend/pages/store-detail/`：门店详情页。修改它会影响门店图片、店长信息、团队信息和推荐阿姨展示，属于客户端和阿姨端共用页面。
- `frontend/pages/demand/`：客户提交需求页。修改它会影响需求表单、提交接口和本地 token 保存，属于客户端。
- `frontend/pages/demand-detail/`：客户需求详情和推荐阿姨确认/拒绝页面。修改它会影响 V3.1 需求匹配闭环，属于客户端。
- `frontend/pages/booking/`：预约面试页面。修改它会影响客户预约阿姨流程，属于客户端。
- `frontend/pages/ayi-detail/`：阿姨详情页。修改它会影响阿姨档案、技能、介绍和预约入口，属于客户端和阿姨端可查看内容。
- `frontend/pages/mine/`：我的页面，按身份展示客户或阿姨入口。修改它会影响个人入口、需求、预约、接单和身份切换，属于客户端和阿姨端。
- `frontend/pages/my-applications/`：阿姨接单申请记录页面。修改它会影响阿姨查看申请状态，属于阿姨端。
- `frontend/data/`：小程序本地兜底数据。修改它会影响后台不可用时的展示，不应放真实敏感数据，属于小程序兜底数据。
- `frontend/assets/`：小程序本地图片和图标资源。修改它会影响页面视觉，不应放真实证件照或敏感图片，属于小程序静态资源。

## database 数据库迁移

- `database/README.md`：数据库启动、迁移和表结构说明。修改它只影响数据库文档，属于文档。
- `database/init/`：PostgreSQL 初始化 SQL 目录。修改它会影响新环境建表、字段、约束和种子数据，属于数据库。
- `database/init/V001__init_core_business_schema.sql`：早期标准化业务表基础结构。当前后台主链路不应混用其中的旧表，属于数据库历史基础。
- `database/init/V002__backstage_resource_tables.sql`：后台实际资源表，包括阿姨、需求、门店、轮播等。修改它会影响后台核心资源，属于数据库。
- `database/init/V003__auth_and_permissions.sql`：统一账号、session 和权限相关结构。修改它会影响登录和鉴权，属于数据库和安全。
- `database/init/V004__store_detail_fields.sql`：门店详情和阿姨门店关联字段。修改它会影响门店详情页和推荐阿姨展示，属于数据库。
- `database/init/V005__demand_matches.sql`：客户需求推荐匹配表和访问 token 字段。修改它会影响 V3.1 需求匹配闭环，属于数据库。
- `database/init/V006__service_center_fields.sql`：服务中心字段扩展。修改它会影响首页服务中心后台配置能力，属于数据库。

## docs 各文档

- `docs/00_DOCUMENTATION_INDEX.md`：文档总目录。修改它会影响读者查找文档的入口，属于文档。
- `docs/DOCUMENT_INTRODUCTION.md`：当前文件，用于快速了解项目主要目录和文件职责。修改它会影响项目结构说明，属于文档。
- `docs/01_CURRENT_PROJECT_STATUS.md`：当前分支、已实现功能、未提交修改和风险。修改它会影响项目状态判断，属于文档。
- `docs/02_SYSTEM_ARCHITECTURE.md`：小程序、后台、数据库、图片和数据流架构。修改它会影响架构理解，属于文档。
- `docs/03_LOCAL_DEVELOPMENT_GUIDE.md`：本地 Docker、后台和微信开发者工具启动说明。修改它会影响开发环境搭建，属于文档。
- `docs/04_ADMIN_BACKEND_GUIDE.md`：后台页面、hash 路由和管理模块说明。修改它会影响后台操作理解，属于文档。
- `docs/05_MINIPROGRAM_GUIDE.md`：客户端和阿姨端小程序说明。修改它会影响小程序功能理解，属于文档。
- `docs/06_API_REFERENCE.md`：当前后台和小程序 API 说明。修改它会影响接口调用参考，属于文档。
- `docs/07_DATABASE_AND_MIGRATIONS.md`：数据库表和 V001 到 V006 迁移说明。修改它会影响数据库维护参考，属于文档。
- `docs/08_AUTH_AND_PERMISSIONS.md`：管理端、运营端和内部角色权限说明。修改它会影响权限理解，属于文档。
- `docs/09_CHANGELOG.md`：V2、V3、V3.1 等开发历史。修改它会影响版本追踪，属于文档。
- `docs/10_ROADMAP.md`：正式微信登录、订单闭环、服务器和智能能力计划。修改它会影响后续规划，属于文档。
- `docs/11_TESTING_CHECKLIST.md`：自动检查和人工验收清单。修改它会影响测试执行参考，属于文档。
- `docs/API_POSTGRES.md`：旧 API 文档兼容入口，当前应指向 `06_API_REFERENCE.md`。修改它会影响旧链接读者，属于文档。
- `docs/AUTH_AND_PERMISSIONS.md`：旧权限文档兼容入口，当前应指向 `08_AUTH_AND_PERMISSIONS.md`。修改它会影响旧链接读者，属于文档。
- `docs/DATA_JSON_MIGRATION.md`：旧 data.json 迁移说明兼容入口。修改它会影响旧迁移说明读者，属于文档。
- `docs/PROJECT_LOG.md`：项目日志兼容入口，当前应指向 `09_CHANGELOG.md`。修改它会影响历史记录入口，属于文档。

## 常见功能对应需要修改的文件

- 修改后台 API：通常涉及 `Backstage/server.js`、`Backstage/repositories/`、必要时更新 `docs/06_API_REFERENCE.md`。影响后台和小程序接口。
- 修改后台页面：通常涉及 `Backstage/public/app.js`、`Backstage/public/index.html`、`Backstage/public/styles.css`。影响管理端和运营端页面。
- 修改登录和权限：通常涉及 `Backstage/accessControl.js`、认证相关 repository、`database/init/V003__auth_and_permissions.sql` 和 `docs/08_AUTH_AND_PERMISSIONS.md`。影响后台安全和角色访问。
- 修改客户需求匹配：通常涉及 `Backstage/repositories/demandMatchRepository.js`、`Backstage/server.js`、`frontend/pages/demand-detail/`、`database/init/V005__demand_matches.sql`。影响 V3.1 客户需求推荐闭环。
- 修改门店列表或详情：通常涉及 `frontend/pages/stores/`、`frontend/pages/store-detail/`、`Backstage/public/app.js` 和门店 repository。影响客户端和阿姨端共用门店体验。
- 修改首页公司展示或服务中心：通常涉及 `frontend/pages/home/`、`frontend/app.js`、后台 `banners` 或 `serviceModules` 数据。影响客户端首页，阿姨端需单独确认是否受影响。
- 修改图片上传和显示：通常涉及 `Backstage/server.js`、`Backstage/public/uploads/`、`frontend/app.js` 和具体页面 WXML。影响后台上传、小程序本地 HTTP 图片兼容和正式 HTTPS 图片显示。
- 修改数据库结构：只新增新的 `database/init/Vxxx__*.sql`，不要修改已执行迁移。影响新环境初始化和升级路径。
- 修改文档：通常只改 `README.md` 或 `docs/`。影响说明和验收记录，不应改变业务行为。
