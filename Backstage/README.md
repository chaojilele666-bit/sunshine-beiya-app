# Backstage 后台目录

本目录包含原生 Node.js 后台 API 和静态后台管理页面。

## 当前入口

- 后台操作指南：`docs/04_ADMIN_BACKEND_GUIDE.md`
- API 参考：`docs/06_API_REFERENCE.md`
- 认证和权限：`docs/08_AUTH_AND_PERMISSIONS.md`
- 本地开发：`docs/03_LOCAL_DEVELOPMENT_GUIDE.md`

## 本地地址

```text
http://localhost:5177
```

## 注意事项

- 后台管理身份对外显示为“运营端”和“管理端”。
- 不提交真实密码、token、session 或 `.env`。
- `Backstage/data.json` 只作为迁移来源、历史备份和只读兜底参考；正常写入使用 PostgreSQL。
