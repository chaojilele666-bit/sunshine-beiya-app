# 认证和权限

## 对外身份名称

后台对外显示：

- 运营端：内部角色 `operator`
- 管理端：内部角色 `boss`

不要在后台 UI 文案中使用“老板端”。

小程序身份：

- 客户端：`customer`
- 阿姨端：`ayi`

## 账号模型

登录使用 `user_accounts`。

主要字段：

- `username`
- `phone`
- `password_hash`
- `role`
- `related_profile_type`
- `related_profile_id`
- `status`
- `wechat_openid`
- `wechat_unionid`
- `failed_login_count`
- `locked_until`
- `last_login_at`

session 存在 `auth_sessions` 中。前端拿到随机 token，数据库只保存 token hash 和过期时间。

## 后台权限

| 角色 | 权限 |
| --- | --- |
| `operator` / 运营端 | 管理阿姨、需求、预约、申请、订单、派单、门店、服务中心和轮播。不能管理账号、看板和审计日志。 |
| `boss` / 管理端 | 可访问全部后台业务数据、管理看板、账号权限和审计日志。 |

权限由后端根据 session token 判断，前端菜单隐藏不是安全边界。

## 小程序权限

| 角色 | 权限 |
| --- | --- |
| `customer` | 正式微信登录未接入前，V3.1 需求详情使用需求级 accessToken。 |
| `ayi` | 正式微信登录未接入前，阿姨端仍是 MVP 页面流程。 |

小程序身份不能直接访问后台通用 CRUD 接口，例如 `/api/ayis`、`/api/orders`、`/api/demands`。客户需求查看、推荐确认和拒绝使用 `/api/miniprogram/...` 专用接口；后续如需阿姨个人订单、接单记录等能力，应继续增加小程序专用接口，而不是复用后台管理接口。

## V3.1 需求访问令牌

客户提交需求后：

- 小程序拿到原始 accessToken。
- 数据库只保存 SHA-256 hash。
- 后续需求详情、推荐列表、确认/拒绝通过 `X-Demand-Access-Token` 请求头传递 token。
- 不接受 URL query 参数中的 token。
- 不在日志中打印完整 token。

## 当前限制

- 正式微信登录未接入。
- `wechat_openid` 和 `wechat_unionid` 只是预留字段。
- 生产部署前需要重新评估 HTTPS、token 存储、CSRF、限流和审计策略。
