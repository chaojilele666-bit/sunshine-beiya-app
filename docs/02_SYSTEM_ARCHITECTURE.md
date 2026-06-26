# 系统架构

## 组成

- 小程序：`frontend/`
- 后台页面和 API：`Backstage/`
- 数据库：Docker Compose PostgreSQL 16
- 数据库迁移：`database/init/`
- 历史演示数据和只读兜底：`Backstage/data.json`

## 数据流

后台管理：

```text
后台页面 -> /api/<resource> -> repository -> PostgreSQL -> audit_logs
```

小程序展示：

```text
PostgreSQL -> /api/miniprogram -> frontend/app.js -> globalData -> 页面
```

V3.1 需求匹配：

```text
客户提交需求 -> demands.customer_access_token_hash
后台推荐阿姨 -> demand_matches
客户查看/确认/拒绝 -> X-Demand-Access-Token 请求头
```

## 图片流

后台上传：

```text
浏览器 data:image -> Backstage/public/uploads -> PostgreSQL URL 字段
```

本地小程序显示：

```text
http://localhost:5177/uploads/... -> wx.request arraybuffer -> wx.env.USER_DATA_PATH -> <image>
```

正式上线目标：

```text
HTTPS 文件服务或云存储 URL -> <image>
```

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

## V001 表说明

V001 中的 `customers`、`housekeepers`、`service_orders`、`manual_dispatches` 是更标准化的规划表。当前 V2/V3 实际业务流程暂不以这些表为主。
