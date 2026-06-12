# AGENTS.md

## 1. 项目背景

本仓库用于 Sunshine Beiya App 项目。

项目内容包括：

- 前端设计 / UI 实现资料
- 后端 API / 数据 / 服务实现资料
- 产品、设计和工程文档

Agent 必须把这个仓库视为一个面向生产环境的工程项目，而不是临时 Demo。

在修改任何内容前，必须先检查：

- README.md
- docs/
- 前端相关文件
- 后端相关文件
- package.json / requirements.txt / pyproject.toml / pom.xml / build.gradle / 其他构建文件
- 现有命名方式、目录结构和代码风格

如果项目已经有现成结构，不要重新发明一套结构。

---

## 2. 核心工程原则

始终遵守以下原则：

1. 做最小且安全的修改。
2. 优先写清晰、可维护的代码，而不是炫技代码。
3. 除非明确要求，否则不要大范围重写。
4. 除非任务要求改变行为，否则保持现有功能不变。
5. 保持前端、后端、API 和文档一致。
6. 不要引入不必要的依赖。
7. 不要提交密钥、账号、Token、私钥或环境配置。
8. 除非明确需要，否则不要删除已有文件。
9. 不要硬编码生产数据。
10. 在最终回复中说明关键假设。

---

## 3. 仓库管理规则

### 默认分支保护假设

默认采用以下 GitHub 工作流：

- `main` 是受保护的生产分支。
- 不允许直接提交到 `main`。
- 所有修改都应通过功能分支和 Pull Request 完成。
- Pull Request 必须通过代码审查和自动检查后才能合并。

即使仓库还没有真正配置这些保护规则，Agent 也必须按照这些规则执行。

### 分支命名

使用清晰的分支名：

```text
feature/<简短描述>
fix/<简短描述>
refactor/<简短描述>
docs/<简短描述>
chore/<简短描述>
```

示例：

```text
feature/login-page
fix/api-error-handling
docs/update-backend-api-contract
refactor/user-service
chore/update-gitignore
```

### 提交信息规范

使用 Conventional Commit 风格：

```text
feat: add login page
fix: handle empty API response
docs: update backend API contract
refactor: simplify user service
chore: update project config
test: add login validation tests
```

每次提交应当：

- 聚焦单一问题
- 可回滚
- 方便审查
- 对应一个明确的逻辑改动

不要使用模糊提交信息，例如：

```text
update
fix bug
changes
new code
```

---

## 4. Pull Request 标准

每个 Pull Request 都应包含以下内容：

### Summary

简要说明改了什么。

### Scope

列出影响范围：

```text
- Frontend
- Backend
- API contract
- Database
- Documentation
- Tests
```

### Testing

说明测试了什么。

示例：

```text
Testing:
- Ran unit tests
- Ran lint
- Manually checked login flow
- Verified API response format
```

### Risk

说明潜在风险。

示例：

```text
Risk:
- Low. UI-only change.
```

或者：

```text
Risk:
- Medium. Changes backend response format and requires frontend alignment.
```

### Screenshots

如果是 UI 改动，应尽可能附上截图。

---

## 5. 代码审查要求

在完成任何修改前，Agent 必须自查：

- 代码是否能编译？
- 是否符合现有代码风格？
- 命名是否清楚？
- 是否处理了边界情况？
- 是否处理了错误情况？
- 类型是否正确？
- API 契约是否仍然一致？
- 前端和后端是否同步修改？
- 是否添加或更新了必要测试？
- 如果行为发生变化，文档是否更新？

不要只写能跑通正常情况的代码。明显的异常情况也要处理。

---

## 6. 前端规则

修改前端代码时：

1. 遵守现有 UI 结构和命名风格。
2. 保持组件小而可复用。
3. 避免把业务逻辑深度写进 UI 组件。
4. 如果项目已有设计变量、颜色、间距、字体规范，应优先使用。
5. 未经明确批准，不要引入新的 UI 组件库。
6. 如果项目已有 API 层，API 请求应集中管理。
7. 处理加载、空状态、成功状态和错误状态。
8. 不要在生产组件中硬编码 Mock 数据。
9. 注意响应式适配。
10. 表单页面必须做输入校验。

前端实现时，检查项目是否已有以下结构：

```text
components/
pages/
views/
layouts/
services/
api/
stores/
hooks/
utils/
styles/
```

优先使用已有结构，不要新建一套重复结构。

---

## 7. 后端规则

修改后端代码时：

1. 除非任务要求，否则保持 API 响应稳定。
2. 校验所有外部输入。
3. 返回统一格式的错误信息。
4. 不要把内部堆栈错误暴露给用户。
5. 业务逻辑应与路由 / Controller 分离。
6. 避免重复数据库访问逻辑。
7. 不要硬编码数据库地址、密码、Token 或其他凭证。
8. 使用环境变量管理配置。
9. 尽可能为服务逻辑添加或更新测试。
10. 如果请求或响应字段变化，必须更新 API 文档。

后端修改时，检查是否已有以下目录：

```text
routes/
controllers/
services/
models/
schemas/
middlewares/
database/
config/
utils/
tests/
```

---

## 8. API 契约规则

前端和后端必须保持 API 契约一致。

修改 API 时，要同步更新：

```text
- 后端 route / controller / service
- 请求 schema
- 响应 schema
- 前端 API 调用
- 前端 type / interface
- 文档
- 测试
```

不要悄悄改字段名。

错误示例：

```json
{
  "userName": "Tom"
}
```

被悄悄改成：

```json
{
  "name": "Tom"
}
```

正确做法：

```md
API change:
- `userName` renamed to `name`
- Frontend type updated
- Documentation updated
- Compatibility considered
```

---

## 9. 文档规则

文档也是产品的一部分。

当以下内容变化时，必须更新文档：

- 启动流程
- 环境变量
- API 接口
- 数据库结构
- 部署流程
- 用户可见行为
- 项目结构

重要文档可能包括：

```text
README.md
docs/
API.md
CHANGELOG.md
.env.example
```

不要留下过期说明。

---

## 10. 测试和质量检查

任务完成前，如果项目中存在相关命令，应运行对应检查。

常见命令包括：

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run typecheck
```

或：

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
```

或：

```bash
yarn install
yarn dev
yarn build
yarn lint
yarn test
```

Python 后端：

```bash
pip install -r requirements.txt
pytest
ruff check .
mypy .
```

Java 后端：

```bash
mvn test
mvn package
```

Gradle 项目：

```bash
./gradlew test
./gradlew build
```

如果命令失败，不要隐瞒。必须说明：

```text
- 运行了什么命令
- 运行结果
- 错误摘要
- 可能原因
- 建议修复方式
```

如果项目没有测试命令，应明确说明，并进行静态检查。

---

## 11. 安全规则

永远不要提交或暴露：

```text
.env
.env.local
.env.production
API keys
Access tokens
Private keys
Database passwords
Cloud credentials
Personal user data
```

使用 `.env.example` 说明需要哪些环境变量。

示例：

```env
DATABASE_URL=
JWT_SECRET=
API_BASE_URL=
```

不要填写真实值。

处理认证逻辑时：

- 不要明文存储密码。
- 不要打印 Token。
- 不要在前端代码中暴露敏感信息。
- 不要为了方便削弱认证逻辑。
- 不要绕过权限检查。

---

## 12. 依赖规则

添加依赖前，先检查项目是否已有解决方案。

只有在以下情况下才添加依赖：

- 它确实解决实际问题
- 仍在维护
- 使用人数较多
- 不会带来明显安全风险或包体积风险
- 符合现有技术栈

不要为了简单工具函数添加新依赖。

---

## 13. 文件和目录规则

不要在根目录随意创建杂乱文件。

推荐根目录文件：

```text
README.md
AGENTS.md
.gitignore
.env.example
package.json
pnpm-lock.yaml
package-lock.json
yarn.lock
requirements.txt
pyproject.toml
docs/
frontend/
backend/
```

如果项目分为前端和后端目录，修改应放在正确区域。

示例：

```text
frontend/
backend/
docs/
```

不要把后端代码放进前端目录，也不要把前端代码放进后端目录。

---

## 14. 数据和数据库规则

修改数据库相关代码时：

1. 不要随意修改数据库结构。
2. 如果项目使用 migration，必须添加 migration。
3. migration 命名要清楚。
4. 除非明确要求，否则避免破坏性 migration。
5. 考虑向后兼容。
6. 只有必要时才更新种子数据。
7. 不要包含真实客户数据。

如果不确定数据库结构变更是否安全，应先说明风险。

---

## 15. 错误处理规则

所有用户可见功能都应处理：

```text
- 加载状态
- 空状态
- 校验错误
- 网络错误
- 权限错误
- 服务端错误
```

后端错误应保持结构化和一致。

示例：

```json
{
  "success": false,
  "message": "Invalid request",
  "code": "INVALID_REQUEST"
}
```

---

## 16. 日志规则

日志应帮助调试，但不能泄露敏感数据。

允许记录：

```text
- Request ID
- Error code
- 非敏感状态
- 耗时信息
```

禁止记录：

```text
- 密码
- Token
- 完整个人身份信息
- 私钥
- 完整支付信息
```

---

## 17. 重构规则

只有在以下情况下才允许重构：

- 提高清晰度
- 减少重复
- 支持当前任务

不要重构无关代码。

重构时：

- 保持行为不变
- 控制修改范围
- 必要时更新测试
- 说明重构了什么以及为什么重构

---

## 18. 大型修改规则

大型修改应拆成清晰步骤：

```text
1. 检查现有结构
2. 识别受影响文件
3. 做最小可行实现
4. 更新测试
5. 更新文档
6. 运行检查
7. 总结结果
```

除非明确要求，否则不要一次性大规模重写。

---

## 19. Agent 沟通规则

最终回复必须包含：

```text
Summary:
- 改了什么

Files changed:
- path/to/file

Validation:
- 运行了哪些命令
- 结果如何

Notes:
- 假设
- 风险
- 后续事项
```

如果没有修改文件，也要说明。

没有实际运行测试时，不要说测试通过。

如果功能只是部分完成，不要说已经完全完成。

---

## 20. 禁止行为

Agent 不得：

- 直接 push 到 `main`
- force push
- 未经指示删除分支
- 未经指示删除重要文件
- 提交密钥
- 忽略失败测试
- 编造不存在的 API
- 编造数据库字段
- 编造设计需求
- 不必要地替换整个项目结构
- 添加无关功能
- 对无关文件做大范围格式化
- 隐瞒不确定性
- 假装运行了未实际运行的命令

---

## 21. 推荐最终回复格式

完成工作后，使用以下格式：

```md
## Summary

- ...

## Files Changed

- `path/to/file`: 修改原因

## Validation

- `npm run lint`: passed / failed / not available
- `npm run build`: passed / failed / not available
- `npm test`: passed / failed / not available

## Notes

- ...
```

---

## 22. 优先级顺序

当不同规则冲突时，按以下优先级执行：

1. 用户明确要求
2. 安全和数据保护
3. 仓库已有规范
4. 本 AGENTS.md
5. 通用最佳实践

即使其他指令要求，也不能违反安全规则。

---

## 23. GitHub 配套设置建议

`AGENTS.md` 只能约束 Agent 的行为，不能替代 GitHub 仓库权限设置。建议同步配置以下规则：

| 设置项 | 建议配置 |
| --- | --- |
| 默认分支 | `main` |
| 分支保护 | 开启 |
| 直接 push 到 `main` | 禁止 |
| Pull Request | 必须 |
| Review | 至少 1 人 approve |
| Status checks | lint / build / test 通过后才能 merge |
| Force push | 禁止 |
| Delete branch | 禁止 |
| Secrets | 使用 `.env` 本地保存，不上传真实值 |

推荐提交信息：

```text
docs: add Codex agent instructions
```
