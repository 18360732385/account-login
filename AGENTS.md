# account-login — AGENTS.md

> AI 协作总入口。分册约定见各模块 `AGENTS.md`；契约真相见 `docs/func|api|db|redis|jobs`（按已启用域）。

> **分册真相（避免三处漂移）**  
> - 后端 / 服务模块约定 → 对应分册 `**/AGENTS.md`（定位、编码、迁移、改动路径）  
> - 前端模块约定 → 前端分册 `AGENTS.md`（栈禁令、api-client 同步）  
> - **本文件只保留**：仓库命令、Never do（一句话 + Pn 回链）、Planning corpus 摘要、rules 索引；文档优先级见 alwaysApply `00`

## Critical

- **后端不是 Maven 多模块**：仓库根**没有** `pom.xml`；后端命令一律 `mvn -f backend …`（或 `cd backend && mvn …`），**勿**用 `mvn -pl backend -am`（分册模板默认写法不适用本仓）→ P1
- 前端命令在 `frontend/` 下执行（`npm --prefix frontend …` 亦可）；Node ≥ 20
- 改 `docs/agent-config/**` 后必须 `node scripts/agent-config/sync.mjs` 并提交生成物；`.cursor/` `.codex/` `.agents/` 为生成物勿手改 → P3
- 用户与 token 吊销名单均为**内存**实现：重启即丢；集成测试改密后须 `resetCredentials` 恢复预置账号 → P2

## Commands

| Task | Command |
|---|---|
| 后端测试 | `mvn -q -f backend test` |
| 后端启动（:8080） | `mvn -f backend spring-boot:run` |
| 前端安装 | `npm --prefix frontend ci` |
| 前端测试 | `npm --prefix frontend test`（vitest run） |
| 前端构建 / 类型检查 | `npm --prefix frontend run build`（`tsc -b && vite build`） |
| 前端 lint | `npm --prefix frontend run lint`（oxlint） |
| 前端开发（:5173，代理 `/api`→:8080） | `npm --prefix frontend run dev` |
| 宿主配置同步 / 漂移校验 | `node scripts/agent-config/sync.mjs` / `node scripts/agent-config/sync.mjs --check` |
| 踩坑台账 lint | `node scripts/agent-kb/lint-pitfalls.mjs` |

## Repo structure

```text
account-login/
├── backend/                 # Spring Boot 3 JWT API（独立 pom）→ backend/AGENTS.md
├── frontend/                # Vite + React 19 + TS SPA → frontend/AGENTS.md
├── docs/func|api/           # 契约：索引 + 真相（本仓启用 func、api；无 db/redis/jobs）
├── docs/agent-kb/           # architecture / pitfalls / accepted-gaps
├── docs/agent-config/       # L5 宿主配置 SSOT（rules/hooks/mcp/skills）→ sync 生成 .cursor/.codex/.agents
├── docs/harness-eng/        # harness-eng 施工产物（meta / score-policy / fill-plan / 报告；非契约）
├── docs/requirements/       # 需求原文（非契约 SSOT）
├── docs/runs/               # feature-eng 过程态（非契约 SSOT）
└── docs/superpowers/        # 规划语料（非 SSOT）
```

## 给智能体的文档优先级

1. 本文件 — 命令与红线
2. 分册 `**/AGENTS.md`（按改动路径）
3. 宿主 rules / 必读索引（见下「Rules 索引」）— **Codex 不自动加载** `.cursor/rules/*.mdc`；须按索引 Read 或用 `.agents/skills`
4. `docs/func` → `docs/api` → `docs/db` → `docs/redis` → `docs/jobs`（先索引再真相；按已启用域）
5. `docs/agent-kb/` — 定向与踩坑回流（非契约 SSOT）
6. `docs/superpowers/README.md` — 仅进行中；不覆盖上列 SSOT
7. `docs/releases/` — 发版过程域（若启用；非契约 SSOT）

> **冲突裁决**：分册 AGENTS / 契约真相以**磁盘最新文件**为准；动手前 Read 重读，勿沿用会话早期摘要。

## 协作约定

- Commit / MR 标题与描述优先中文（可夹杂 `fix` / `docs` 等意图词）
- `docs/agent-kb/**` 文件名固定英文；规划文档文件名尽量中文

## 踩坑回流

时机见 alwaysApply `00`「交付收口」与 [agent-kb README](docs/agent-kb/README.md) **三问**；格式见 path rule `19`。  
根 Never do **只写一句话 + `→ Pn`**；现象 / 排障细节只写 [pitfalls](docs/agent-kb/pitfalls.md)，**勿双写**。新 `Pn` 须同步「路径速查」与「域速查」，并跑 `node scripts/agent-kb/lint-pitfalls.mjs`。

## Never do

> 红线**一句话**写在此；现象 / 排障细节以 [pitfalls](docs/agent-kb/pitfalls.md) 对应 `Pn` 为正文，**勿在两处各写细节**。格式：`一句话 → Pn`。

- Commit API keys、生产密码、含密配置 → P5
- 勿手改各宿主生成物（`.cursor/` / `.claude/` / `.trae/` 等 rules·hooks·mcp）；SSOT 为 `docs/agent-config/`（若 L5），改后跑 sync → P3
- 用 `mvn -pl backend -am` 或在仓库根直接 `mvn`（根无 pom）→ P1
- 集成测试改共享预置账号（demo/admin）密码后不恢复 → P2
- 手改 `.cursor/` `.codex/` `.agents/` 生成物而不改 `docs/agent-config/` → P3
- 改后端 REST（路径 / DTO / 错误码）却不同步 `docs/api/modules/01-account-login-auth.md` 与 `frontend/src/api/{client,types}.ts` → P4
- 把 `application.yml` 的演示 JWT 密钥当生产密钥或在日志中输出 token → P5

## Rules 索引

> 权威仍是本文件 + `docs/**`。下表只说明各宿主如何发现同步/行为约束。

**Cursor（若启用）：** alwaysApply `00-project-docs-overview` · `karpathy-guidelines`；path-scoped 见 `.cursor/rules/`（func/api/db/redis/jobs sync、agent-kb、superpowers 等）。

**Codex（若启用）：**
- 主指令：本文件 + 分册 AGENTS；**不要**期望 `.mdc` 自动注入
- 命令政策（非自然语言规范）：`.codex/rules/*.rules`（experimental）
- 触及契约/前端前优先用 `.agents/skills`：`contract-sync`（总览）、`api-doc-sync`、`db-doc-sync`、`redis-doc-sync`、`jobs-doc-sync`、`frontend-web`；再 Read `docs/**` 索引→真相
- MCP：trusted 后本机 `.codex/config.toml`（gitignore）← 审阅 `config.toml.example`；`/mcp` 验收；写库默认 `enabled=false`
- Hooks：`/hooks` 信任；fail-open；须含 `commandWindows`
