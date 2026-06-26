# API 参考

Base URL:

```text
http://localhost:5177/api
```

## 健康检查

- `GET /health/database`

## 登录认证

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/change-password`

后台受保护请求使用：

```text
Authorization: Bearer <token>
```

不要在日志或文档中记录真实 token。

## 公共目录接口

- `GET /service-categories`
- `GET /service-items`
- `GET /service-catalog`

## 后台 CRUD

以下资源需要后台登录并通过权限校验。后台通用 CRUD 只面向 `boss` / `operator`，小程序 `customer` / `ayi` 不能直接调用这些接口：

- `GET/POST/PUT/DELETE /accounts`
- `GET/POST/PUT/DELETE /ayis`
- `GET/POST/PUT/DELETE /demands`
- `GET/POST/PUT/DELETE /appointments`
- `GET/POST/PUT/DELETE /applications`
- `GET/POST/PUT/DELETE /orders`
- `GET/POST/PUT/DELETE /orderDispatches`
- `GET/POST/PUT/DELETE /stores`
- `GET/POST/PUT/DELETE /serviceModules`
- `GET/POST/PUT/DELETE /banners`

## 管理端接口

- `GET /dashboard`
- `GET /auditLogs`

仅管理端可访问。

## 小程序展示接口

- `GET /miniprogram`

返回：

- `source`
- `ayis`
- `demands`
- `stores`
- `serviceModules`
- `banners`
- `companyProfile`

PostgreSQL 正常时，`source` 应为 `postgres`。

## 服务中心字段

`serviceModules` 驱动客户端首页服务中心和快捷入口。

主要字段：

- `title`
- `summary` / `description`
- `moduleType`：`highlight`、`service` 或 `shortcut`
- `iconText`
- `iconImage`
- `theme`
- `targetType`
- `targetValue`
- `sort`
- `visible`

只有 `visible !== false` 的记录会显示。

`shortcut` 支持的点击行为：

- `find_ayi`
- `demand`
- `customer_service`
- `about`
- `service`
- `store`
- `none`

## V3.1 客户需求匹配

- `POST /miniprogram/demands`
- `GET /miniprogram/demands/:id`
- `GET /miniprogram/demands/:id/matches`
- `POST /miniprogram/demand-matches/:id/decision`

需求详情、推荐列表和确认/拒绝接口必须使用请求头：

```text
X-Demand-Access-Token: <customer-local-token>
```

不接受 URL query 参数中的 accessToken。

后台推荐操作：

- `GET /demands/:id/matches`
- `POST /demands/:id/matches`
- `POST /demandMatches/:id/expire`

## 公司基础信息

- `GET /company-profile`
- `PUT /company-profile`

仅管理端可编辑。小程序公开数据通过 `GET /miniprogram` 中的 `companyProfile` 获取。

## 支付

当前没有线上支付接口。不要把 `payStatus` 当成有效支付流程。
