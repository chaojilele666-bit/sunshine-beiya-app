# 北京阳光北亚家政后台 MVP

这个后台是当前 MVP 的本地演示原型，用于配合微信小程序 demo 验证客户流程、阿姨流程、运营端和老板端的核心业务。它不是正式上线版。

当前架构保持简单：后台使用原生 Node.js，演示数据保存在本地 `data.json` 文件中。

## 怎么运行

在项目根目录执行：

```powershell
cd Backstage
node server.js
```

如果当前系统没有全局 `node` 命令，可以改用本机 Codex runtime 的 Node 路径：

```powershell
cd Backstage
& "C:\Users\24225\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.js
```

启动后浏览器打开：

```text
http://localhost:5177
```

小程序接口预览地址：

```text
http://localhost:5177/api/miniprogram
```

## 演示数据

当前后台演示数据文件位置：

```text
Backstage/data.json
```

本地演示时，后台新增和编辑的数据会写入这个文件。正式上线前不要把它当作生产数据库使用。

## 当前能做什么

- 管理账号入口和权限：客户端、阿姨端、运营端、老板端
- 查看老板端经营看板：客户点击、阿姨点击、客户信息量、阿姨信息量、发布量和状态统计
- 管理阿姨资料
- 管理客户需求
- 管理预约面试
- 管理阿姨接单申请
- 管理订单跟进
- 管理门店信息
- 管理客户端“公司服务”模块
- 管理首页轮播/推荐图
- 为小程序提供读取接口 `/api/miniprogram`

## 和正式上线版的区别

当前是本地演示原型，主要用于确认字段、页面和业务流程。正式上线建议迁移为：

- `data.json` -> 微信云开发数据库
- base64 图片 -> 云存储
- `localhost` 接口 -> HTTPS 云函数或服务器接口
- 前端模拟权限 -> 后端真实登录和权限校验

小程序请求地址当前继续使用：

```text
http://localhost:5177
```

正式上线前再替换为 HTTPS 云函数或服务器接口。
