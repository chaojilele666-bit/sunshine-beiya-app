# Database README

本文档说明当前 V3 分支的 PostgreSQL 数据库结构、迁移历史、业务表关系、审计日志和常用只读 SQL。内容基于以下真实来源核对：

- `database/init/V001__init_core_business_schema.sql` 至 `V009__demand_assignment_followups.sql`
- `Backstage/server.js`
- `Backstage/repositories/`
- `Backstage/data.json`
- 当前本地 PostgreSQL `sunshine_beiya` 的 `public` schema

注意：`Backstage/data.json` 只是本地兜底数据，不是生产数据库。PostgreSQL 正常可用时，后台和小程序接口以 PostgreSQL 为准。

## 1. 数据库概览

当前数据库容器：

```text
container: sunshine-beiya-postgres
database: sunshine_beiya
default user: sunshine_app
```

当前 `public` schema 中存在以下表：

```text
applications
appointments
audit_logs
auth_sessions
ayis
ayi_status_history
ayi_service_preferences
ayi_service_types
ayi_service_regions
ayi_availability
backstage_accounts
banners
company_info
company_profile
complaints
customer_communications
customers
demand_matches
demand_follow_ups
demands
follow_ups
housekeepers
manual_dispatches
order_dispatches
order_status_history
orders
reviews
service_addresses
service_categories
service_items
service_modules
service_orders
stores
user_accounts
```

V3 当前实际业务主链路主要使用：

```text
user_accounts
auth_sessions
backstage_accounts
ayis
demands
demand_matches
demand_follow_ups
appointments
applications
orders
order_dispatches
stores
service_modules
banners
company_profile
audit_logs
```

V001 中的 `customers`、`housekeepers`、`service_orders`、`manual_dispatches` 等是标准化业务模型的规划表，当前 V3 小程序和后台主流程没有完全切换到这些表，不要和 V002 资源表混用。

## 2. 迁移说明

### V001__init_core_business_schema.sql

建立标准化核心业务模型：

- `customers`
- `housekeepers`
- `service_categories`
- `service_items`
- `service_addresses`
- `service_orders`
- `manual_dispatches`
- `order_status_history`
- `customer_communications`
- `reviews`
- `complaints`
- `follow_ups`
- `audit_logs`

同时建立基础索引和演示种子数据。该迁移代表更标准化的长期业务模型，但当前 V3 主要业务仍使用 V002 资源表。

### V002__backstage_resource_tables.sql

建立后台实际 CRUD 资源表：

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

同时为 `audit_logs` 增加兼容字段：

- `actor_role`
- `resource_type`
- `resource_id_text`
- `before_summary`
- `after_summary`

当前后台通用 CRUD 主要通过 `Backstage/repositories/resourceRepository.js` 操作这些表。

### V003__auth_and_permissions.sql

增加真实登录和后端权限相关表：

- `user_accounts`
- `auth_sessions`

关键规则：

- `user_accounts.password_hash` 保存密码哈希，不保存明文密码。
- `auth_sessions.token_hash` 保存 session token 的哈希，不保存原始 token。
- `role` 约束为 `customer`、`ayi`、`operator`、`boss`。
- `status` 约束为 `active`、`disabled`、`locked`。
- 预留微信登录字段 `wechat_openid`、`wechat_unionid`。

### V004__store_detail_fields.sql

扩展门店详情和阿姨门店关联：

- `stores` 增加门店介绍、营业时间、店长、团队规模、经纬度等字段。
- `ayis` 增加 `store_id`、`featured`、`featured_title`。
- `ayis.store_id` 外键关联 `stores(id)`，删除门店时置空。

重要修复规则：

- V004 不依赖固定 `store_id = 1`。
- 阿姨关联门店通过稳定门店信息查找实际 ID。
- 找不到门店时允许 `store_id = NULL`。
- 不关闭外键约束。
- 不重复插入演示门店。

### V005__demand_matches.sql

增加客户需求匹配闭环：

- `demands.customer_access_token_hash`
- `demand_matches`

关键规则：

- 小程序客户提交需求时返回明文 access token，数据库只保存 SHA-256 hash。
- 后续查看需求、查看推荐、确认或拒绝必须携带 token。
- `demand_matches` 关联 `demands` 和 `ayis`。
- 同一 `demand_id + ayi_id` 唯一。
- 匹配状态限制为 `已推荐`、`客户已确认`、`客户已拒绝`、`已失效`。

### V006__service_center_fields.sql

扩展 `service_modules` 为服务中心配置：

- `module_type`
- `icon_text`
- `icon_image`
- `theme`
- `target_type`
- `target_value`

V006 初始约束允许：

```text
highlight
service
```

用途：

- `highlight`：服务说明，例如服务覆盖、专业匹配。
- `service`：具体家政服务入口，例如育儿嫂、月嫂、住家保姆。

### V007__company_profile.sql

增加单条公司基础配置：

- `company_profile`

字段包括：

- 公司名称
- 公司简称
- 公司简介
- 客服电话
- 公司地址
- 营业时间

规则：

- `id` 固定为 `1`。
- `company_profile_single_row CHECK (id = 1)` 保证单条配置。
- 后台“公司基础信息”模块编辑该表。
- 小程序首页、我的页面、公司介绍页统一读取该配置。

### V008__service_shortcuts.sql

扩展 `service_modules.module_type` 约束，允许：

```text
highlight
service
shortcut
```

并增加首页快捷入口默认数据：

- 找阿姨
- 发布需求
- 客服咨询
- 公司介绍

`shortcut` 继续复用 `service_modules` 的字段：

- `title`
- `summary`
- `icon_text`
- `icon_image`
- `theme`
- `target_type`
- `target_value`
- `sort`
- `visible`

### V009__demand_assignment_followups.sql

??????????????????????

- `demands.assigned_operator_id`????????? `user_accounts.id`?
- `demands.assigned_at`??????
- `demands.assigned_by`????????? `user_accounts.id`?
- `demands.last_followed_up_at`????????
- `demands.next_follow_up_at`????????
- `demand_follow_ups`???????????

????????

- ?????????????? `boss` ? `operator` ???
- ??????? `phone`?`wechat`?`visit`?`other`?
- ????????????????????? `operator_id`?
- ?????????????? `audit_logs`?
- ???? `demand_id`?`operator_id`?`assigned_operator_id`?`next_follow_up_at`?`created_at` ??????

### V010__ayi_availability_preferences.sql

????????????????????????????

- `ayi_availability`?????????????????
- `ayi_service_regions`?????????????????
- `ayi_service_types`????????????? `service_modules` ? `module_type = service` ????
- `ayi_service_preferences`?????????????????????
- `ayi_status_history`????????????????

??????????????????

```text
available   ???
working     ???
leave       ???
resting     ????
unreachable ??????
```

??????????????????`visible=true`?`service_status=available`????????????????`visible=false` ????????????????????????


## 3. 数据表关系

当前 V3 主链路关系：

```text
user_accounts 1--N auth_sessions

stores 1--N ayis

demands 1--N demand_matches
ayis    1--N demand_matches

demands 1--N demand_follow_ups
user_accounts 1--N demand_follow_ups
user_accounts 1--N demands.assigned_operator_id

demands 1--N applications
orders  1--N order_dispatches

service_modules 独立配置服务中心和快捷入口
banners 独立配置首页轮播
company_profile 单条公司基础信息

audit_logs 记录后台、认证、需求匹配、导出等关键操作
```

V001 标准化模型关系：

```text
customers 1--N service_addresses
customers 1--N service_orders
service_categories 1--N service_items
service_items 1--N service_orders
service_orders 1--N manual_dispatches
housekeepers 1--N manual_dispatches
service_orders 1--N order_status_history
service_orders 1--N follow_ups
service_orders 1--1 reviews
service_orders 1--N complaints
```

这些 V001 表目前不是 V3 小程序主链路，不要把它们当作当前后台 CRUD 的直接数据源。

## 4. 每张表详细说明

字段格式说明：

```text
字段名: 类型, NULL/NOT NULL, 默认值
```

### applications

中文名称：接单申请。

用途：阿姨对客户需求发起接单申请，后台“接单申请”模块维护。

页面/API：

- 后台：接单申请
- 小程序：阿姨端接单申请、我的申请
- API：`/api/applications`

字段：

- `id`: integer, NOT NULL
- `ayi_name`: varchar, NOT NULL
- `ayi_phone`: varchar, NULL
- `demand_id`: integer, NULL
- `service_type`: varchar, NULL
- `customer_address`: text, NULL
- `start_time`: varchar, NULL
- `budget`: varchar, NULL
- `consultant`: varchar, NULL
- `status`: varchar, NOT NULL, 默认 `'已申请'`
- `note`: text, NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`applications_pkey(id)`
- 外键：`applications.demand_id -> demands.id`
- 索引：`idx_applications_status(status)`

状态值：后台表单当前使用 `已申请`、`已联系`、`已推荐`、`已拒绝`、`已成交`。

新增、修改、删除：后台通用 CRUD；写入 `audit_logs`。

敏感字段：手机号属于个人信息，导出和展示时应谨慎。

### appointments

中文名称：预约面试。

用途：客户预约阿姨面试，后台跟进预约状态。

页面/API：

- 后台：预约面试
- 小程序：预约相关页面
- API：`/api/appointments`

字段：

- `id`: integer, NOT NULL
- `customer_name`: varchar, NOT NULL
- `phone`: varchar, NULL
- `ayi_name`: varchar, NULL
- `service_type`: varchar, NULL
- `date`: varchar, NULL
- `address`: text, NULL
- `consultant`: varchar, NULL
- `status`: varchar, NOT NULL, 默认 `'待联系'`
- `note`: text, NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`appointments_pkey(id)`
- 索引：`idx_appointments_status(status)`

状态值：后台表单当前使用 `待联系`、`已确认`、`已面试`、`已取消`、`已成交`。

新增、修改、删除：后台通用 CRUD；写入 `audit_logs`。

敏感字段：客户手机号、地址。

### ayi_availability

????????????????

?????????????????????????????????????????????????????????????????????????

?????`service_status` ??? `available`?`working`?`leave`?`resting`?`unreachable`???????????????? 7 ?????????????????????

### ayi_service_regions

?????????????

??????????????????????????????????????????????????

### ayi_service_types

???????????????

???????? `service_modules` ????????????????????????????????????

### ayi_service_preferences

????????????

????????????????????????????????/?????????????????????????????????????

### ayi_status_history

????????????????

??????????????????????????????????????????? `audit_logs`?


### audit_logs

中文名称：操作日志 / 审计日志。

用途：记录谁在什么时间做了什么，以及修改前后内容。后台“操作记录”模块只读查看和导出。

页面/API：

- 后台：操作记录，仅管理端 `boss`
- API：`/api/auditLogs`
- 导出：`/api/auditLogs/export`

字段：

- `id`: uuid, NOT NULL, 默认 `gen_random_uuid()`
- `actor`: varchar, NOT NULL
- `action`: varchar, NOT NULL
- `entity_type`: varchar, NOT NULL
- `entity_id`: uuid, NULL
- `before_data`: jsonb, NULL
- `after_data`: jsonb, NULL
- `ip_address`: inet, NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `actor_role`: varchar, NULL
- `resource_type`: varchar, NULL
- `resource_id_text`: text, NULL
- `before_summary`: text, NULL
- `after_summary`: text, NULL

约束和索引：

- 主键：`audit_logs_pkey(id)`
- 索引：`idx_audit_logs_entity(entity_type, entity_id)`
- 索引：`idx_audit_logs_created_at(created_at)`

常见 `action`：

- `create`
- `update`
- `delete`
- `dispatch`
- `recommend`
- `expire`
- `customer_confirm`
- `customer_reject`
- `login`
- `logout`
- `export`

规则：

- 日志只读。
- 不提供修改、删除、清空接口。
- 最高权限管理端可查看和导出。
- 导出当前筛选条件下最多 10000 条。
- 页面和导出递归隐藏敏感字段。

敏感字段脱敏：

```text
password
password_hash
token
access_token
refresh_token
session
session_key
openid
secret
appsecret
private_key
authorization
cookie
customer_access_token_hash
```

统一显示为：

```text
[已隐藏]
```

### auth_sessions

中文名称：后台登录会话。

用途：保存后台和测试账号登录 session。它不是微信 `openid/session` 登录。

页面/API：

- API：`/api/auth/login`
- API：`/api/auth/logout`
- API：`/api/auth/me`

字段：

- `id`: uuid, NOT NULL, 默认 `gen_random_uuid()`
- `user_account_id`: integer, NOT NULL
- `token_hash`: varchar, NOT NULL
- `user_agent`: text, NULL
- `ip_address`: inet, NULL
- `expires_at`: timestamptz, NOT NULL
- `revoked_at`: timestamptz, NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`auth_sessions_pkey(id)`
- 外键：`auth_sessions.user_account_id -> user_accounts.id`
- 唯一：`auth_sessions_token_hash_unique(token_hash)`
- 索引：`idx_auth_sessions_user_account_id(user_account_id)`
- 索引：`idx_auth_sessions_expires_at(expires_at)`

安全规则：

- 只保存 token hash。
- 原始 token 只返回给登录方，不写入数据库。
- 过期或 `revoked_at` 不为空的 session 不能继续使用。

敏感字段：`token_hash`。

### ayis

中文名称：阿姨资料。

用途：保存阿姨公开资料、审核状态、证件图片、门店关联、是否推荐、是否上架。

页面/API：

- 后台：阿姨管理
- 小程序：服务页阿姨列表、阿姨详情、阿姨资料页
- API：`/api/ayis`
- 小程序公开数据：`/api/miniprogram`

字段：

- `id`: integer, NOT NULL
- `image`: text, NULL
- `name`: varchar, NOT NULL
- `phone`: varchar, NOT NULL
- `source`: varchar, NOT NULL, 默认 `'后台录入'`
- `age`: integer, NULL
- `hometown`: varchar, NULL
- `service_type`: varchar, NULL
- `experience`: integer, NOT NULL, 默认 `0`
- `live_type`: varchar, NULL
- `salary`: varchar, NULL
- `available_time`: varchar, NULL
- `skills`: text[], NOT NULL, 默认 `ARRAY[]::text[]`
- `status`: varchar, NOT NULL, 默认 `'待审核'`
- `id_card_image`: text, NULL
- `health_cert_image`: text, NULL
- `skill_cert_image`: text, NULL
- `intro`: text, NULL
- `visible`: boolean, NOT NULL, 默认 `true`
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`
- `store_id`: integer, NULL
- `featured`: boolean, NOT NULL, 默认 `false`
- `featured_title`: varchar, NULL

约束和索引：

- 主键：`ayis_pkey(id)`
- 唯一：`ayis_phone_unique(phone)`
- 外键：`ayis.store_id -> stores.id ON DELETE SET NULL`
- 索引：`idx_ayis_status(status)`
- 索引：`idx_ayis_service_type(service_type)`
- 索引：`idx_ayis_store_id(store_id)`
- 索引：`idx_ayis_featured(featured)`

认证状态：

- `待审核`
- `已认证`
- 兼容代码中也识别 `approved`

上下架规则：

- `visible=true`：可公开展示。
- `visible=false`：下架，不是删除。
- 下架阿姨不出现在 `/api/miniprogram` 的公开阿姨列表。
- 下架阿姨不能被新增推荐。
- 历史需求、历史匹配、历史申请不删除。

后台分类规则：

- 已认证：`status IN ('已认证', 'approved')` 且 `visible=true`
- 待审核：未认证且 `visible=true`
- 已下架：只要 `visible=false`，优先进入已下架

新增、修改、删除：

- 后台通用 CRUD。
- 新增、修改、删除写入 `audit_logs`。
- 下架通过更新 `visible=false`，不是删除。

敏感字段：

- `phone`
- `id_card_image`
- `health_cert_image`
- `skill_cert_image`

### backstage_accounts

中文名称：后台账号资料。

用途：后台账号显示和分组资料，和 `user_accounts` 的真实登录账号关联使用。

页面/API：

- 后台：账号权限，仅管理端
- API：`/api/accounts`

字段：

- `id`: integer, NOT NULL
- `name`: varchar, NOT NULL
- `phone`: varchar, NULL
- `role`: varchar, NOT NULL
- `entry`: varchar, NOT NULL, 默认 `'后台管理'`
- `permissions`: text[], NOT NULL, 默认 `ARRAY[]::text[]`
- `status`: varchar, NOT NULL, 默认 `'启用'`
- `note`: text, NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`backstage_accounts_pkey(id)`
- 索引：`idx_backstage_accounts_role(role)`

规则：

- 管理端可管理后台账号和角色。
- 运营端不能管理管理端账号。
- 至少保留一个管理端账号。
- 写入 `audit_logs`。

敏感字段：手机号。

### banners

中文名称：首页轮播。

用途：小程序客户端首页公司展示轮播。

页面/API：

- 后台：首页轮播
- 小程序：首页公司展示
- API：`/api/banners`
- 小程序公开数据：`/api/miniprogram`

字段：

- `id`: integer, NOT NULL
- `title`: varchar, NOT NULL
- `subtitle`: text, NULL
- `image`: text, NULL
- `target_type`: varchar, NULL
- `sort`: integer, NOT NULL, 默认 `0`
- `visible`: boolean, NOT NULL, 默认 `true`
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`banners_pkey(id)`
- 索引：`idx_banners_visible_sort(visible, sort)`

规则：

- `visible=false` 不进入小程序轮播。
- 小程序只展示有图片且可见的轮播。
- 修改写入 `audit_logs`。

敏感字段：无。

### company_info

中文名称：旧公司信息。

用途：V002 初始公司信息表。当前 V3 公司基础信息主用 `company_profile`。

字段：

- `id`: integer, NOT NULL
- `company_name`: varchar, NOT NULL
- `introduction`: text, NULL
- `phone`: varchar, NULL
- `business_hours`: varchar, NULL
- `visible`: boolean, NOT NULL, 默认 `true`
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`company_info_pkey(id)`

规则：保留兼容，不作为当前 V3 公司基础配置主表。

### company_profile

中文名称：公司基础信息。

用途：统一维护小程序展示的公司名称、简称、简介、客服、地址和营业时间。

页面/API：

- 后台：公司基础信息，仅管理端
- 小程序：首页、我的页面、公司介绍页
- API：`/api/company-profile`
- 小程序公开数据：`/api/miniprogram.companyProfile`

字段：

- `id`: smallint, NOT NULL, 默认 `1`
- `company_name`: varchar, NOT NULL, 默认 `'北京阳光北亚家政'`
- `short_name`: varchar, NOT NULL, 默认 `'阳光北亚'`
- `introduction`: text, NOT NULL
- `customer_service_phone`: varchar, NOT NULL
- `address`: text, NOT NULL
- `business_hours`: varchar, NOT NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`company_profile_pkey(id)`
- 单行约束：`company_profile_single_row CHECK (id = 1)`

规则：

- 只能有一条有效配置。
- 管理端可编辑。
- 运营端无权访问。
- 修改写入 `audit_logs`。

敏感字段：客服电话和地址是公开配置字段，不属于密钥，但应由后台维护。

### complaints

中文名称：投诉。

用途：V001 标准化服务订单模型中的投诉表。当前 V3 主流程未完全接入。

字段：

- `id`: uuid, NOT NULL, 默认 `gen_random_uuid()`
- `service_order_id`: uuid, NULL
- `customer_id`: uuid, NOT NULL
- `housekeeper_id`: uuid, NULL
- `complaint_type`: varchar, NOT NULL
- `content`: text, NOT NULL
- `status`: varchar, NOT NULL, 默认 `'open'`
- `handled_by`: varchar, NULL
- `resolution`: text, NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`complaints_pkey(id)`
- 外键：`service_order_id -> service_orders.id`
- 外键：`customer_id -> customers.id`
- 外键：`housekeeper_id -> housekeepers.id`
- 状态约束：`open`、`investigating`、`resolved`、`closed`
- 索引：`idx_complaints_status(status)`

规则：V001 规划表，当前后台无主流程管理页面。

敏感字段：投诉内容、客户 ID。

### customer_communications

中文名称：客户沟通记录。

用途：V001 标准化客户沟通记录。当前 V3 主流程未完全接入。

字段：

- `id`: uuid, NOT NULL, 默认 `gen_random_uuid()`
- `customer_id`: uuid, NOT NULL
- `service_order_id`: uuid, NULL
- `channel`: varchar, NOT NULL
- `direction`: varchar, NOT NULL
- `content`: text, NOT NULL
- `handled_by`: varchar, NOT NULL
- `communicated_at`: timestamptz, NOT NULL, 默认 `now()`
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`customer_communications_pkey(id)`
- 外键：`customer_id -> customers.id`
- 外键：`service_order_id -> service_orders.id`
- `channel` 约束：`phone`、`wechat`、`sms`、`offline`、`system`
- `direction` 约束：`inbound`、`outbound`
- 索引：`idx_customer_communications_customer_id(customer_id)`
- 索引：`idx_customer_communications_order_id(service_order_id)`

规则：V001 规划表，当前后台无主流程管理页面。

敏感字段：沟通内容。

### customers

中文名称：客户标准档案。

用途：V001 标准化客户表；V3.1 小程序需求查看使用 `demands.customer_access_token_hash`，未完全切换到该客户表。

字段：

- `id`: uuid, NOT NULL, 默认 `gen_random_uuid()`
- `name`: varchar, NOT NULL
- `phone`: varchar, NOT NULL
- `wechat_openid`: varchar, NULL
- `source`: varchar, NOT NULL, 默认 `'manual'`
- `status`: varchar, NOT NULL, 默认 `'active'`
- `notes`: text, NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`customers_pkey(id)`
- 唯一：`customers_phone_unique(phone)`
- 状态约束：`active`、`inactive`、`blocked`
- 电话格式检查：`customers_phone_check`

敏感字段：手机号、微信 openid。

### demand_matches

中文名称：需求推荐匹配。

用途：后台给客户需求推荐阿姨，客户确认或拒绝推荐。

页面/API：

- 后台：客户需求详情里的推荐阿姨
- 小程序：需求详情推荐列表、确认、拒绝
- API：`/api/demands/:id/matches`
- API：`/api/miniprogram/demands/:id/matches`
- API：`/api/miniprogram/demand-matches/:id/decision`

字段：

- `id`: integer, NOT NULL
- `demand_id`: integer, NOT NULL
- `ayi_id`: integer, NOT NULL
- `status`: varchar, NOT NULL, 默认 `'已推荐'`
- `recommend_note`: text, NULL
- `recommended_by`: varchar, NULL
- `customer_decision_at`: timestamptz, NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`demand_matches_pkey(id)`
- 外键：`demand_id -> demands.id ON DELETE CASCADE`
- 外键：`ayi_id -> ayis.id ON DELETE RESTRICT`
- 唯一：`demand_matches_demand_ayi_unique(demand_id, ayi_id)`
- 状态约束：`已推荐`、`客户已确认`、`客户已拒绝`、`已失效`
- 索引：`idx_demand_matches_demand_id(demand_id)`
- 索引：`idx_demand_matches_ayi_id(ayi_id)`
- 索引：`idx_demand_matches_status(status)`

业务规则：

- 后台只能推荐已认证且 `visible IS NOT FALSE` 的阿姨。
- 同一需求不能重复推荐同一阿姨，重复返回 409。
- 客户确认后状态为 `客户已确认`，并将需求状态更新为 `已匹配`。
- 客户拒绝后状态为 `客户已拒绝`，不自动关闭需求。
- 已确认的匹配不能标记失效。
- 跨需求操作会被拒绝。
- 历史匹配不删除。
- 推荐、确认、拒绝、失效均写入 `audit_logs`。

敏感字段：推荐说明可能包含业务沟通内容。

### demands

中文名称：客户需求。

用途：客户发布家政需求，后台跟进联系、匹配阿姨。

页面/API：

- 后台：客户需求
- 小程序：发布需求、需求详情、我的需求
- API：`/api/demands`
- 小程序专用：`/api/miniprogram/demands`

字段：

- `id`: integer, NOT NULL
- `customer_name`: varchar, NOT NULL
- `phone`: varchar, NOT NULL
- `source`: varchar, NOT NULL, 默认 `'后台录入'`
- `service_type`: varchar, NULL
- `city`: varchar, NULL
- `address`: text, NULL
- `start_time`: varchar, NULL
- `budget`: varchar, NULL
- `family_info`: text, NULL
- `consultant`: varchar, NULL
- `follow_note`: text, NULL
- `status`: varchar, NOT NULL, 默认 `'待跟进'`
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`
- `customer_access_token_hash`: text, NULL

约束和索引：

- 主键：`demands_pkey(id)`
- 索引：`idx_demands_status(status)`
- 索引：`idx_demands_service_type(service_type)`

状态值：

当前 V3.1 统一状态：

- `待处理`
- `已联系`
- `匹配中`
- `已匹配`
- `已关闭`

兼容状态映射：

- `待跟进` -> `待处理`
- `顾问待联系` -> `待处理`
- `待匹配` -> `匹配中`
- `已推荐` -> `匹配中`
- `已面试` -> `已匹配`
- `已成交` -> `已匹配`
- `已取消` -> `已关闭`

访问 token 规则：

- 小程序提交需求时生成随机 access token。
- 数据库只保存 `customer_access_token_hash`。
- 后续查看详情、推荐列表、确认、拒绝必须通过请求头 `X-Demand-Access-Token` 传递原始 token。
- 不在 URL 查询参数和日志中输出完整 token。

新增、修改、删除：

- 后台通用 CRUD 写 `audit_logs`。
- 小程序提交需求写 `demands` 和 `audit_logs`。

敏感字段：

- `phone`
- `address`
- `family_info`
- `customer_access_token_hash`

### follow_ups

中文名称：跟进记录。

用途：V001 标准化服务订单跟进。当前 V3 主流程未完全接入。

字段：

- `id`: uuid, NOT NULL, 默认 `gen_random_uuid()`
- `service_order_id`: uuid, NOT NULL
- `customer_id`: uuid, NOT NULL
- `follow_up_type`: varchar, NOT NULL
- `result`: varchar, NOT NULL, 默认 `'pending'`
- `content`: text, NULL
- `next_follow_up_at`: timestamptz, NULL
- `handled_by`: varchar, NOT NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`follow_ups_pkey(id)`
- 外键：`service_order_id -> service_orders.id`
- 外键：`customer_id -> customers.id`
- `follow_up_type`：`pre_service`、`in_service`、`post_service`、`complaint`
- `result`：`pending`、`completed`、`needs_action`
- 索引：`idx_follow_ups_order_id(service_order_id)`

敏感字段：跟进内容。

### housekeepers

中文名称：标准化阿姨 / 家政员档案。

用途：V001 标准化阿姨表；V3 当前主流程使用 `ayis`。

字段：

- `id`: uuid, NOT NULL, 默认 `gen_random_uuid()`
- `name`: varchar, NOT NULL
- `phone`: varchar, NOT NULL
- `gender`: varchar, NOT NULL, 默认 `'female'`
- `birth_year`: integer, NULL
- `hometown`: varchar, NULL
- `experience_years`: integer, NOT NULL, 默认 `0`
- `live_in_available`: boolean, NOT NULL, 默认 `false`
- `status`: varchar, NOT NULL, 默认 `'pending_review'`
- `bio`: text, NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`housekeepers_pkey(id)`
- 唯一：`housekeepers_phone_unique(phone)`
- 状态：`pending_review`、`approved`、`suspended`、`inactive`
- 索引：`idx_housekeepers_status(status)`

敏感字段：手机号。

### manual_dispatches

中文名称：标准化人工派单。

用途：V001 标准化派单表；V3 当前主流程使用 `order_dispatches`。

字段：

- `id`: uuid, NOT NULL, 默认 `gen_random_uuid()`
- `service_order_id`: uuid, NOT NULL
- `housekeeper_id`: uuid, NOT NULL
- `dispatch_status`: varchar, NOT NULL, 默认 `'proposed'`
- `assigned_by`: varchar, NOT NULL
- `assigned_at`: timestamptz, NOT NULL, 默认 `now()`
- `notes`: text, NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`manual_dispatches_pkey(id)`
- 外键：`service_order_id -> service_orders.id`
- 外键：`housekeeper_id -> housekeepers.id`
- 唯一：`manual_dispatches_order_housekeeper_unique(service_order_id, housekeeper_id)`
- 状态：`proposed`、`accepted`、`rejected`、`cancelled`
- 索引：`idx_manual_dispatches_order_id(service_order_id)`
- 索引：`idx_manual_dispatches_housekeeper_id(housekeeper_id)`

敏感字段：备注可能包含业务信息。

### order_dispatches

中文名称：人工派单。

用途：V3 后台人工派单记录。

页面/API：

- 后台：人工派单
- API：`/api/orderDispatches`

字段：

- `id`: integer, NOT NULL
- `order_id`: integer, NULL
- `order_no`: varchar, NULL
- `ayi_name`: varchar, NOT NULL
- `ayi_phone`: varchar, NULL
- `dispatch_type`: varchar, NOT NULL, 默认 `'人工派单'`
- `status`: varchar, NOT NULL, 默认 `'已派单'`
- `assigned_by`: varchar, NULL
- `note`: text, NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`order_dispatches_pkey(id)`
- 外键：`order_id -> orders.id`
- 索引：`idx_order_dispatches_order_id(order_id)`

状态值：后台表单当前使用 `已派单`、`已接单`、`已拒绝`、`已取消`。

规则：

- 新增派单写入 `order_dispatches`。
- 派单操作写入 `audit_logs`，`action=dispatch`。

敏感字段：阿姨手机号。

### order_status_history

中文名称：标准化订单状态历史。

用途：V001 标准化服务订单状态历史。当前 V3 主流程未完全接入。

字段：

- `id`: uuid, NOT NULL, 默认 `gen_random_uuid()`
- `service_order_id`: uuid, NOT NULL
- `from_status`: varchar, NULL
- `to_status`: varchar, NOT NULL
- `changed_by`: varchar, NOT NULL
- `change_reason`: text, NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`order_status_history_pkey(id)`
- 外键：`service_order_id -> service_orders.id`
- `to_status` 与 `service_orders.status` 枚举一致。
- 索引：`idx_order_status_history_order_id(service_order_id)`

敏感字段：变更原因可能包含业务信息。

### orders

中文名称：订单跟进。

用途：后台维护订单号、客户、阿姨、价格、合同、付款展示字段和服务状态。

页面/API：

- 后台：订单跟进
- API：`/api/orders`

字段：

- `id`: integer, NOT NULL
- `order_no`: varchar, NOT NULL
- `customer_name`: varchar, NOT NULL
- `customer_phone`: varchar, NULL
- `ayi_name`: varchar, NULL
- `ayi_phone`: varchar, NULL
- `service_type`: varchar, NULL
- `address`: text, NULL
- `start_time`: varchar, NULL
- `price`: varchar, NULL
- `consultant`: varchar, NULL
- `contract_status`: varchar, NULL
- `pay_status`: varchar, NULL
- `status`: varchar, NOT NULL, 默认 `'待上户'`
- `note`: text, NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`orders_pkey(id)`
- 唯一：`orders_order_no_unique(order_no)`
- 索引：`idx_orders_status(status)`

状态值：

- 服务状态：`待上户`、`服务中`、`已完成`、`已取消`
- 合同状态：后台表单使用 `未签约`、`已签约`、`已作废`
- `pay_status` 是历史展示字段，不代表当前项目已接入线上支付。

新增、修改、删除：后台通用 CRUD；写入 `audit_logs`。

敏感字段：客户和阿姨手机号、地址。

### reviews

中文名称：评价。

用途：V001 标准化订单评价。当前 V3 主流程未完全接入。

字段：

- `id`: uuid, NOT NULL, 默认 `gen_random_uuid()`
- `service_order_id`: uuid, NOT NULL
- `customer_id`: uuid, NOT NULL
- `housekeeper_id`: uuid, NULL
- `rating`: integer, NOT NULL
- `content`: text, NULL
- `status`: varchar, NOT NULL, 默认 `'visible'`
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`reviews_pkey(id)`
- 唯一：`reviews_order_unique(service_order_id)`
- 外键：`service_order_id -> service_orders.id`
- 外键：`customer_id -> customers.id`
- 外键：`housekeeper_id -> housekeepers.id`
- `rating` 约束：1 到 5
- `status`：`visible`、`hidden`、`pending_review`
- 索引：`idx_reviews_housekeeper_id(housekeeper_id)`

敏感字段：评价内容可能包含个人信息。

### service_addresses

中文名称：服务地址。

用途：V001 标准化客户服务地址。当前 V3 主流程未完全接入。

字段：

- `id`: uuid, NOT NULL, 默认 `gen_random_uuid()`
- `customer_id`: uuid, NOT NULL
- `contact_name`: varchar, NOT NULL
- `contact_phone`: varchar, NOT NULL
- `province`: varchar, NOT NULL, 默认 `'北京'`
- `city`: varchar, NOT NULL, 默认 `'北京'`
- `district`: varchar, NULL
- `detail_address`: varchar, NOT NULL
- `is_default`: boolean, NOT NULL, 默认 `false`
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`service_addresses_pkey(id)`
- 外键：`customer_id -> customers.id`
- 电话格式检查：`service_addresses_contact_phone_check`
- 索引：`idx_service_addresses_customer_id(customer_id)`

敏感字段：联系人、电话、详细地址。

### service_categories

中文名称：标准化服务分类。

用途：V001 标准化服务目录。当前小程序首页服务中心使用 `service_modules`，不是该表。

字段：

- `id`: uuid, NOT NULL, 默认 `gen_random_uuid()`
- `code`: varchar, NOT NULL
- `name`: varchar, NOT NULL
- `description`: text, NULL
- `sort_order`: integer, NOT NULL, 默认 `0`
- `is_active`: boolean, NOT NULL, 默认 `true`
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`service_categories_pkey(id)`
- 唯一：`service_categories_code_unique(code)`
- 唯一：`service_categories_name_unique(name)`

敏感字段：无。

### service_items

中文名称：标准化服务项目。

用途：V001 标准化服务项目。当前小程序首页服务中心使用 `service_modules`。

字段：

- `id`: uuid, NOT NULL, 默认 `gen_random_uuid()`
- `category_id`: uuid, NOT NULL
- `code`: varchar, NOT NULL
- `name`: varchar, NOT NULL
- `unit`: varchar, NOT NULL, 默认 `'month'`
- `base_price_min`: numeric, NULL
- `base_price_max`: numeric, NULL
- `is_active`: boolean, NOT NULL, 默认 `true`
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`service_items_pkey(id)`
- 外键：`category_id -> service_categories.id`
- 唯一：`service_items_code_unique(code)`
- 唯一：`service_items_category_name_unique(category_id, name)`
- `unit`：`hour`、`day`、`month`、`case`
- 价格范围检查：`service_items_price_check`
- 索引：`idx_service_items_category_id(category_id)`

敏感字段：无。

### service_modules

中文名称：服务中心 / 首页快捷入口配置。

用途：后台维护小程序客户端首页服务中心、服务说明和快捷入口。

页面/API：

- 后台：服务中心
- 小程序：首页服务中心、快捷入口、服务类型选项
- API：`/api/serviceModules`
- 小程序公开数据：`/api/miniprogram.serviceModules`

字段：

- `id`: integer, NOT NULL
- `title`: varchar, NOT NULL
- `summary`: text, NULL
- `image`: text, NULL
- `sort`: integer, NOT NULL, 默认 `0`
- `visible`: boolean, NOT NULL, 默认 `true`
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`
- `module_type`: varchar, NOT NULL, 默认 `'highlight'`
- `icon_text`: varchar, NULL
- `icon_image`: text, NULL
- `theme`: varchar, NULL
- `target_type`: varchar, NULL
- `target_value`: text, NULL

约束和索引：

- 主键：`service_modules_pkey(id)`
- `service_modules_module_type_check`：`highlight`、`service`、`shortcut`
- 索引：`idx_service_modules_visible_sort(visible, sort)`
- 索引：`idx_service_modules_type_visible_sort(module_type, visible, sort)`

模块类型：

- `highlight`：服务说明，例如服务覆盖、专业匹配、服务保障。
- `service`：具体家政服务入口和服务类型选项。
- `shortcut`：客户端首页四个快捷入口。

点击类型：

- `none`
- `find_ayi`
- `demand`
- `customer_service`
- `about`
- `service`
- `store`

规则：

- `visible=false` 不进入小程序展示。
- 服务类型选项来自 `module_type='service' AND visible=true`。
- 快捷入口来自 `module_type='shortcut' AND visible=true`。
- 后台修改标题、说明、图标、排序、跳转和显示状态后，小程序通过 `/api/miniprogram` 同步。
- 新增、修改、删除写入 `audit_logs`。

敏感字段：无。

### service_orders

中文名称：标准化服务订单。

用途：V001 标准化订单表。当前 V3 后台订单跟进使用 `orders`。

字段：

- `id`: uuid, NOT NULL, 默认 `gen_random_uuid()`
- `order_no`: varchar, NOT NULL
- `customer_id`: uuid, NOT NULL
- `service_item_id`: uuid, NOT NULL
- `service_address_id`: uuid, NULL
- `requested_start_date`: date, NULL
- `budget_min`: numeric, NULL
- `budget_max`: numeric, NULL
- `family_requirements`: text, NULL
- `source`: varchar, NOT NULL, 默认 `'manual'`
- `consultant_name`: varchar, NULL
- `status`: varchar, NOT NULL, 默认 `'new'`
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`service_orders_pkey(id)`
- 唯一：`service_orders_order_no_unique(order_no)`
- 外键：`customer_id -> customers.id`
- 外键：`service_item_id -> service_items.id`
- 外键：`service_address_id -> service_addresses.id`
- 状态：`new`、`follow_up`、`matching`、`interviewing`、`assigned`、`in_service`、`completed`、`cancelled`
- 预算检查：`service_orders_budget_check`
- 索引：`idx_service_orders_customer_id(customer_id)`
- 索引：`idx_service_orders_service_item_id(service_item_id)`
- 索引：`idx_service_orders_status(status)`

敏感字段：家庭需求、地址关联、预算。

### stores

中文名称：门店信息。

用途：后台维护门店列表和门店详情，小程序展示门店、导航和电话。

页面/API：

- 后台：门店信息
- 小程序：门店列表、门店详情
- API：`/api/stores`
- 小程序公开数据：`/api/miniprogram.stores`

字段：

- `id`: integer, NOT NULL
- `image`: text, NULL
- `name`: varchar, NOT NULL
- `district`: varchar, NULL
- `address`: text, NULL
- `phone`: varchar, NULL
- `area`: text, NULL
- `tags`: text[], NOT NULL, 默认 `ARRAY[]::text[]`
- `can_stay`: boolean, NOT NULL, 默认 `false`
- `visible`: boolean, NOT NULL, 默认 `true`
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`
- `intro`: text, NULL
- `business_hours`: varchar, NULL
- `manager_name`: varchar, NULL
- `manager_title`: varchar, NULL
- `manager_image`: text, NULL
- `manager_intro`: text, NULL
- `staff_count`: integer, NULL
- `consultant_count`: integer, NULL
- `ayi_count`: integer, NULL
- `team_intro`: text, NULL
- `latitude`: numeric, NULL
- `longitude`: numeric, NULL

约束和索引：

- 主键：`stores_pkey(id)`

规则：

- `visible=false` 不进入小程序门店列表。
- 图片上传在后台保存到 `Backstage/public/uploads/stores/`，数据库保存 URL。
- 本地微信开发者工具通过前端转换 localhost HTTP 图片为本地文件显示。
- 经纬度存在时可调用地图导航。
- 新增、修改、删除写入 `audit_logs`。

敏感字段：门店电话、地址一般为公开信息；不应放个人证件或隐私图片。

### user_accounts

中文名称：统一登录账号。

用途：后台和预留小程序账号登录。当前已支持 `customer`、`ayi`、`operator`、`boss` 四类角色。

页面/API：

- API：`/api/auth/login`
- API：`/api/auth/logout`
- API：`/api/auth/me`
- API：`/api/auth/change-password`

字段：

- `id`: integer, NOT NULL
- `username`: varchar, NOT NULL
- `phone`: varchar, NULL
- `password_hash`: text, NOT NULL
- `role`: varchar, NOT NULL
- `related_profile_type`: varchar, NULL
- `related_profile_id`: text, NULL
- `status`: varchar, NOT NULL, 默认 `'active'`
- `wechat_openid`: varchar, NULL
- `wechat_unionid`: varchar, NULL
- `failed_login_count`: integer, NOT NULL, 默认 `0`
- `locked_until`: timestamptz, NULL
- `last_login_at`: timestamptz, NULL
- `created_at`: timestamptz, NOT NULL, 默认 `now()`
- `updated_at`: timestamptz, NOT NULL, 默认 `now()`

约束和索引：

- 主键：`user_accounts_pkey(id)`
- 唯一：`user_accounts_username_unique(username)`
- 唯一：`user_accounts_phone_unique(phone)`
- `role`：`customer`、`ayi`、`operator`、`boss`
- `status`：`active`、`disabled`、`locked`
- `related_profile_type`：`customers`、`ayis`、`backstage_accounts`
- 索引：`idx_user_accounts_role(role)`
- 索引：`idx_user_accounts_status(status)`
- 索引：`idx_user_accounts_related_profile(related_profile_type, related_profile_id)`

规则：

- 禁止保存明文密码。
- 登录成功写 `auth_sessions`。
- 登录、退出写 `audit_logs`。
- 禁用账号不能登录。
- 当前正式微信 openid 登录尚未接入。

敏感字段：

- `password_hash`
- `wechat_openid`
- `wechat_unionid`
- `failed_login_count`
- `locked_until`

## 5. 状态值和业务规则

### 阿姨状态和上下架

- 认证状态：`待审核`、`已认证`，兼容 `approved`。
- `visible=false` 表示下架，不是删除。
- 下架阿姨不出现在公开小程序列表。
- 下架阿姨不能被新增推荐。
- 历史需求、历史匹配、历史申请保留。

后台阿姨管理分类：

| 分类 | 规则 |
| --- | --- |
| 已认证 | `status IN ('已认证', 'approved') AND visible=true` |
| 待审核 | 未认证且 `visible=true` |
| 已下架 | `visible=false`，优先级最高 |

### 客户需求状态

V3.1 标准状态：

| 状态 | 含义 |
| --- | --- |
| 待处理 | 新需求或尚未正式跟进 |
| 已联系 | 已完成初步沟通 |
| 匹配中 | 正在推荐或筛选阿姨 |
| 已匹配 | 客户已确认或已完成匹配 |
| 已关闭 | 需求取消、关闭或不再跟进 |

兼容旧状态：

| 旧状态 | 归类 |
| --- | --- |
| 待跟进 | 待处理 |
| 顾问待联系 | 待处理 |
| 待匹配 | 匹配中 |
| 已推荐 | 匹配中 |
| 已面试 | 已匹配 |
| 已成交 | 已匹配 |
| 已取消 | 已关闭 |

### 需求匹配状态

| 状态 | 含义 |
| --- | --- |
| 已推荐 | 后台已推荐给客户 |
| 客户已确认 | 客户确认该阿姨 |
| 客户已拒绝 | 客户拒绝该阿姨 |
| 已失效 | 后台标记推荐失效 |

重复确认、重复拒绝或跨需求操作会被拒绝。

### 服务中心类型

| module_type | 用途 |
| --- | --- |
| highlight | 服务说明 |
| service | 具体家政服务 |
| shortcut | 客户端首页快捷入口 |

## 6. 操作与数据表对应关系

| 操作 | 写入表 | 是否审计 |
| --- | --- | --- |
| 管理端/运营端登录 | `auth_sessions` | 是，`audit_logs action=login` |
| 退出登录 | `auth_sessions.revoked_at` | 是，`audit_logs action=logout` |
| 新增/修改阿姨 | `ayis` | 是 |
| 阿姨上下架 | `ayis.visible` | 是 |
| 删除阿姨 | `ayis` | 是 |
| 客户提交需求 | `demands` | 是 |
| 后台修改客户需求 | `demands` | 是 |
| 推荐阿姨 | `demand_matches`，并可能更新 `demands.status` | 是 |
| 客户确认推荐 | `demand_matches.status`，`demands.status` | 是 |
| 客户拒绝推荐 | `demand_matches.status` | 是 |
| 推荐标记失效 | `demand_matches.status` | 是 |
| 新增/修改预约 | `appointments` | 是 |
| 新增/修改接单申请 | `applications` | 是 |
| 新增/修改订单 | `orders` | 是 |
| 人工派单 | `order_dispatches` | 是 |
| 修改门店 | `stores` | 是 |
| 上传门店图片 | `stores.image` 或 `stores.manager_image` | 是 |
| 修改服务中心 | `service_modules` | 是 |
| 修改首页轮播 | `banners` | 是 |
| 修改公司基础信息 | `company_profile` | 是 |
| 导出操作记录 | `audit_logs` | 是，`action=export` |

以下纯前端操作不写数据库：

- 点击后台菜单
- 点击分类卡片
- 列表搜索
- 查看详情
- 返回分类
- 小程序点击电话
- 小程序点击导航
- 图片展示

## 7. 审计日志

`audit_logs` 用于回答：

```text
谁在什么时间做了什么，对哪个对象做了修改，修改前后是什么。
```

当前代码写入来源：

- `Backstage/repositories/resourceRepository.js`
- `Backstage/repositories/demandMatchRepository.js`
- `Backstage/repositories/companyProfileRepository.js`
- `Backstage/repositories/authRepository.js`
- `Backstage/repositories/backstageRepository.js`

操作记录后台页面：

- 路由：`#/audit-logs`
- API：`/api/auditLogs`
- 导出：`/api/auditLogs/export`
- 权限：仅 `boss`

查询支持：

- 操作人
- 角色
- 模块
- 操作类型
- 开始/结束时间
- 关键字
- 分页

导出规则：

- 导出当前筛选条件下结果。
- 单次最多 10000 条。
- CSV 使用 UTF-8 BOM，兼容 Excel 中文。
- 防止 CSV 公式注入。
- 敏感字段递归显示为 `[已隐藏]`。

## 8. 安全说明

禁止提交：

```text
.env
数据库密码
token
session
AppSecret
私钥
生产备份
```

安全规则：

- `user_accounts.password_hash` 只保存密码哈希。
- `auth_sessions.token_hash` 只保存 session token 哈希。
- `demands.customer_access_token_hash` 只保存客户需求访问 token 哈希。
- `audit_logs` 页面和导出必须隐藏敏感字段。
- 运营端不能访问账号权限、公司基础信息、管理看板、操作记录。
- 客户和阿姨不能访问后台通用 CRUD API。
- `Backstage/data.json` 只是本地兜底，不是生产数据库。
- 本地上传图片保存在 `Backstage/public/uploads/`，生产环境应迁移到正式 HTTPS 文件服务或云存储。

## 9. 常用只读 SQL

查看表记录数：

```sql
SELECT 'ayis' AS table_name, count(*) FROM ayis
UNION ALL SELECT 'demands', count(*) FROM demands
UNION ALL SELECT 'demand_matches', count(*) FROM demand_matches
UNION ALL SELECT 'appointments', count(*) FROM appointments
UNION ALL SELECT 'applications', count(*) FROM applications
UNION ALL SELECT 'orders', count(*) FROM orders
UNION ALL SELECT 'order_dispatches', count(*) FROM order_dispatches
UNION ALL SELECT 'stores', count(*) FROM stores
UNION ALL SELECT 'service_modules', count(*) FROM service_modules
UNION ALL SELECT 'banners', count(*) FROM banners
UNION ALL SELECT 'company_profile', count(*) FROM company_profile
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs
ORDER BY table_name;
```

查看需求状态分布：

```sql
SELECT status, count(*)
FROM demands
GROUP BY status
ORDER BY count(*) DESC, status;
```

查看阿姨状态和上下架分布：

```sql
SELECT status, visible, count(*)
FROM ayis
GROUP BY status, visible
ORDER BY status, visible;
```

查看服务中心类型和显示状态：

```sql
SELECT module_type, visible, count(*)
FROM service_modules
GROUP BY module_type, visible
ORDER BY module_type, visible;
```

查看最近审计日志：

```sql
SELECT
  actor,
  actor_role,
  action,
  entity_type,
  resource_id_text,
  created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;
```

按操作人查询日志：

```sql
SELECT
  actor,
  actor_role,
  action,
  entity_type,
  resource_id_text,
  created_at
FROM audit_logs
WHERE actor = 'le'
ORDER BY created_at DESC;
```

查看删除操作：

```sql
SELECT
  actor,
  actor_role,
  entity_type,
  resource_id_text,
  before_summary,
  created_at
FROM audit_logs
WHERE action = 'delete'
ORDER BY created_at DESC;
```

联查需求、匹配记录、阿姨：

```sql
SELECT
  d.id AS demand_id,
  d.customer_name,
  d.service_type,
  d.status AS demand_status,
  dm.id AS match_id,
  dm.status AS match_status,
  a.id AS ayi_id,
  a.name AS ayi_name,
  a.visible AS ayi_visible
FROM demands d
LEFT JOIN demand_matches dm ON dm.demand_id = d.id
LEFT JOIN ayis a ON a.id = dm.ayi_id
ORDER BY d.id DESC, dm.id DESC;
```

查看下架阿姨：

```sql
SELECT id, name, phone, status, visible, updated_at
FROM ayis
WHERE visible = false
ORDER BY updated_at DESC;
```

查看公司基础信息：

```sql
SELECT
  id,
  company_name,
  short_name,
  customer_service_phone,
  address,
  business_hours,
  updated_at
FROM company_profile
WHERE id = 1;
```

不要在 SQL 查询结果中对外暴露：

- 密码哈希
- session token hash
- 客户需求 access token hash
- 微信 openid
- 证件图片
- 个人手机号和详细地址

## 10. 备份恢复建议

以下是建议，不表示当前已经完成生产备份体系：

- 每日执行 PostgreSQL 备份。
- 保留多个历史版本，例如最近 7 天每日备份、最近 4 周每周备份。
- 备份文件不得提交到 Git。
- 备份文件应限制访问权限，只允许管理人员或运维账号读取。
- 定期做恢复演练，确认备份可用。
- 图片上传目录需要单独备份，例如 `Backstage/public/uploads/`。
- 正式上线后建议迁移到 HTTPS 文件服务或云存储，并备份对象存储。
- 恢复时先恢复数据库，再恢复对应图片文件，避免 URL 指向不存在的文件。

常见备份命令示例：

```powershell
docker exec sunshine-beiya-postgres pg_dump -U sunshine_app -d sunshine_beiya -F c -f /tmp/sunshine_beiya.dump
docker cp sunshine-beiya-postgres:/tmp/sunshine_beiya.dump ./backups/sunshine_beiya.dump
```

常见恢复命令示例：

```powershell
docker cp ./backups/sunshine_beiya.dump sunshine-beiya-postgres:/tmp/sunshine_beiya.dump
docker exec sunshine-beiya-postgres pg_restore -U sunshine_app -d sunshine_beiya --clean --if-exists /tmp/sunshine_beiya.dump
```

恢复命令有破坏性，必须先确认目标环境和备份文件，不能对生产库随意执行。

## 11. 当前已知边界

- 当前数据库同时存在 V001 标准化规划表和 V002/V3 实际业务资源表。
- V3 小程序客户需求匹配闭环主要使用 `demands`、`demand_matches`、`ayis`。
- 完整订单闭环、线上支付、正式微信 openid 登录、生产 HTTPS 文件服务尚未完成。
- `pay_status` 是后台订单展示字段，不代表已经接入线上支付。
- 本地 `Backstage/data.json` 仅作为兜底和开发参考，不应被视为生产数据源。
