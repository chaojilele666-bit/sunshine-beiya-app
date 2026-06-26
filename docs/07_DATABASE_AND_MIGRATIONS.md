# 数据库和迁移

## 本地数据库

- Docker 服务：`postgres`
- 容器名：`sunshine-beiya-postgres`
- 数据库：`sunshine_beiya`
- 端口：`5432`

## 当前主要业务表

- `backstage_accounts`
- `user_accounts`
- `auth_sessions`
- `ayis`
- `demands`
- `demand_matches`
- `appointments`
- `applications`
- `orders`
- `order_dispatches`
- `stores`
- `service_modules`
- `banners`
- `audit_logs`

## V001

初始核心业务规划表，包含 `customers`、`housekeepers`、`service_orders`、`manual_dispatches` 等标准化表。

当前 V2/V3 实际业务流程不以这些表为主。

## V002

后台资源表：

- 账号
- 阿姨
- 需求
- 预约
- 申请
- 订单
- 派单
- 门店
- 服务模块
- 轮播
- 审计日志

## V003

认证和权限：

- `user_accounts`
- `auth_sessions`
- 密码哈希
- token 哈希
- 登录失败限制
- 微信 openid/unionid 预留字段

## V004

门店详情字段和阿姨门店关联：

- 门店介绍
- 营业时间
- 店长信息
- 团队规模
- 经纬度
- 阿姨所属门店和金牌推荐字段
- 演示阿姨关联门店时不依赖固定 `stores.id=1`，通过门店名称查找实际门店 ID；找不到门店时允许 `store_id=NULL`。

## V005

客户需求匹配：

- `demands.customer_access_token_hash`
- `demand_matches`
- `(demand_id, ayi_id)` 唯一约束
- 匹配状态：已推荐、客户已确认、客户已拒绝、已失效

## V006

服务中心字段：

- `module_type`
- `icon_text`
- `icon_image`
- `theme`
- `target_type`
- `target_value`

V006 还会补充可编辑的默认服务中心记录。

## V007

公司基础信息单条配置：

- `company_profile`
- 公司名称
- 公司简称
- 公司简介
- 客服电话
- 公司地址
- 营业时间

迁移文件显式设置 `client_encoding='UTF8'`，避免中文默认值在本地执行时被错误编码。

## V008

首页快捷入口：

- 扩展 `service_modules.module_type` 约束，允许 `shortcut`
- 默认快捷入口：找阿姨、发布需求、客服咨询、公司介绍
- 复用 `title`、`summary`、`icon_text`、`icon_image`、`theme`、`target_type`、`target_value`、`sort`、`visible`

## data.json

`Backstage/data.json` 保留为迁移来源、历史备份和只读兜底参考。正常后台写入使用 PostgreSQL。
