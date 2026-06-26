# 测试清单

## 自动检查

```powershell
docker compose ps
docker inspect sunshine-beiya-postgres --format "{{.State.Health.Status}}"
```

如果本机没有全局 Node，可以用 Docker Node：

```powershell
docker run --rm -v ${PWD}:/work -w /work node:22-alpine node --check Backstage/server.js
docker run --rm -v ${PWD}:/work -w /work node:22-alpine node --check frontend/app.js
docker run --rm -v ${PWD}:/work -w /work node:22-alpine node --check frontend/pages/home/home.js
```

通用检查：

```powershell
git diff --check
```

## API 冒烟测试

- `GET /api/health/database`
- `GET /api/miniprogram`
- `GET /api/serviceModules`
- `GET /api/stores`
- `POST /api/auth/login`
- 登录后访问受保护资源。

## 后台人工检查

- 管理端登录。
- 运营端登录。
- 管理端可以访问看板、账号、审计日志和全部业务模块。
- 运营端不能访问账号、看板和审计日志。
- hash 路由模块页面不会一次性显示所有模块。
- 服务中心 CRUD 修改后 `/api/miniprogram` 同步更新。

## 小程序人工检查

客户端：

- 首页公司展示只在有可见图片时显示。
- 服务中心显示服务说明和具体服务入口。
- 服务卡片点击保持服务筛选逻辑。
- 门店列表和门店详情图片显示正常。
- 发布需求后能进入需求详情。
- 推荐阿姨确认/拒绝可用。

阿姨端：

- 阿姨首页未被客户端首页修改影响。
- 工作列表正常。
- 申请接单可用。
- 资料和证件页面可打开。

## 安全检查

- `.env` 未暂存。
- 文档和日志不包含真实密码、原始 token、私钥、API Key 或 session。
- 需求 accessToken 使用 `X-Demand-Access-Token` 请求头，不进入 URL。
- `password_hash` 不返回前端。
