# 本地开发指南

## 前置条件

- Docker Desktop 和 WSL 2 正常。
- 微信开发者工具。
- Node.js。若系统没有全局 Node，可使用 Docker Node 或 Codex runtime Node。

## 启动 PostgreSQL

```powershell
docker compose up -d
docker compose ps
docker inspect sunshine-beiya-postgres --format "{{.State.Health.Status}}"
```

期望状态：

```text
healthy
```

## 启动后台

```powershell
cd Backstage
node server.js
```

后台地址：

```text
http://localhost:5177
```

数据库健康检查：

```text
http://localhost:5177/api/health/database
```

## 微信开发者工具

导入目录：

```text
frontend/
```

本地调试 `localhost` 时，个人配置中需要：

```json
{
  "setting": {
    "urlCheck": false
  }
}
```

`frontend/project.private.config.json` 是本机个人配置，不建议提交。

## 常见问题

### localhost 请求被拦截

如果出现：

```text
http://localhost:5177 不在 request 合法域名列表中
```

请关闭微信开发者工具本地合法域名检查。

### HTTP 图片不能显示

微信基础库可能拒绝 HTTP 图片。当前小程序使用 `app.resolveImageForDisplay()` 将本地 `localhost` HTTP 图片转换为微信本地文件路径。

### 后台数据没有刷新

检查小程序日志是否显示：

```text
source=postgres
backendReady=true
```

如果不是，检查 PostgreSQL healthcheck 和后台服务。
