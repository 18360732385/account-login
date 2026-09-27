# frontend — AI 协作规范（前端分册）

> 本文件供 AI 在 `frontend/` 下工作时遵循（**分册厚 SSOT**）。  
> 仓库命令与红线见根 [AGENTS.md](../AGENTS.md)。与 path rule `17-frontend-web` 对齐；细则以本分册为准。

## 模块定位

| 项 | 说明 |
|---|---|
| 职责 | 账号 SPA：登录 / 注册 / 个人资料 / 改密 / 登出，消费 `backend` 的 `/api/*` |
| 边界 | **仅前端**；勿把后端静态资源塞进后端模块 |
| 技术栈 | Vite 8 + React 19 + TypeScript 6 · npm（`package-lock.json`）· 原生 CSS（`App.css`/`index.css`，无 UI 库）· Vitest 5 + Testing Library + jsdom · oxlint |
| 登录态 | `accessToken` 仅存 `App.tsx` 的 React state（不落 localStorage，刷新即需重新登录）；401 时回到登录视图 |
| 开发端口 | `:5173`（`vite.config.ts` 代理 `/api` → `http://localhost:8080`；或设 `VITE_API_BASE_URL` 直连） |

## 动手前检查

1. 读根 AGENTS 与本分册
2. 改接口消费：先读 `docs/api` 索引 → 真相，再改 api-client / types / queries
3. 触碰 UI：确认禁用清单（见下）仍有效
4. 跑本模块 typecheck / test（见下）

## 常用命令

```text
cd frontend
npm ci                 # 安装（锁文件为准）
npm run dev            # :5173
npm test               # vitest run（App.test.tsx、api/client.test.ts）
npm run build          # tsc -b 类型检查 + vite build
npm run lint           # oxlint
```

## 栈与禁用清单

- **推荐栈**：React 函数组件 + hooks；请求统一走 `src/api/client.ts`（原生 `fetch`）；状态用组件 state（本仓无路由库 / 状态库）
- **禁用**（勿重新引入）：未经需求确认不引入 UI 组件库、CSS-in-JS、axios、全局状态库；组件内直接 `fetch`（须经 `api/client.ts`）
- 完整禁用说明：本分册为准；rule `17` 只提醒路径

## api-client / 契约同步

| 变更 | 必须同步 |
|---|---|
| 后端 REST 契约 | `docs/api/modules/…`（SSOT）+ 本模块 api-client / types / queries |
| 仅前端展示 | 本模块组件；**勿**反向改契约真相 |

- api-client：`src/api/client.ts`（`register` / `login` / `fetchMe` / `logout` / `changePassword`，错误统一抛 `ApiError(status, message, code)`）
- types：`src/api/types.ts`（与后端 record DTO 字段一一对应）
- queries：无（未用 react-query）
- 测试替身：`src/api/client.test.ts` mock `fetch`

## 改动路径速查

| 需求 | 优先改动 |
|---|---|
| 页面 / 视图切换 | `src/App.tsx`（无路由库，按登录态切换视图） |
| 表单 / 视图组件 | `src/components/{LoginForm,RegisterForm,ProfileView,ChangePasswordForm}.tsx` |
| 接口类型 / 请求封装 | `src/api/types.ts` / `src/api/client.ts` |
| 契约正文 | `docs/api/modules/…`（先真相后代码） |

## 禁止事项

> 一句话在此；细节回链 `docs/agent-kb/pitfalls.md` 的 `Pn`。

- 提交密钥 / `.env` 真密
- 重新引入仓内已禁用的 UI / 样式库
- 无文档同步地变更公开契约消费层
- 改后端契约只改前端不改 `docs/api` 真相（或反之）→ P4
- 把 token 打到 console / 提交 `.env` 真实值 → P5

## 文档同步门禁（交付必做）

| 变更类型 | 必须同步 |
|---|---|
| REST 消费 / 类型 | `docs/api/modules/…` + api-client/types/queries |
| 仅前端行为 | 本分册改动路径；不必改后端契约 |
