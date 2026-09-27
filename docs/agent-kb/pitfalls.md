# Agent 踩坑台账（pitfalls）

> 登记「智能体易再犯」的错误做法。**新增 / 修订后必跑**：`node scripts/agent-kb/lint-pitfalls.mjs`。
>
> **查询协议**：先看下方**路径速查**（按将要触碰的路径找 `Pn`），或 Grep 路径 / 关键词（例 `migration`、`scheduler`）；按域 Grep `| {域} |` 兜底；**禁止无筛选整表 Read**，勿把本表 alwaysApply。

## 路径速查

> 骨架行：落地后用本仓真实 `Pn` 替换「（待补）」；有活跃 Pn 时勿长期留空。

| 将要触碰的路径 / 关键词 | 相关坑 |
|---|---|
| `mvn`、`backend/pom.xml`、`-pl`、`-am` | P1 |
| `AuthApiIntegrationTest`、`UserProfileApiIntegrationTest`、`DemoUserStore`、`resetCredentials`、`resetProfile` | P2 |
| `docs/agent-config`、`scripts/agent-config`、`.cursor/`、`.codex/`、`.agents/` | P3 |
| `docs/api`、`controller`、`dto/`、`frontend/src/api/client.ts`、`frontend/src/api/types.ts` | P4 |
| `application.yml`、`app.jwt.secret`、`.env`、`accessToken` | P5 |
| `frontend/src/App.tsx`、`useEffect`、`setState`、`history.replaceState`、`oxlint` | P6 |

## 域速查

| 域 | 坑 |
|---|---|
| Build | P1 |
| Test | P2 |
| Config | P3、P5 |
| API | P4 |
| Auth | P5 |
| Frontend | P6 |

## 台账（活跃）

| ID | 状态 | 域 | 触发路径/关键词 | 现象 | 错误做法 | 正确约束落点 |
|---|---|---|---|---|---|---|
| P1 | 活跃 | Build | `mvn`、`-pl backend -am`、`backend/pom.xml` | 仓库根执行 `mvn -pl backend -am test` 报 “no POM in this directory” | 套用多模块 Maven 写法（harness spring 分册模板默认） | [根 AGENTS Commands](../../AGENTS.md) · [backend/AGENTS.md](../../backend/AGENTS.md) |
| P2 | 活跃 | Test | `AuthApiIntegrationTest`、`UserProfileApiIntegrationTest`、`DemoUserStore`、`resetCredentials`、`resetProfile` | 改密用例后 demo/admin 密码被改，后续用例登录 401；改资料用例后 demo/admin 邮箱残留，其他用例误报 409「该邮箱已被使用」 | 集成测试改共享内存账号（密码 / 昵称邮箱）后不在 `@AfterEach` 恢复（`resetCredentials` / `resetProfile`） | [backend/AGENTS.md](../../backend/AGENTS.md) · [func 真相](../func/modules/01-account-login-backend.md) |
| P3 | 活跃 | Config | `.cursor/`、`.codex/`、`.agents/`、`docs/agent-config` | 手改生成物后 `sync.mjs --check` 报漂移 / 下次 sync 被覆盖 | 直接编辑 `.cursor/rules/*.mdc` 等生成物 | [docs/agent-config/README.md](../agent-config/README.md) |
| P4 | 活跃 | API | `controller`、`dto/`、`docs/api`、`frontend/src/api` | 前端 `types.ts` 字段与后端 record 不一致导致页面空值 / 错误文案不符 | 只改一端或不更新 api 真相 | [api 真相](../api/modules/01-account-login-auth.md) · [frontend/AGENTS.md](../../frontend/AGENTS.md) |
| P5 | 活跃 | Auth | `app.jwt.secret`、`accessToken`、`.env` | 演示密钥进入生产配置 / token 出现在日志 | 硬编码或打印密钥与 token | [backend/AGENTS.md](../../backend/AGENTS.md) |
| P6 | 活跃 | Frontend | `frontend/src/App.tsx`、`useEffect`、`setState`、`history.replaceState`、`oxlint` | 手写路由在 `useEffect` 内同步 `setState` 做「未登录→/login」重定向，`npm run lint` 出现 `react(set-state-in-effect)` warning（基线为 0） | 用 effect 同步派生状态做重定向 | [frontend/AGENTS.md](../../frontend/AGENTS.md)（路由：初始路由在 `useState` 初始化派生；effect 只对齐地址栏；重定向放事件回调） |

## 已根治留档

| ID | 状态 | 域 | 触发路径/关键词 | 现象 | 错误做法 | 正确约束落点 |
|---|---|---|---|---|---|---|

> 根治（根因已消除，如加了 lint / 模板 / 钩子）后把行**移动**到本区并改状态「已根治」；**ID 不复用**。

## 封闭域词表

「域」列只允许：`"Build", "Auth", "Docs", "Config", "API", "Backend", "Test", "Cache", "Jobs", "Frontend", "DB", "MCP", "Prompt", "Graph"`。
需要新域时，先改 `scripts/agent-kb/lint-pitfalls.mjs` 的 `DOMAINS` 词表（land 时由占位 `PITFALL_DOMAINS` 渲染），再使用。

## 书写要求

- **触发路径/关键词必填**：写会被 Grep 到的路径片段或关键词，供路径速查 / Grep 命中
- 「正确约束落点」只回链 AGENTS / rule / 契约真相文档，**不抄正文**（避免两处漂移）
- 「现象 / 错误做法」写可检索的事实，不写感想
- **根 AGENTS Never do**：新增红线必须带 `→ Pn`，且该 `Pn` 须出现在本台账 **与**「路径速查」（lint 会 warn 缺回链）
